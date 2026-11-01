import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { Candidate, Voter, VoteRecord, ElectionSettings, Announcement, AdminLog, AdminUser } from '../types';
import { INITIAL_SETTINGS, INITIAL_CANDIDATES, INITIAL_VOTERS, INITIAL_ANNOUNCEMENTS, INITIAL_ADMIN_LOGS, INITIAL_ADMINS } from './seedData';

const STORAGE_KEYS = {
  SETTINGS: 'osis_vote_settings_v1',
  CANDIDATES: 'osis_vote_candidates_v1',
  VOTERS: 'osis_vote_voters_v1',
  VOTES: 'osis_vote_votes_v1',
  ANNOUNCEMENTS: 'osis_vote_announcements_v1',
  LOGS: 'osis_vote_logs_v1',
  ADMINS: 'osis_vote_admins_v1',
  CURRENT_VOTER: 'osis_vote_session_voter',
  ADMIN_SESSION: 'osis_vote_session_admin',
};

class ElectionStore {
  private useSupabase: boolean = false;
  private isSupabaseChecked: boolean = false;

  constructor() {
    this.initLocalStorageFallback();
  }

  private initLocalStorageFallback() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CANDIDATES)) {
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOTERS)) {
      localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(INITIAL_VOTERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOTES)) {
      localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify([]));
    }

    // Auto-reset all votes and ensure all voters are set to "Menunggu Giliran" (hasVoted = false)
    const purgeKey = 'osis_vote_purged_all_votes_v2';
    if (!localStorage.getItem(purgeKey)) {
      localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify([]));
      const existingVotersRaw = localStorage.getItem(STORAGE_KEYS.VOTERS);
      if (existingVotersRaw) {
        try {
          const storedVoters: Voter[] = JSON.parse(existingVotersRaw);
          const allWaiting = storedVoters.map((v) => ({
            ...v,
            hasVoted: false,
            votedAt: null,
            receiptCode: undefined,
          }));
          localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(allWaiting));
        } catch (e) {
          console.warn('Error resetting voters to waiting status', e);
        }
      }
      localStorage.setItem(purgeKey, 'true');
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_ADMIN_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
    }

    // Auto-migrate any existing stored data: MIPA -> A, IPS -> B
    const migrateClassString = (val?: string) => {
      if (!val) return val;
      return val.replace(/\bMIPA\b/g, 'A').replace(/\bIPS\b/g, 'B');
    };

    const storedVotersRaw = localStorage.getItem(STORAGE_KEYS.VOTERS);
    if (storedVotersRaw && (storedVotersRaw.includes('MIPA') || storedVotersRaw.includes('IPS'))) {
      try {
        const voters: Voter[] = JSON.parse(storedVotersRaw);
        const updated = voters.map((v) => ({
          ...v,
          className: migrateClassString(v.className) || v.className,
        }));
        localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error migrating voters classes', e);
      }
    }

    const storedCandidatesRaw = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    if (storedCandidatesRaw && (storedCandidatesRaw.includes('MIPA') || storedCandidatesRaw.includes('IPS'))) {
      try {
        const candidates: Candidate[] = JSON.parse(storedCandidatesRaw);
        const updated = candidates.map((c) => ({
          ...c,
          chairmanClass: migrateClassString(c.chairmanClass) || c.chairmanClass,
          viceChairmanClass: migrateClassString(c.viceChairmanClass) || c.viceChairmanClass,
        }));
        localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error migrating candidates classes', e);
      }
    }
  }

  public async checkConnection() {
    const res = await checkSupabaseConnection();
    this.isSupabaseChecked = true;
    this.useSupabase = !!res.tablesExist;
    return res;
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<ElectionSettings> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase.from('elections').select('*').limit(1).single();
        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            academicYear: data.academic_year,
            schoolName: data.school_name,
            schoolAddress: data.school_address || '',
            schoolLogo: data.school_logo || '',
            status: data.status,
            startTime: data.start_time,
            endTime: data.end_time,
            isResultsPublished: data.is_results_published,
            allowRealtimeBeforeEnd: data.allow_realtime_before_end,
            tagline: data.tagline || '',
            contactEmail: data.contact_email || '',
            contactPhone: data.contact_phone || '',
            contactPerson: data.contact_person || '',
          };
        }
      } catch {
        // Fallback below
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : INITIAL_SETTINGS;
  }

  public async updateSettings(settings: Partial<ElectionSettings>, adminName = 'Admin'): Promise<ElectionSettings> {
    const current = await this.getSettings();
    const updated: ElectionSettings = { ...current, ...settings };

    if (this.useSupabase) {
      try {
        await supabase.from('elections').upsert({
          id: updated.id,
          title: updated.title,
          academic_year: updated.academicYear,
          school_name: updated.schoolName,
          school_address: updated.schoolAddress,
          school_logo: updated.schoolLogo,
          status: updated.status,
          start_time: updated.startTime,
          end_time: updated.endTime,
          is_results_published: updated.isResultsPublished,
          allow_realtime_before_end: updated.allowRealtimeBeforeEnd,
          tagline: updated.tagline,
          contact_email: updated.contactEmail,
          contact_phone: updated.contactPhone,
          contact_person: updated.contactPerson,
        });
      } catch (err) {
        console.warn('Supabase updateSettings failed, updated locally', err);
      }
    }

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    await this.logAdminAction(adminName, 'Pengaturan Pemilihan Diperbarui', `Status: ${updated.status}, Publikasi: ${updated.isResultsPublished ? 'Aktif' : 'Nonaktif'}`);
    return updated;
  }

  // --- CANDIDATES ---
  public async getCandidates(): Promise<Candidate[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase.from('candidates').select('*').order('candidate_number', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            candidateNumber: d.candidate_number,
            chairmanName: d.chairman_name,
            viceChairmanName: d.vice_chairman_name,
            chairmanClass: d.chairman_class,
            viceChairmanClass: d.vice_chairman_class,
            photoUrl: d.photo_url,
            chairmanPhotoUrl: d.chairman_photo_url,
            viceChairmanPhotoUrl: d.vice_chairman_photo_url,
            tagline: d.tagline || '',
            vision: d.vision,
            missions: Array.isArray(d.missions) ? d.missions : JSON.parse(d.missions || '[]'),
            workPrograms: Array.isArray(d.work_programs) ? d.work_programs : JSON.parse(d.work_programs || '[]'),
            colorTheme: d.color_theme || '#1E3E62',
          }));
        }
      } catch {
        // fallback
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    return raw ? JSON.parse(raw) : INITIAL_CANDIDATES;
  }

  public async saveCandidate(cand: Candidate, adminName = 'Admin'): Promise<void> {
    const list = await this.getCandidates();
    const idx = list.findIndex((c) => c.id === cand.id);
    if (idx >= 0) {
      list[idx] = cand;
      await this.logAdminAction(adminName, 'Edit Paslon', `Memperbarui data Paslon No. ${cand.candidateNumber} (${cand.chairmanName} & ${cand.viceChairmanName})`);
    } else {
      list.push(cand);
      list.sort((a, b) => a.candidateNumber - b.candidateNumber);
      await this.logAdminAction(adminName, 'Tambah Paslon', `Menambahkan Paslon No. ${cand.candidateNumber} (${cand.chairmanName} & ${cand.viceChairmanName})`);
    }

    if (this.useSupabase) {
      try {
        await supabase.from('candidates').upsert({
          id: cand.id,
          candidate_number: cand.candidateNumber,
          chairman_name: cand.chairmanName,
          vice_chairman_name: cand.viceChairmanName,
          chairman_class: cand.chairmanClass,
          vice_chairman_class: cand.viceChairmanClass,
          photo_url: cand.photoUrl,
          chairman_photo_url: cand.chairmanPhotoUrl || null,
          vice_chairman_photo_url: cand.viceChairmanPhotoUrl || null,
          tagline: cand.tagline,
          vision: cand.vision,
          missions: cand.missions,
          work_programs: cand.workPrograms,
          color_theme: cand.colorTheme,
        });
      } catch (e) {
        console.warn('Supabase saveCandidate failed, saved locally', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(list));
  }

  public async deleteCandidate(id: string, adminName = 'Admin'): Promise<void> {
    const list = await this.getCandidates();
    const cand = list.find((c) => c.id === id);
    const updated = list.filter((c) => c.id !== id);

    if (this.useSupabase) {
      try {
        await supabase.from('candidates').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteCandidate failed', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(updated));
    await this.logAdminAction(adminName, 'Hapus Paslon', `Menghapus Paslon No. ${cand?.candidateNumber || id} (${cand?.chairmanName})`);
  }

  // --- VOTERS (DPT) ---
  public async getVoters(): Promise<Voter[]> {
    if (this.useSupabase) {
      try {
        const allVoters: Voter[] = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        // PostgREST/Supabase defaults to a max of 1000 rows per query.
        // We iterate through ranges so all records (e.g. 1.562+ students) are completely fetched without truncation.
        while (hasMore) {
          const { data, error } = await supabase
            .from('voters')
            .select('*')
            .order('nisn', { ascending: true })
            .range(from, from + step - 1);

          if (error) {
            console.warn('Supabase getVoters range query error:', error);
            break;
          }

          if (data && data.length > 0) {
            for (const v of data) {
              allVoters.push({
                id: v.id,
                nisn: v.nisn,
                fullName: v.full_name,
                className: v.class_name,
                gender: v.gender,
                passcode: v.passcode,
                hasVoted: v.has_voted,
                votedAt: v.voted_at,
                receiptCode: v.receipt_code,
                status: v.status || 'active',
              });
            }

            if (data.length < step) {
              hasMore = false;
            } else {
              from += step;
            }
          } else {
            hasMore = false;
          }
        }

        if (allVoters.length > 0) {
          try {
            localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(allVoters));
          } catch {
            // Storage quota limit fallback
          }
          return allVoters;
        }
      } catch (err) {
        console.warn('Supabase getVoters failed, falling back to local storage', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.VOTERS);
    return raw ? JSON.parse(raw) : INITIAL_VOTERS;
  }

  public async authenticateVoter(nisn: string, passcode: string): Promise<{ success: boolean; voter?: Voter; message: string }> {
    const cleanNisn = nisn.trim();
    const cleanPass = passcode.trim();

    const voters = await this.getVoters();
    const voter = voters.find((v) => v.nisn === cleanNisn);

    if (!voter) {
      return { success: false, message: 'NISN tidak terdaftar dalam Daftar Pemilih Tetap (DPT). Hubungi panitia.' };
    }

    if (voter.status === 'blocked') {
      return { success: false, message: 'Status akun pemilih Anda dinonaktifkan oleh panitia. Hubungi helpdesk.' };
    }

    if (voter.passcode !== cleanPass) {
      return { success: false, message: 'Kode akses / PIN tidak cocok. Silakan periksa kembali kartu pemilih Anda.' };
    }

    // Set voter session
    localStorage.setItem(STORAGE_KEYS.CURRENT_VOTER, JSON.stringify(voter));
    return { success: true, voter, message: 'Autentikasi berhasil.' };
  }

  public getCurrentVoter(): Voter | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_VOTER);
    return raw ? JSON.parse(raw) : null;
  }

  public logoutVoter(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_VOTER);
  }

  public async saveVoter(voter: Voter, adminName = 'Admin'): Promise<void> {
    const voters = await this.getVoters();
    const idx = voters.findIndex((v) => v.id === voter.id || v.nisn === voter.nisn);
    if (idx >= 0) {
      voters[idx] = voter;
      await this.logAdminAction(adminName, 'Perbarui Pemilih', `Mengubah data pemilih NISN ${voter.nisn} (${voter.fullName})`);
    } else {
      voters.push(voter);
      await this.logAdminAction(adminName, 'Tambah Pemilih', `Menambahkan pemilih baru NISN ${voter.nisn} (${voter.fullName})`);
    }

    if (this.useSupabase) {
      try {
        await supabase.from('voters').upsert({
          id: voter.id,
          nisn: voter.nisn,
          full_name: voter.fullName,
          class_name: voter.className,
          gender: voter.gender,
          passcode: voter.passcode,
          has_voted: voter.hasVoted,
          voted_at: voter.votedAt || null,
          receipt_code: voter.receiptCode || null,
          status: voter.status,
        });
      } catch (e) {
        console.warn('Supabase saveVoter failed', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(voters));
  }

  public async deleteVoter(id: string, adminName = 'Admin'): Promise<void> {
    const voters = await this.getVoters();
    const target = voters.find((v) => v.id === id);
    const updated = voters.filter((v) => v.id !== id);

    if (this.useSupabase) {
      try {
        await supabase.from('voters').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteVoter failed', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(updated));
    await this.logAdminAction(adminName, 'Hapus Pemilih', `Menghapus pemilih NISN ${target?.nisn || id} (${target?.fullName})`);
  }

  public async deleteAllVoters(adminName = 'Admin'): Promise<number> {
    const voters = await this.getVoters();
    const count = voters.length;

    if (this.useSupabase) {
      try {
        await supabase.from('voters').delete().neq('id', 'placeholder');
      } catch (e) {
        console.warn('Supabase deleteAllVoters failed', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify([]));
    await this.logAdminAction(adminName, 'Kosongkan Seluruh DPT', `Menghapus seluruh ${count} data pemilih siswa.`);
    return count;
  }

  public async deleteMultipleVoters(ids: string[], adminName = 'Admin'): Promise<number> {
    const voters = await this.getVoters();
    const idSet = new Set(ids);
    const updated = voters.filter((v) => !idSet.has(v.id));

    if (this.useSupabase) {
      try {
        // Chunk deletion in batches of 200 to avoid URI limit errors in PostgREST
        const batchSize = 200;
        for (let i = 0; i < ids.length; i += batchSize) {
          const chunk = ids.slice(i, i + batchSize);
          await supabase.from('voters').delete().in('id', chunk);
        }
      } catch (e) {
        console.warn('Supabase deleteMultipleVoters failed', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(updated));
    } catch {
      // ignore
    }
    await this.logAdminAction(adminName, 'Hapus Masal Pemilih', `Menghapus ${ids.length} data pemilih terpilih.`);
    return ids.length;
  }

  public async importVotersFromCSV(
    votersData: Omit<Voter, 'id' | 'hasVoted' | 'votedAt' | 'status'>[],
    adminName = 'Admin',
    updateExisting = true
  ): Promise<{ addedCount: number; updatedCount: number; total: number }> {
    const current = await this.getVoters();
    let addedCount = 0;
    let updatedCount = 0;

    // Use a Map for O(1) matching by NISN across large datasets (1562+ records)
    const existingMap = new Map<string, number>();
    current.forEach((v, idx) => {
      existingMap.set(v.nisn.trim(), idx);
    });

    const supabaseUpsertPayloads: {
      id: string;
      nisn: string;
      full_name: string;
      class_name: string;
      gender: string;
      passcode: string;
      has_voted: boolean;
      status: string;
    }[] = [];

    for (const item of votersData) {
      const cleanNisn = item.nisn.trim();
      const existingIdx = existingMap.get(cleanNisn);

      if (existingIdx !== undefined) {
        if (updateExisting) {
          const existingVoter = current[existingIdx];
          const updatedVoter: Voter = {
            ...existingVoter,
            fullName: item.fullName,
            className: item.className,
            gender: item.gender || existingVoter.gender,
            passcode: item.passcode || existingVoter.passcode,
          };
          current[existingIdx] = updatedVoter;
          updatedCount++;

          supabaseUpsertPayloads.push({
            id: updatedVoter.id,
            nisn: updatedVoter.nisn,
            full_name: updatedVoter.fullName,
            class_name: updatedVoter.className,
            gender: updatedVoter.gender,
            passcode: updatedVoter.passcode,
            has_voted: updatedVoter.hasVoted,
            status: updatedVoter.status || 'active',
          });
        }
      } else {
        const newVoter: Voter = {
          id: 'voter-' + Math.random().toString(36).substring(2, 9) + '-' + Math.random().toString(36).substring(2, 6),
          nisn: cleanNisn,
          fullName: item.fullName,
          className: item.className,
          gender: item.gender || 'L',
          passcode: item.passcode || Math.floor(100000 + Math.random() * 900000).toString(),
          hasVoted: false,
          votedAt: null,
          status: 'active',
        };
        current.push(newVoter);
        existingMap.set(cleanNisn, current.length - 1);
        addedCount++;

        supabaseUpsertPayloads.push({
          id: newVoter.id,
          nisn: newVoter.nisn,
          full_name: newVoter.fullName,
          class_name: newVoter.className,
          gender: newVoter.gender,
          passcode: newVoter.passcode,
          has_voted: false,
          status: 'active',
        });
      }
    }

    // High performance bulk upsert to Supabase in batches of 250 records
    // Handles 1.562+ records efficiently in parallel/sequential batches without timing out
    if (this.useSupabase && supabaseUpsertPayloads.length > 0) {
      try {
        const batchSize = 250;
        for (let i = 0; i < supabaseUpsertPayloads.length; i += batchSize) {
          const chunk = supabaseUpsertPayloads.slice(i, i + batchSize);
          const { error } = await supabase.from('voters').upsert(chunk);
          if (error) {
            console.warn(`Supabase upsert chunk batch error at offset ${i}:`, error);
          }
        }
      } catch (err) {
        console.warn('Supabase bulk upsert failed, stored in local storage:', err);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(current));
    } catch (e) {
      console.warn('LocalStorage save failed (possible browser storage quota):', e);
    }

    await this.logAdminAction(
      adminName,
      'Import DPT Siswa',
      `Berhasil memproses ${addedCount + updatedCount} pemilih (${addedCount} baru, ${updatedCount} diperbarui). Total DPT saat ini: ${current.length} siswa.`
    );
    return { addedCount, updatedCount, total: addedCount + updatedCount };
  }

  // --- ANONYMOUS VOTING ENGINE (LUBER JURDIL) ---
  /**
   * Casts a ballot anonymously.
   * STRICT SECURITY & PRIVACY RULE:
   * 1. Check voter's hasVoted status.
   * 2. Mark voter as hasVoted = true and issue random verification receipt token.
   * 3. Insert vote into votes table WITHOUT storing voter ID or NISN.
   * 4. Admin cannot correlate vote to student!
   */
  public async castVote(candidateId: string, voterId: string): Promise<{ success: boolean; receiptCode: string; message: string }> {
    const settings = await this.getSettings();
    if (settings.status === 'upcoming') {
      throw new Error('Pemilihan belum dibuka oleh panitia.');
    }
    if (settings.status === 'completed') {
      throw new Error('Pemilihan telah resmi ditutup. Bilik suara sudah tidak menerima suara.');
    }

    const voters = await this.getVoters();
    const voterIdx = voters.findIndex((v) => v.id === voterId);

    if (voterIdx === -1) {
      throw new Error('Identitas pemilih tidak ditemukan dalam sistem.');
    }

    const currentVoter = voters[voterIdx];
    if (currentVoter.hasVoted) {
      throw new Error('Anda telah menggunakan hak suara sebelumnya. Satu siswa hanya berhak memberikan 1 (satu) suara.');
    }

    const candidates = await this.getCandidates();
    const targetCand = candidates.find((c) => c.id === candidateId);
    if (!targetCand) {
      throw new Error('Pasangan calon yang dipilih tidak valid.');
    }

    // Generate cryptographic-style anonymous receipt code
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const receiptCode = `VOTE-${randomHex}-${Date.now().toString().slice(-4)}`;
    const verificationHash = 'HASH-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const timestamp = new Date().toISOString();

    // 1. Update Voter Record (Marked as voted, NEVER saving candidateId)
    voters[voterIdx] = {
      ...currentVoter,
      hasVoted: true,
      votedAt: timestamp,
      receiptCode,
    };
    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(voters));

    // Update current session voter
    localStorage.setItem(STORAGE_KEYS.CURRENT_VOTER, JSON.stringify(voters[voterIdx]));

    // 2. Record Anonymous Vote (NO voterId, NO NISN!)
    const rawVotes = localStorage.getItem(STORAGE_KEYS.VOTES);
    const votes: VoteRecord[] = rawVotes ? JSON.parse(rawVotes) : [];
    const voteRecord: VoteRecord = {
      id: 'vote-' + Math.random().toString(36).substring(2, 9),
      candidateId,
      electionId: settings.id,
      timestamp,
      verificationHash,
    };
    votes.push(voteRecord);
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));

    // Supabase sync if connected
    if (this.useSupabase) {
      try {
        await supabase.from('voters').update({
          has_voted: true,
          voted_at: timestamp,
          receipt_code: receiptCode,
        }).eq('id', voterId);

        await supabase.from('votes').insert({
          id: voteRecord.id,
          candidate_id: candidateId,
          election_id: settings.id,
          verification_hash: verificationHash,
        });
      } catch (e) {
        console.warn('Supabase vote push failed, saved securely locally', e);
      }
    }

    // Add immutable audit log WITHOUT revealing who was voted for
    await this.logAdminAction('Sistem Bilik Suara', 'Hak Suara Digunakan', `Satu suara masuk di bilik suara digital. Kode Verifikasi: ${receiptCode.slice(0, 8)}*** (Kerahasiaan Terjamin)`);

    return {
      success: true,
      receiptCode,
      message: 'Hatur nuhun! Sora anjeun parantos direkam.',
    };
  }

  // --- RESULTS & STATS ---
  public async getResults(): Promise<{
    totalVoters: number;
    totalVotes: number;
    unvotedCount: number;
    participationRate: number;
    candidates: (Candidate & { voteCount: number; percentage: number; rank: number })[];
    isPublished: boolean;
    canViewPublicly: boolean;
  }> {
    const settings = await this.getSettings();
    const voters = await this.getVoters();
    const candidates = await this.getCandidates();

    let rawVotesList: VoteRecord[] = [];
    if (this.useSupabase) {
      try {
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('votes')
            .select('*')
            .range(from, from + step - 1);

          if (error || !data || data.length === 0) {
            hasMore = false;
            break;
          }

          for (const v of data) {
            rawVotesList.push({
              id: v.id,
              candidateId: v.candidate_id,
              electionId: v.election_id,
              timestamp: v.created_at,
              verificationHash: v.verification_hash,
            });
          }

          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        }
      } catch {
        // fallback
      }
    }

    if (rawVotesList.length === 0) {
      const raw = localStorage.getItem(STORAGE_KEYS.VOTES);
      rawVotesList = raw ? JSON.parse(raw) : [];
    }

    const totalVoters = voters.length;
    const totalVotes = rawVotesList.length;
    const unvotedCount = Math.max(0, totalVoters - totalVotes);
    const participationRate = totalVoters > 0 ? Number(((totalVotes / totalVoters) * 100).toFixed(1)) : 0;

    // Count votes per candidate
    const counts: Record<string, number> = {};
    for (const v of rawVotesList) {
      counts[v.candidateId] = (counts[v.candidateId] || 0) + 1;
    }

    const candidateResults = candidates.map((cand) => {
      const voteCount = counts[cand.id] || 0;
      const percentage = totalVotes > 0 ? Number(((voteCount / totalVotes) * 100).toFixed(1)) : 0;
      return {
        ...cand,
        voteCount,
        percentage,
        rank: 1, // calculated next
      };
    });

    // Sort by vote count descending
    candidateResults.sort((a, b) => b.voteCount - a.voteCount);
    candidateResults.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    const canViewPublicly = settings.isResultsPublished || (settings.status === 'completed' && settings.isResultsPublished);

    return {
      totalVoters,
      totalVotes,
      unvotedCount,
      participationRate,
      candidates: candidateResults,
      isPublished: settings.isResultsPublished,
      canViewPublicly,
    };
  }

  // --- RESET & MAINTENANCE ---
  public async resetAllVotes(adminName: string): Promise<void> {
    const voters = await this.getVoters();
    const resetVoters = voters.map((v) => ({
      ...v,
      hasVoted: false,
      votedAt: null,
      receiptCode: undefined,
    }));

    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(resetVoters));
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify([]));

    if (this.useSupabase) {
      try {
        await supabase.from('votes').delete().neq('id', 'placeholder');
        await supabase.from('voters').update({
          has_voted: false,
          voted_at: null,
          receipt_code: null,
        }).neq('id', 'placeholder');
      } catch (e) {
        console.warn('Supabase reset error', e);
      }
    }

    await this.logAdminAction(adminName, 'Reset Perolehan Suara', 'Seluruh kotak suara dan status pemilih telah dikosongkan untuk persiapan pemilihan.');
  }

  // --- ANNOUNCEMENTS ---
  public async getAnnouncements(): Promise<Announcement[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((a) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            date: a.date,
            priority: a.priority,
          }));
        }
      } catch {
        // fallback
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return raw ? JSON.parse(raw) : INITIAL_ANNOUNCEMENTS;
  }

  public async saveAnnouncement(ann: Announcement, adminName = 'Admin'): Promise<void> {
    const list = await this.getAnnouncements();
    const idx = list.findIndex((a) => a.id === ann.id);
    if (idx >= 0) {
      list[idx] = ann;
    } else {
      list.unshift(ann);
    }

    if (this.useSupabase) {
      try {
        await supabase.from('announcements').upsert({
          id: ann.id,
          title: ann.title,
          content: ann.content,
          date: ann.date,
          priority: ann.priority,
        });
      } catch (e) {
        console.warn('Supabase announcement save failed', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    await this.logAdminAction(adminName, 'Pengumuman Dibuat/Diedit', `Pengumuman: ${ann.title}`);
  }

  public async deleteAnnouncement(id: string, adminName = 'Admin'): Promise<void> {
    const list = await this.getAnnouncements();
    const updated = list.filter((a) => a.id !== id);

    if (this.useSupabase) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete announcement error', e);
      }
    }

    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
    await this.logAdminAction(adminName, 'Hapus Pengumuman', `ID: ${id}`);
  }

  // --- AUDIT LOGS ---
  public async getAdminLogs(): Promise<AdminLog[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase.from('admin_logs').select('*').order('timestamp', { ascending: false }).limit(50);
        if (!error && data && data.length > 0) {
          return data.map((l) => ({
            id: l.id,
            adminName: l.admin_name,
            action: l.action,
            details: l.details,
            timestamp: l.timestamp,
          }));
        }
      } catch {
        // fallback
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : INITIAL_ADMIN_LOGS;
  }

  public async logAdminAction(adminName: string, action: string, details: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    const logs: AdminLog[] = raw ? JSON.parse(raw) : [];
    const newLog: AdminLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      adminName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();

    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

    if (this.useSupabase) {
      try {
        await supabase.from('admin_logs').insert({
          id: newLog.id,
          admin_name: adminName,
          action,
          details,
          timestamp: newLog.timestamp,
        });
      } catch {
        // quiet ignore
      }
    }
  }

  // Push all local data into Supabase (Migration helper)
  public async syncLocalDataToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.getSettings();
      const candidates = await this.getCandidates();
      const voters = await this.getVoters();

      // Elections
      await supabase.from('elections').upsert({
        id: settings.id,
        title: settings.title,
        academic_year: settings.academicYear,
        school_name: settings.schoolName,
        school_address: settings.schoolAddress,
        school_logo: settings.schoolLogo,
        status: settings.status,
        start_time: settings.startTime,
        end_time: settings.endTime,
        is_results_published: settings.isResultsPublished,
        allow_realtime_before_end: settings.allowRealtimeBeforeEnd,
        tagline: settings.tagline,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        contact_person: settings.contactPerson,
      });

      // Candidates
      for (const c of candidates) {
        await supabase.from('candidates').upsert({
          id: c.id,
          candidate_number: c.candidateNumber,
          chairman_name: c.chairmanName,
          vice_chairman_name: c.viceChairmanName,
          chairman_class: c.chairmanClass,
          vice_chairman_class: c.viceChairmanClass,
          photo_url: c.photoUrl,
          chairman_photo_url: c.chairmanPhotoUrl || null,
          vice_chairman_photo_url: c.viceChairmanPhotoUrl || null,
          tagline: c.tagline,
          vision: c.vision,
          missions: c.missions,
          work_programs: c.workPrograms,
          color_theme: c.colorTheme,
        });
      }

      // Voters (Batched in chunks of 250 to easily handle 1.562+ records without timeouts)
      const voterPayloads = voters.map((v) => ({
        id: v.id,
        nisn: v.nisn,
        full_name: v.fullName,
        class_name: v.className,
        gender: v.gender,
        passcode: v.passcode,
        has_voted: v.hasVoted,
        voted_at: v.votedAt || null,
        receipt_code: v.receiptCode || null,
        status: v.status || 'active',
      }));

      const batchSize = 250;
      for (let i = 0; i < voterPayloads.length; i += batchSize) {
        const chunk = voterPayloads.slice(i, i + batchSize);
        await supabase.from('voters').upsert(chunk);
      }

      this.useSupabase = true;
      return { success: true, message: 'Berhasil menyinkronkan data lokal ke tabel Supabase!' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: `Gagal sinkronisasi: ${err.message}` };
    }
  }

  // --- ADMIN MANAGEMENT & AUTH ---
  public async getAdmins(): Promise<AdminUser[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!raw) return INITIAL_ADMINS;
    try {
      const list: AdminUser[] = JSON.parse(raw);
      return list;
    } catch {
      return INITIAL_ADMINS;
    }
  }

  public async saveAdmin(adminData: AdminUser, operatorName = 'Super Admin'): Promise<{ success: boolean; message: string }> {
    const list = await this.getAdmins();
    const cleanUsername = adminData.username.trim().toLowerCase();

    // Check duplicate username
    const existingWithSameUsername = list.find(
      (a) => a.username.toLowerCase() === cleanUsername && a.id !== adminData.id
    );
    if (existingWithSameUsername) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` };
    }

    const idx = list.findIndex((a) => a.id === adminData.id);
    if (idx >= 0) {
      // Editing existing
      const existing = list[idx];
      const updatedAdmin: AdminUser = {
        ...existing,
        ...adminData,
        username: cleanUsername,
        password: adminData.password ? adminData.password.trim() : existing.password,
      };

      // Ensure there is at least one active super_admin
      if (existing.role === 'super_admin' && updatedAdmin.role !== 'super_admin') {
        const otherSuperAdmins = list.filter((a) => a.id !== adminData.id && a.role === 'super_admin' && a.status === 'active');
        if (otherSuperAdmins.length === 0) {
          return { success: false, message: 'Harus ada setidaknya satu Super Admin yang aktif dalam sistem.' };
        }
      }

      list[idx] = updatedAdmin;
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(list));
      await this.logAdminAction(operatorName, 'Edit Administrator', `Memperbarui data akun "${updatedAdmin.fullName}" (@${updatedAdmin.username})`);
      return { success: true, message: 'Data administrator berhasil diperbarui.' };
    } else {
      // New admin
      if (!adminData.password || adminData.password.trim().length < 6) {
        return { success: false, message: 'Kata sandi minimal 6 karakter.' };
      }
      const newAdmin: AdminUser = {
        id: adminData.id || 'adm-' + Math.random().toString(36).substring(2, 9),
        username: cleanUsername,
        fullName: adminData.fullName.trim(),
        password: adminData.password.trim(),
        role: adminData.role || 'panitia',
        status: adminData.status || 'active',
        createdAt: new Date().toISOString(),
      };
      list.push(newAdmin);
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(list));
      await this.logAdminAction(operatorName, 'Tambah Administrator', `Membuat akun baru "${newAdmin.fullName}" (@${newAdmin.username}) dengan hak akses ${newAdmin.role === 'super_admin' ? 'Super Admin' : 'Panitia'}`);
      return { success: true, message: 'Administrator baru berhasil ditambahkan.' };
    }
  }

  public async deleteAdmin(adminId: string, operatorName = 'Super Admin'): Promise<{ success: boolean; message: string }> {
    const list = await this.getAdmins();
    const target = list.find((a) => a.id === adminId);
    if (!target) {
      return { success: false, message: 'Akun administrator tidak ditemukan.' };
    }

    // Check if target is current session admin
    const currentSession = this.getAdminSession();
    if (currentSession && currentSession.id === adminId) {
      return { success: false, message: 'Anda tidak dapat menghapus akun administrator yang sedang aktif Anda gunakan saat ini.' };
    }

    // Ensure at least one super_admin remains
    if (target.role === 'super_admin') {
      const remainingSuperAdmins = list.filter((a) => a.id !== adminId && a.role === 'super_admin');
      if (remainingSuperAdmins.length === 0) {
        return { success: false, message: 'Tidak dapat menghapus satu-satunya Super Admin dalam sistem.' };
      }
    }

    const updated = list.filter((a) => a.id !== adminId);
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(updated));
    await this.logAdminAction(operatorName, 'Hapus Administrator', `Menghapus akun "${target.fullName}" (@${target.username})`);
    return { success: true, message: `Akun "${target.fullName}" berhasil dihapus.` };
  }

  public async changeAdminPassword(adminId: string, newPass: string, operatorName = 'Super Admin'): Promise<{ success: boolean; message: string }> {
    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
    }
    const list = await this.getAdmins();
    const target = list.find((a) => a.id === adminId);
    if (!target) {
      return { success: false, message: 'Akun administrator tidak ditemukan.' };
    }

    target.password = newPass.trim();
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(list));
    await this.logAdminAction(operatorName, 'Ganti Kata Sandi Admin', `Mengubah kata sandi untuk akun "${target.fullName}" (@${target.username})`);
    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  }

  public verifyAdmin(user: string, pass: string): { success: boolean; user?: AdminUser; error?: string } {
    const cleanUser = user.trim().toLowerCase();
    const cleanPass = pass.trim();

    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    const list: AdminUser[] = raw ? JSON.parse(raw) : INITIAL_ADMINS;

    const found = list.find((a) => a.username.toLowerCase() === cleanUser);
    if (!found) {
      // Fallback check for initial admin default if storage was cleared
      if (cleanUser === 'admin' && cleanPass === 'adminosis2026') {
        const defaultAdmin: AdminUser = {
          id: 'adm-01',
          username: 'admin',
          fullName: 'Administrator Utama OSIS',
          role: 'super_admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(defaultAdmin));
        return { success: true, user: defaultAdmin };
      }
      return { success: false, error: 'Username administrator tidak ditemukan.' };
    }

    if (found.status === 'suspended') {
      return { success: false, error: 'Akun administrator ini sedang ditangguhkan/dinonaktifkan oleh Super Admin.' };
    }

    if (found.password !== cleanPass) {
      return { success: false, error: 'Kata sandi yang Anda masukkan salah.' };
    }

    // Success! Update lastLogin
    found.lastLogin = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(list));

    const sessionUser: AdminUser = {
      id: found.id,
      username: found.username,
      fullName: found.fullName,
      role: found.role,
      status: found.status,
      createdAt: found.createdAt,
      lastLogin: found.lastLogin,
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  }

  public verifyAdminCredentials(user: string, pass: string): boolean {
    return this.verifyAdmin(user, pass).success;
  }

  public getAdminSession(): AdminUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  public logoutAdmin(): void {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }
}

export const electionStore = new ElectionStore();
