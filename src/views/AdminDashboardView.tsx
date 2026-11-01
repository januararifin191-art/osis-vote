import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Vote,
  Award,
  Settings,
  Shield,
  LogOut,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Database,
  History,
  Bell,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  CheckSquare,
  UserCheck,
  ShieldCheck,
  Key,
  UserX,
  Crown,
  Lock,
  UserPlus,
  RotateCcw
} from 'lucide-react';
import { Candidate, Voter, ElectionSettings, Announcement, AdminLog, AdminUser } from '../types';
import { electionStore } from '../services/store';
import { SUPABASE_SQL_SCHEMA, checkSupabaseConnection, getSupabaseConfig, updateSupabaseConfig } from '../lib/supabase';
import { parseAllVoterLines, DelimiterType, ParsedVoterItem } from '../utils/voterParser';

interface AdminDashboardViewProps {
  settings: ElectionSettings | null;
  onSettingsUpdate: (settings: ElectionSettings) => void;
  onLogoutAdmin: () => void;
  onNavigate: (view: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  settings,
  onSettingsUpdate,
  onLogoutAdmin,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'voters' | 'settings' | 'announcements' | 'logs' | 'database' | 'admins'>('overview');

  // Local state for management
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentSessionAdmin, setCurrentSessionAdmin] = useState<AdminUser | null>(null);
  const [resultsData, setResultsData] = useState<{
    totalVoters: number;
    totalVotes: number;
    unvotedCount: number;
    participationRate: number;
    candidates: (Candidate & { voteCount: number; percentage: number; rank: number })[];
  } | null>(null);

  // Candidate Form Modal
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

  // Voter Form / Edit Modal
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [isEditVoterModalOpen, setIsEditVoterModalOpen] = useState(false);
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
  const [newVoterNisn, setNewVoterNisn] = useState('');
  const [newVoterName, setNewVoterName] = useState('');
  const [newVoterClass, setNewVoterClass] = useState('X A 1');
  const [newVoterPasscode, setNewVoterPasscode] = useState('');
  const [newVoterGender, setNewVoterGender] = useState<'L' | 'P'>('L');

  // Admin Management State & Modals
  const [isManageAdminModalOpen, setIsManageAdminModalOpen] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<'create' | 'edit'>('create');
  const [adminFormId, setAdminFormId] = useState('');
  const [adminFormFullName, setAdminFormFullName] = useState('');
  const [adminFormUsername, setAdminFormUsername] = useState('');
  const [adminFormPassword, setAdminFormPassword] = useState('');
  const [adminFormRole, setAdminFormRole] = useState<'super_admin' | 'panitia'>('panitia');
  const [adminFormStatus, setAdminFormStatus] = useState<'active' | 'suspended'>('active');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Change Password Modal
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [targetAdminForPassword, setTargetAdminForPassword] = useState<AdminUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Admin Search & Filter
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<'ALL' | 'super_admin' | 'panitia'>('ALL');
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-App Confirmation Modal (Replaces window.confirm/prompt to prevent iframe blocking)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // CSV / Table Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [importDelimiter, setImportDelimiter] = useState<DelimiterType>('auto');
  const [importUpdateExisting, setImportUpdateExisting] = useState<boolean>(true);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importNoticeType, setImportNoticeType] = useState<'success' | 'error' | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Search & Filter in Voters Tab
  const [voterSearch, setVoterSearch] = useState('');
  const [voterFilterClass, setVoterFilterClass] = useState('ALL');
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);
  const [voterPage, setVoterPage] = useState<number>(1);
  const [votersPerPage, setVotersPerPage] = useState<number>(50);

  // Real-time parsed rows for table import preview (protects titles/gelar in 1 field)
  const parsedPreviewList = useMemo(() => {
    return parseAllVoterLines(
      csvRawText,
      importDelimiter,
      voterFilterClass !== 'ALL' ? voterFilterClass : 'X A 1'
    );
  }, [csvRawText, importDelimiter, voterFilterClass]);

  // Announcement Form Modal
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  // Database status & configuration
  const initialCfg = getSupabaseConfig();
  const [customDbUrl, setCustomDbUrl] = useState(initialCfg.url);
  const [customDbAnonKey, setCustomDbAnonKey] = useState(initialCfg.anonKey);
  const [saveDbNotice, setSaveDbNotice] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string; tablesExist?: boolean }>({ ok: false, message: 'Memeriksa...' });
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // School settings logo state
  const [settingsLogo, setSettingsLogo] = useState(settings?.schoolLogo || '');
  useEffect(() => {
    if (settings?.schoolLogo) setSettingsLogo(settings.schoolLogo);
  }, [settings?.schoolLogo]);

  useEffect(() => {
    loadAllAdminData();
    checkDb();
  }, []);

  const loadAllAdminData = async () => {
    const [cands, vts, anns, logs, results, adminList] = await Promise.all([
      electionStore.getCandidates(),
      electionStore.getVoters(),
      electionStore.getAnnouncements(),
      electionStore.getAdminLogs(),
      electionStore.getResults(),
      electionStore.getAdmins(),
    ]);
    setCandidates(cands);
    setVoters(vts);
    setAnnouncements(anns);
    setAdminLogs(logs);
    setResultsData(results);
    setAdmins(adminList);
    setCurrentSessionAdmin(electionStore.getAdminSession());
  };

  const checkDb = async () => {
    const res = await checkSupabaseConnection();
    setDbStatus(res);
  };

  // --- ACTIONS: ADMIN MANAGEMENT ---
  const handleOpenAddAdmin = () => {
    setAdminModalMode('create');
    setAdminFormId('adm-' + Math.random().toString(36).substring(2, 8));
    setAdminFormFullName('');
    setAdminFormUsername('');
    setAdminFormPassword('');
    setAdminFormRole('panitia');
    setAdminFormStatus('active');
    setShowAdminPassword(false);
    setIsManageAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (adm: AdminUser) => {
    setAdminModalMode('edit');
    setAdminFormId(adm.id);
    setAdminFormFullName(adm.fullName);
    setAdminFormUsername(adm.username);
    setAdminFormPassword('');
    setAdminFormRole(adm.role);
    setAdminFormStatus(adm.status);
    setShowAdminPassword(false);
    setIsManageAdminModalOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormFullName.trim() || !adminFormUsername.trim()) {
      setAdminNotice({ type: 'error', message: 'Nama lengkap dan username tidak boleh kosong.' });
      return;
    }

    if (adminModalMode === 'create' && (!adminFormPassword || adminFormPassword.length < 6)) {
      setAdminNotice({ type: 'error', message: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    const payload: AdminUser = {
      id: adminFormId,
      fullName: adminFormFullName.trim(),
      username: adminFormUsername.trim().toLowerCase(),
      password: adminFormPassword ? adminFormPassword.trim() : undefined,
      role: adminFormRole,
      status: adminFormStatus,
      createdAt: adminModalMode === 'create' ? new Date().toISOString() : (admins.find(a => a.id === adminFormId)?.createdAt || new Date().toISOString()),
    };

    const res = await electionStore.saveAdmin(payload, currentSessionAdmin?.fullName || 'Super Admin');
    if (res.success) {
      setAdminNotice({ type: 'success', message: res.message });
      setIsManageAdminModalOpen(false);
      await loadAllAdminData();
      setTimeout(() => setAdminNotice(null), 4000);
    } else {
      setAdminNotice({ type: 'error', message: res.message });
    }
  };

  const handleOpenChangePassword = (adm: AdminUser) => {
    setTargetAdminForPassword(adm);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setShowNewPassword(false);
    setIsChangePasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdminForPassword) return;

    if (newPasswordInput.length < 6) {
      setAdminNotice({ type: 'error', message: 'Kata sandi baru minimal harus 6 karakter.' });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setAdminNotice({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const res = await electionStore.changeAdminPassword(
      targetAdminForPassword.id,
      newPasswordInput,
      currentSessionAdmin?.fullName || 'Super Admin'
    );

    if (res.success) {
      setAdminNotice({ type: 'success', message: `Kata sandi untuk @${targetAdminForPassword.username} berhasil diubah.` });
      setIsChangePasswordModalOpen(false);
      await loadAllAdminData();
      setTimeout(() => setAdminNotice(null), 4000);
    } else {
      setAdminNotice({ type: 'error', message: res.message });
    }
  };

  const handleToggleAdminStatus = async (adm: AdminUser) => {
    if (currentSessionAdmin?.id === adm.id) {
      setAdminNotice({ type: 'error', message: 'Anda tidak dapat menonaktifkan akun sendiri yang sedang aktif digunakan.' });
      return;
    }

    const newStatus = adm.status === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'active' ? 'mengaktifkan kembali' : 'menangguhkan (nonaktifkan)';

    setConfirmModal({
      isOpen: true,
      title: `${newStatus === 'active' ? 'Aktifkan' : 'Tangguhkan'} Akun Admin?`,
      message: `Apakah Anda yakin ingin ${actionText} akses untuk akun "${adm.fullName}" (@${adm.username})?`,
      actionLabel: newStatus === 'active' ? 'Ya, Aktifkan' : 'Ya, Tangguhkan',
      isDanger: newStatus === 'suspended',
      onConfirm: async () => {
        const res = await electionStore.saveAdmin({
          ...adm,
          status: newStatus,
        }, currentSessionAdmin?.fullName || 'Super Admin');

        if (res.success) {
          setAdminNotice({ type: 'success', message: `Status akun @${adm.username} berhasil diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Ditangguhkan'}.` });
          await loadAllAdminData();
          setTimeout(() => setAdminNotice(null), 4000);
        } else {
          setAdminNotice({ type: 'error', message: res.message });
        }
      }
    });
  };

  const handleDeleteAdmin = (adm: AdminUser) => {
    if (currentSessionAdmin?.id === adm.id) {
      setAdminNotice({ type: 'error', message: 'Anda tidak dapat menghapus akun administrator yang sedang aktif Anda gunakan.' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Administrator?',
      message: `Tindakan ini tidak dapat dibatalkan. Akun "${adm.fullName}" (@${adm.username}) akan dihapus secara permanen dari sistem.`,
      actionLabel: 'Ya, Hapus Admin',
      isDanger: true,
      onConfirm: async () => {
        const res = await electionStore.deleteAdmin(adm.id, currentSessionAdmin?.fullName || 'Super Admin');
        if (res.success) {
          setAdminNotice({ type: 'success', message: res.message });
          await loadAllAdminData();
          setTimeout(() => setAdminNotice(null), 4000);
        } else {
          setAdminNotice({ type: 'error', message: res.message });
        }
      }
    });
  };

  // --- ACTIONS: CANDIDATE ---
  const handleOpenAddCandidate = () => {
    setEditingCandidate({
      id: 'cand-' + Math.random().toString(36).substring(2, 7),
      candidateNumber: candidates.length + 1,
      chairmanName: '',
      viceChairmanName: '',
      chairmanClass: 'XI A 1',
      viceChairmanClass: 'XI B 1',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      tagline: '',
      vision: '',
      missions: ['Meningkatkan transparansi dan kedisiplinan organisasi.', 'Mewadahi bakat siswa di bidang sains dan seni.'],
      workPrograms: [
        { title: 'Program Kerja 1', description: 'Deskripsi program', category: 'Kesiswaan' }
      ],
      colorTheme: '#1E3E62'
    });
    setIsCandidateModalOpen(true);
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    await electionStore.saveCandidate(editingCandidate, 'Admin');
    setIsCandidateModalOpen(false);
    setEditingCandidate(null);
    await loadAllAdminData();
  };

  const handleDeleteCandidate = (cand: Candidate) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pasangan Calon',
      message: `Apakah Anda yakin ingin menghapus Paslon No. 0${cand.candidateNumber} (${cand.chairmanName} & ${cand.viceChairmanName})?`,
      actionLabel: 'Ya, Hapus Paslon',
      isDanger: true,
      onConfirm: async () => {
        await electionStore.deleteCandidate(cand.id, 'Admin');
        await loadAllAdminData();
      },
    });
  };

  // --- ACTIONS: VOTERS ---
  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoterNisn.trim() || !newVoterName.trim()) return;

    const newV: Voter = {
      id: 'voter-' + Math.random().toString(36).substring(2, 9),
      nisn: newVoterNisn.trim(),
      fullName: newVoterName.trim(),
      className: newVoterClass,
      gender: newVoterGender,
      passcode: newVoterPasscode.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
      hasVoted: false,
      votedAt: null,
      status: 'active',
    };

    await electionStore.saveVoter(newV, 'Admin');
    setNewVoterNisn('');
    setNewVoterName('');
    setNewVoterPasscode('');
    setIsVoterModalOpen(false);
    await loadAllAdminData();
  };

  const handleOpenEditVoter = (v: Voter) => {
    setEditingVoter({ ...v });
    setIsEditVoterModalOpen(true);
  };

  const handleSaveEditedVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoter) return;
    await electionStore.saveVoter(editingVoter, 'Admin');
    setIsEditVoterModalOpen(false);
    setEditingVoter(null);
    await loadAllAdminData();
  };

  const handleDeleteVoter = (v: Voter) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pemilih dari DPT',
      message: `Hapus siswa ${v.fullName} (NISN: ${v.nisn}, Kelas: ${v.className}) dari Daftar Pemilih Tetap?`,
      actionLabel: 'Ya, Hapus Siswa',
      isDanger: true,
      onConfirm: async () => {
        await electionStore.deleteVoter(v.id, 'Admin');
        setSelectedVoterIds((prev) => prev.filter((i) => i !== v.id));
        await loadAllAdminData();
      },
    });
  };

  const handleDeleteSelectedVoters = () => {
    if (selectedVoterIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Masal Pemilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedVoterIds.length} data pemilih yang dicentang dari DPT?`,
      actionLabel: `Ya, Hapus ${selectedVoterIds.length} Siswa`,
      isDanger: true,
      onConfirm: async () => {
        await electionStore.deleteMultipleVoters(selectedVoterIds, 'Admin');
        setSelectedVoterIds([]);
        await loadAllAdminData();
      },
    });
  };

  const handleClearAllVoters = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh DPT Siswa',
      message: `PERINGATAN: Tindakan ini akan menghapus seluruh data siswa di Daftar Pemilih Tetap (${voters.length} siswa). Gunakan jika Anda ingin memasukkan data pemilih yang baru. Lanjutkan?`,
      actionLabel: 'Ya, Kosongkan Seluruh DPT',
      isDanger: true,
      onConfirm: async () => {
        await electionStore.deleteAllVoters('Admin');
        setSelectedVoterIds([]);
        await loadAllAdminData();
      },
    });
  };

  const handleDownloadTemplateCSV = () => {
    // Template explicitly demonstrating names with academic titles (gelar) with dots and commas
    const template =
      'NISN,Nama Lengkap,Kelas,Jenis Kelamin,PIN\n' +
      '"0081234501","Drs. H. Januar Arifin, M.Pd.","X A 1","L","123456"\n' +
      '"0081234502","Siti Rahmawati, S.Pd., M.Si.","X A 2","P","234567"\n' +
      '"0081234503","Budi Gunawan, S.Kom.","XI B 1","L","345678"\n' +
      '"0081234504","Dewi Lestari, S.T., M.Eng.","XII A 1","P","456789"\n' +
      '"0081234505","Muhammad Farhan","XII B 2","L","567890"\n';

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_DPT_Dengan_Gelar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplateExcelTab = () => {
    // Tab-delimited format (direct copy-paste from Excel)
    const template =
      'NISN\tNama Lengkap\tKelas\tJenis Kelamin\tPIN\n' +
      '0081234501\tDrs. H. Januar Arifin, M.Pd.\tX A 1\tL\t123456\n' +
      '0081234502\tSiti Rahmawati, S.Pd., M.Si.\tX A 2\tP\t234567\n' +
      '0081234503\tBudi Gunawan, S.Kom.\tXI B 1\tL\t345678\n' +
      '0081234504\tDewi Lestari, S.T.\tXII A 1\tP\t456789\n';

    const blob = new Blob([template], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_DPT_Excel_Tab.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async () => {
    const validRows = parsedPreviewList.filter((p) => p.isValid);
    if (validRows.length === 0) {
      setImportNoticeType('error');
      setImportNotice('Tidak ada data valid yang siap diimpor. Silakan periksa kembali teks atau file yang dimasukkan.');
      return;
    }

    setIsImporting(true);
    setImportNotice(null);
    setImportNoticeType(null);

    try {
      const dataToImport = validRows.map((item) => ({
        nisn: item.nisn,
        fullName: item.fullName,
        className: item.className,
        gender: item.gender,
        passcode: item.passcode,
      }));

      const res = await electionStore.importVotersFromCSV(
        dataToImport,
        currentSessionAdmin?.fullName || 'Admin',
        importUpdateExisting
      );

      setImportNoticeType('success');
      setImportNotice(
        `Sukses! Berhasil memproses ${res.total} data pemilih (${res.addedCount} pemilih baru ditambahkan, ${res.updatedCount} pemilih diperbarui). Seluruh nama dan gelar akademik tersimpan utuh dalam 1 field.`
      );

      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportNotice(null);
        setImportNoticeType(null);
        setCsvRawText('');
        setIsImporting(false);
        loadAllAdminData();
      }, 2000);
    } catch (err: unknown) {
      setIsImporting(false);
      setImportNoticeType('error');
      setImportNotice(err instanceof Error ? err.message : 'Gagal mengimpor data siswa.');
    }
  };

  const handleExportCSV = () => {
    const headers = 'NISN,Nama Lengkap,Kelas,Jenis Kelamin,Status Memilih,Waktu Memilih,Kode Tanda Terima\n';
    const rows = voters
      .map(
        (v) =>
          `"${v.nisn}","${v.fullName}","${v.className}","${v.gender}","${
            v.hasVoted ? 'Sudah Memilih' : 'Belum Memilih'
          }","${v.votedAt || '-'}","${v.receiptCode || '-'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DPT_OSIS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClassCSV = (cls: string) => {
    const classVoters = voters.filter((v) => v.className === cls);
    const headers = 'NISN,Nama Lengkap,Kelas,Jenis Kelamin,PIN / Kode Akses,Status Memilih,Waktu Memilih,Tanda Terima\n';
    const rows = classVoters
      .map(
        (v) =>
          `"${v.nisn}","${v.fullName}","${v.className}","${v.gender}","${v.passcode}","${
            v.hasVoted ? 'Sudah Memilih' : 'Belum Memilih'
          }","${v.votedAt || '-'}","${v.receiptCode || '-'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DPT_Kelas_${cls.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClassVoters = (cls: string) => {
    const classVoters = voters.filter((v) => v.className === cls);
    if (classVoters.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Hapus Seluruh Siswa Kelas ${cls}`,
      message: `PERINGATAN: Apakah Anda yakin ingin menghapus seluruh ${classVoters.length} siswa di kelas ${cls} dari Daftar Pemilih Tetap?`,
      actionLabel: `Ya, Hapus Semua Siswa ${cls}`,
      isDanger: true,
      onConfirm: async () => {
        const ids = classVoters.map((v) => v.id);
        await electionStore.deleteMultipleVoters(ids, 'Admin');
        setSelectedVoterIds((prev) => prev.filter((id) => !ids.includes(id)));
        await loadAllAdminData();
      },
    });
  };

  // --- ACTIONS: ELECTION SETTINGS ---
  const handleToggleStatus = async (newStatus: 'upcoming' | 'ongoing' | 'completed') => {
    if (!settings) return;
    const updated = await electionStore.updateSettings({ status: newStatus }, 'Admin');
    onSettingsUpdate(updated);
    await loadAllAdminData();
  };

  const handleToggleResultsPublish = async () => {
    if (!settings) return;
    const updated = await electionStore.updateSettings({ isResultsPublished: !settings.isResultsPublished }, 'Admin');
    onSettingsUpdate(updated);
    await loadAllAdminData();
  };

  const handleResetVotes = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh Suara Masuk & Jadikan Semua Menunggu Giliran',
      message: 'PERINGATAN: Tindakan ini akan mengosongkan seluruh perolehan suara sah yang telah masuk (menjadi 0 suara) dan mengatur ulang status seluruh siswa di DPT menjadi "Menunggu Giliran". Kotak suara akan kembali bersih untuk persiapan pemilihan resmi. Lanjutkan?',
      actionLabel: 'Ya, Kosongkan Suara & Jadikan Menunggu Giliran',
      isDanger: true,
      onConfirm: async () => {
        await electionStore.resetAllVotes(currentSessionAdmin?.fullName || 'Admin');
        await loadAllAdminData();
      },
    });
  };

  // --- ACTIONS: DATABASE SYNC ---
  const handleSyncToSupabase = async () => {
    setIsSyncingDb(true);
    const res = await electionStore.syncLocalDataToSupabase();
    alert(res.message);
    await checkDb();
    setIsSyncingDb(false);
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Filtered voters for table
  const filteredVoters = voters.filter((v) => {
    const matchesSearch =
      v.fullName.toLowerCase().includes(voterSearch.toLowerCase()) ||
      v.nisn.includes(voterSearch) ||
      v.className.toLowerCase().includes(voterSearch.toLowerCase());
    const matchesClass = voterFilterClass === 'ALL' || v.className === voterFilterClass;
    return matchesSearch && matchesClass;
  });

  // Pagination for large voter datasets (e.g. 1.562+ voters)
  const totalVoterPages = votersPerPage === 0 ? 1 : Math.max(1, Math.ceil(filteredVoters.length / votersPerPage));
  const currentSafeVoterPage = Math.min(Math.max(1, voterPage), totalVoterPages);
  const pagedVoters = useMemo(() => {
    if (votersPerPage === 0) return filteredVoters;
    const startIndex = (currentSafeVoterPage - 1) * votersPerPage;
    return filteredVoters.slice(startIndex, startIndex + votersPerPage);
  }, [filteredVoters, currentSafeVoterPage, votersPerPage]);

  const uniqueClasses = Array.from(new Set(voters.map((v) => v.className))).sort();
  const commonClassPresets = ['X A 1', 'X A 2', 'X B 1', 'XI A 1', 'XI A 2', 'XI B 1', 'XII A 1', 'XII B 1'];
  const availableClassList = Array.from(new Set([...uniqueClasses, ...commonClassPresets])).sort();

  const filteredAdmins = admins.filter((adm) => {
    const matchesSearch =
      adm.fullName.toLowerCase().includes(adminSearch.toLowerCase()) ||
      adm.username.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesRole = adminRoleFilter === 'ALL' || adm.role === adminRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-[#0B1A30] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Dashboard Administrator OSIS
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PPO Panel
              </span>
              {currentSessionAdmin && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>{currentSessionAdmin.fullName} ({currentSessionAdmin.role === 'super_admin' ? 'Super Admin' : 'Panitia'})</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {settings?.schoolName || 'SMA NEGERI 1 RAHAYU'} • Tahun Ajaran {settings?.academicYear || '2026/2027'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('landing')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            Lihat Halaman Depan
          </button>
          <button
            onClick={onLogoutAdmin}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Ringkasan &amp; Kontrol</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'candidates'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Paslon ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('voters')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'voters'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Kelola DPT Siswa ({voters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Kelola Admin ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Jadwal &amp; Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengumuman ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({adminLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Supabase</span>
          {dbStatus.tablesExist ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CONTROL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Pemilih DPT</span>
              <p className="text-3xl font-black text-white font-mono mt-1">{voters.length}</p>
              <p className="text-xs text-slate-400 mt-1">Siswa terdaftar resmi</p>
            </div>

            <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Suara Sah Masuk</span>
              <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {(resultsData?.totalVotes || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total suara tercatat</p>
            </div>

            <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-amber-400">Menunggu Giliran</span>
              <p className="text-3xl font-black text-amber-400 font-mono mt-1">
                {(resultsData?.unvotedCount || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-amber-300 mt-1">Belum menggunakan hak suara</p>
            </div>

            <div className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Partisipasi Suara</span>
              <p className="text-3xl font-black text-blue-400 font-mono mt-1">
                {resultsData?.participationRate || 0}%
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${resultsData?.participationRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Election Control Box */}
          <div className="bg-gradient-to-r from-[#0C1F3A] to-[#0A182C] border-2 border-amber-500/30 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Kontrol Langsung Status Pemilihan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#071324] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold">Status Bilik Suara:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus('upcoming')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                      settings?.status === 'upcoming'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Belum Mulai
                  </button>
                  <button
                    onClick={() => handleToggleStatus('ongoing')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                      settings?.status === 'ongoing'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Buka Voting
                  </button>
                  <button
                    onClick={() => handleToggleStatus('completed')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                      settings?.status === 'completed'
                        ? 'bg-rose-500 text-white font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <div className="bg-[#071324] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold">Publikasi Hasil ke Siswa:</span>
                <button
                  onClick={handleToggleResultsPublish}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 ${
                    settings?.isResultsPublished
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{settings?.isResultsPublished ? 'Hasil TERBIT ke Publik' : 'Hasil DITUTUP (Private)'}</span>
                </button>
              </div>

              <div className="bg-[#071324] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold">Ekspor Laporan:</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Ekspor CSV DPT
                  </button>
                  <button
                    onClick={() => onNavigate('results')}
                    className="flex-1 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs font-bold border border-blue-500/40 flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Rekap Hasil
                  </button>
                </div>
              </div>

              <div className="bg-[#071324] p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <span className="text-xs text-amber-400 font-semibold">Kotak Suara Masuk:</span>
                <button
                  onClick={handleResetVotes}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Mengosongkan semua perolehan suara sah masuk dan mengubah status seluruh siswa menjadi Menunggu Giliran"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Jadikan Semua Menunggu Giliran</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Perolehan Suara Bar Chart Preview */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Rekapitulasi Suara Sementara (Realtime)
              </h3>
              <button
                onClick={() => onNavigate('results')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Halaman Hasil Penuh</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resultsData?.candidates.map((cand) => (
                <div key={cand.id} className="bg-[#071324] p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400">Paslon 0{cand.candidateNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-white font-mono font-bold">
                      {cand.voteCount} Suara ({cand.percentage}%)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{cand.chairmanName}</p>
                  <p className="text-[11px] text-slate-400 truncate">&amp; {cand.viceChairmanName}</p>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${cand.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rekapitulasi Suara Berdasarkan Tombol Per Kelas */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Partisipasi Suara Berdasarkan Kelas
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Klik tombol kelas di bawah untuk langsung membuka &amp; mengelola DPT kelas tersebut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {uniqueClasses.map((cls) => {
                const classVoters = voters.filter((v) => v.className === cls);
                const votedCount = classVoters.filter((v) => v.hasVoted).length;
                const percentage = classVoters.length > 0 ? Math.round((votedCount / classVoters.length) * 100) : 0;
                const isComplete = classVoters.length > 0 && votedCount === classVoters.length;

                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setVoterFilterClass(cls);
                      setActiveTab('voters');
                    }}
                    className="p-4 rounded-2xl bg-[#071324] hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all group cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                        {cls}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isComplete
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {percentage}% Masuk
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sudah: <strong className="text-white">{votedCount}</strong>/{classVoters.length}</span>
                      <span className="text-amber-400 font-bold group-hover:underline">Buka DPT →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATES MANAGEMENT */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Kelola Pasangan Calon</h2>
              <p className="text-xs text-slate-400">Tambah, ubah, atau hapus kandidat Ketua &amp; Wakil Ketua OSIS</p>
            </div>
            <button
              onClick={handleOpenAddCandidate}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Paslon Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c) => (
              <div key={c.id} className="bg-[#0B1A30] border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 border-b border-slate-800 pb-3">
                    <img src={c.photoUrl} alt={c.chairmanName} className="w-16 h-16 rounded-xl object-cover border border-amber-400" />
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Paslon 0{c.candidateNumber}</span>
                      <h3 className="text-sm font-bold text-white">{c.chairmanName}</h3>
                      <p className="text-xs text-slate-400">{c.viceChairmanName}</p>
                      <p className="text-[11px] text-slate-500">{c.chairmanClass} &amp; {c.viceChairmanClass}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-amber-300 italic font-semibold">"{c.tagline}"</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.vision}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setEditingCandidate(c);
                      setIsCandidateModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(c)}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
                    title="Hapus Paslon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VOTERS (DPT) MANAGEMENT */}
      {activeTab === 'voters' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Daftar Pemilih Tetap (DPT Siswa)</h2>
              <p className="text-xs text-slate-400">Total {voters.length.toLocaleString('id-ID')} siswa terdaftar untuk pemilihan ini</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedVoterIds.length > 0 && (
                <button
                  onClick={handleDeleteSelectedVoters}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedVoterIds.length})</span>
                </button>
              )}

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV Siswa</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>

              <button
                onClick={() => setIsVoterModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>

              <button
                onClick={handleResetVotes}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Mengosongkan semua suara masuk dan mengatur ulang status seluruh siswa menjadi Menunggu Giliran"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Jadikan Semua Menunggu Giliran</span>
              </button>

              <button
                onClick={handleClearAllVoters}
                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Hapus seluruh data siswa di DPT"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Kosongkan DPT</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Cari berdasarkan NISN atau Nama Siswa..."
              value={voterSearch}
              onChange={(e) => {
                setVoterSearch(e.target.value);
                setVoterPage(1);
              }}
              className="flex-1 bg-[#0A182B] border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-400"
            />
            <select
              value={voterFilterClass}
              onChange={(e) => {
                setVoterFilterClass(e.target.value);
                setVoterPage(1);
              }}
              className="bg-[#0A182B] border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 outline-none"
            >
              <option value="ALL">Semua Kelas ({voters.length.toLocaleString('id-ID')})</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} ({voters.filter((v) => v.className === cls).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* TOMBOL-TOMBOL FILTER & NAVIGASI PER KELAS */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Tombol Filter &amp; Navigasi Per Kelas:
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Menampilkan <strong className="text-amber-400">{filteredVoters.length.toLocaleString('id-ID')}</strong> siswa
                {voterFilterClass !== 'ALL' && ` di kelas ${voterFilterClass}`}
              </span>
            </div>

            {/* List of Class Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Tombol Semua Kelas */}
              <button
                type="button"
                onClick={() => {
                  setVoterFilterClass('ALL');
                  setVoterPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  voterFilterClass === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                    : 'bg-[#071324] hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                }`}
              >
                <span>Semua Kelas</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    voterFilterClass === 'ALL' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {voters.length.toLocaleString('id-ID')}
                </span>
              </button>

              {/* Tombol Tiap Kelas */}
              {uniqueClasses.map((cls) => {
                const classVoters = voters.filter((v) => v.className === cls);
                const votedCount = classVoters.filter((v) => v.hasVoted).length;
                const isComplete = classVoters.length > 0 && votedCount === classVoters.length;
                const isActive = voterFilterClass === cls;

                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setVoterFilterClass(cls);
                      setVoterPage(1);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                        : 'bg-[#071324] hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                    }`}
                  >
                    <span>{cls}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-slate-950 text-amber-300'
                          : isComplete
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {votedCount}/{classVoters.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Toolbar Aksi Khusus Kelas yang Dipilih */}
            {voterFilterClass !== 'ALL' && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#071324]/60 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span className="text-amber-400 font-bold">Aksi Cepat Kelas {voterFilterClass}:</span>
                  <span className="text-slate-400 text-[11px]">
                    ({voters.filter((v) => v.className === voterFilterClass).length} siswa,{' '}
                    {voters.filter((v) => v.className === voterFilterClass && v.hasVoted).length} sudah memilih)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const classIds = voters.filter((v) => v.className === voterFilterClass).map((v) => v.id);
                      setSelectedVoterIds(classIds);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title={`Centang semua siswa di kelas ${voterFilterClass}`}
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Centang Semua {voterFilterClass}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportClassCSV(voterFilterClass)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    title={`Unduh file CSV untuk kelas ${voterFilterClass}`}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cetak DPT {voterFilterClass}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewVoterClass(voterFilterClass);
                      setIsVoterModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tambah Siswa ke {voterFilterClass}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteClassVoters(voterFilterClass)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hapus Siswa Kelas {voterFilterClass}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Voters Table */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#071324] text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={filteredVoters.length > 0 && selectedVoterIds.length === filteredVoters.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVoterIds(filteredVoters.map((v) => v.id));
                          } else {
                            setSelectedVoterIds([]);
                          }
                        }}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">NISN</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">L/P</th>
                    <th className="px-4 py-3">PIN / Kode Akses</th>
                    <th className="px-4 py-3">Status Hak Suara</th>
                    <th className="px-4 py-3">Tanda Terima</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data pemilih. Klik <strong>"Tambah Siswa"</strong> atau <strong>"Import CSV Siswa"</strong> untuk memasukkan data.
                      </td>
                    </tr>
                  ) : (
                    pagedVoters.map((v) => {
                      const isSelected = selectedVoterIds.includes(v.id);
                      return (
                        <tr
                          key={v.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-900/60'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVoterIds((prev) => [...prev, v.id]);
                                } else {
                                  setSelectedVoterIds((prev) => prev.filter((id) => id !== v.id));
                                }
                              }}
                              className="rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">{v.nisn}</td>
                          <td className="px-4 py-3 font-semibold text-white">{v.fullName}</td>
                          <td className="px-4 py-3">{v.className}</td>
                          <td className="px-4 py-3">{v.gender}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{v.passcode}</td>
                          <td className="px-4 py-3">
                            {v.hasVoted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                Sudah Memilih
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Menunggu Giliran
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">
                            {v.receiptCode || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditVoter(v)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 cursor-pointer transition-colors"
                                title="Edit Data Siswa"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVoter(v)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 cursor-pointer transition-colors"
                                title="Hapus Siswa Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Large DPT (1.562+ records) */}
            {filteredVoters.length > 0 && (
              <div className="bg-[#071324] border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Menampilkan{' '}
                    <strong className="text-white font-mono">
                      {votersPerPage === 0 ? 1 : (currentSafeVoterPage - 1) * votersPerPage + 1}
                    </strong>{' '}
                    -{' '}
                    <strong className="text-white font-mono">
                      {votersPerPage === 0
                        ? filteredVoters.length.toLocaleString('id-ID')
                        : Math.min(currentSafeVoterPage * votersPerPage, filteredVoters.length).toLocaleString('id-ID')}
                    </strong>{' '}
                    dari{' '}
                    <strong className="text-amber-400 font-mono font-bold">
                      {filteredVoters.length.toLocaleString('id-ID')}
                    </strong>{' '}
                    siswa
                  </span>

                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
                    <span className="text-slate-400 text-[11px]">Baris:</span>
                    <select
                      value={votersPerPage}
                      onChange={(e) => {
                        setVotersPerPage(Number(e.target.value));
                        setVoterPage(1);
                      }}
                      className="bg-[#0B1A30] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                      <option value={500}>500</option>
                      <option value={0}>Semua ({filteredVoters.length.toLocaleString('id-ID')})</option>
                    </select>
                  </div>
                </div>

                {totalVoterPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentSafeVoterPage <= 1}
                      onClick={() => setVoterPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 cursor-pointer text-xs font-semibold transition-colors"
                    >
                      &larr; Sebelumnya
                    </button>

                    <span className="font-mono text-xs text-amber-300 font-bold px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      Hal {currentSafeVoterPage} / {totalVoterPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentSafeVoterPage >= totalVoterPages}
                      onClick={() => setVoterPage((p) => Math.min(totalVoterPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 cursor-pointer text-xs font-semibold transition-colors"
                    >
                      Selanjutnya &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & SCHEDULE */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Identitas Sekolah &amp; Jadwal Pemilihan
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!settings) return;
                const form = e.target as HTMLFormElement;
                const schoolName = (form.elements.namedItem('schoolName') as HTMLInputElement).value;
                const schoolAddress = (form.elements.namedItem('schoolAddress') as HTMLInputElement).value;
                const academicYear = (form.elements.namedItem('academicYear') as HTMLInputElement).value;
                const tagline = (form.elements.namedItem('tagline') as HTMLInputElement).value;
                const contactPerson = (form.elements.namedItem('contactPerson') as HTMLInputElement).value;
                const contactPhone = (form.elements.namedItem('contactPhone') as HTMLInputElement).value;
                const contactEmail = (form.elements.namedItem('contactEmail') as HTMLInputElement).value;
                const startTime = (form.elements.namedItem('startTime') as HTMLInputElement).value;
                const endTime = (form.elements.namedItem('endTime') as HTMLInputElement).value;

                const updated = await electionStore.updateSettings(
                  {
                    schoolName,
                    schoolAddress,
                    academicYear,
                    tagline,
                    contactPerson,
                    contactPhone,
                    schoolLogo: settingsLogo,
                    contactEmail,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                  },
                  'Admin'
                );
                onSettingsUpdate(updated);
                alert('Pengaturan identitas sekolah, logo, alamat, & jadwal berhasil disimpan!');
              }}
              className="space-y-4"
            >
              {/* LOGO SEKOLAH MANAGEMENT */}
              <div className="bg-[#071324] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Logo Identitas Sekolah &amp; OSIS
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Logo ini ditampilkan di Navbar, Footer, dan Kop Berita Acara Pemilihan
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="logo-file-input"
                      className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs font-bold border border-blue-500/30 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload dari Perangkat</span>
                    </label>
                    <input
                      type="file"
                      id="logo-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) {
                              setSettingsLogo(reader.result.toString());
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#0B1A30] border-2 border-amber-400/50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                    {settingsLogo ? (
                      <img
                        src={settingsLogo}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Award className="w-7 h-7 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Masukkan URL Gambar Logo (https://... atau upload file)"
                      value={settingsLogo}
                      onChange={(e) => setSettingsLogo(e.target.value)}
                      className="w-full bg-[#0B1A30] border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-mono outline-none focus:border-amber-400"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-bold">Pilihan Cepat:</span>
                      <button
                        type="button"
                        onClick={() => setSettingsLogo('https://upload.wikimedia.org/wikipedia/commons/4/4e/Logo_OSIS.svg')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer"
                      >
                        Lambang OSIS Resmi
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsLogo('https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer"
                      >
                        Tut Wuri Handayani
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsLogo('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=300&q=80')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer"
                      >
                        Default Emblem
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Sekolah</label>
                  <input
                    name="schoolName"
                    defaultValue={settings?.schoolName}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tahun Periode</label>
                  <input
                    name="academicYear"
                    defaultValue={settings?.academicYear}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Alamat Sekolah / Lokasi Posko Bilik Suara
                  </label>
                  <input
                    name="schoolAddress"
                    defaultValue={settings?.schoolAddress}
                    placeholder="Contoh: Jl. Pendidikan No. 45, Kompleks Karang Rahayu, Jawa Barat"
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tagline Pemilihan</label>
                  <input
                    name="tagline"
                    defaultValue={settings?.tagline}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Pembina / Ketua Panitia</label>
                  <input
                    name="contactPerson"
                    defaultValue={settings?.contactPerson}
                    placeholder="Contoh: Bapak Ahmad Fauzi, S.Pd (Pembina OSIS)"
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">No. WhatsApp Helpdesk</label>
                  <input
                    name="contactPhone"
                    defaultValue={settings?.contactPhone}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Waktu Mulai Pemilihan</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    defaultValue={settings?.startTime ? new Date(settings.startTime).toISOString().slice(0, 16) : ''}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Waktu Selesai Pemilihan</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    defaultValue={settings?.endTime ? new Date(settings.endTime).toISOString().slice(0, 16) : ''}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Resmi Panitia</label>
                  <input
                    name="contactEmail"
                    defaultValue={settings?.contactEmail}
                    className="w-full bg-[#071324] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>

          {/* DANGER ZONE: Reset Suara Pemilihan */}
          <div className="bg-rose-950/30 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Zona Bahaya: Reset Kotak Suara Pemilihan</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fitur ini akan mengosongkan seluruh surat suara yang telah masuk ke dalam kotak suara dan mengembalikan status semua siswa di DPT menjadi "Belum Memilih". Gunakan fitur ini hanya sebelum pemilihan resmi dimulai atau setelah sesi gladi bersih (uji coba).
            </p>
            <button
              onClick={handleResetVotes}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Kosongkan Semua Suara Masuk (Reset Kotak Suara)
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Kelola Pengumuman Resmi Panitia</h2>
              <p className="text-xs text-slate-400">Tampilkan informasi resmi pada halaman beranda siswa</p>
            </div>
            <button
              onClick={() => {
                setAnnTitle('');
                setAnnContent('');
                setAnnPriority('normal');
                setIsAnnounceModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman Baru</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-[#0B1A30] border border-slate-800 p-5 rounded-2xl flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{ann.date}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-amber-300">
                      {ann.priority}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
                </div>
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Hapus Pengumuman',
                      message: `Apakah Anda yakin ingin menghapus pengumuman "${ann.title}"?`,
                      actionLabel: 'Ya, Hapus Pengumuman',
                      isDanger: true,
                      onConfirm: async () => {
                        await electionStore.deleteAnnouncement(ann.id, 'Admin');
                        await loadAllAdminData();
                      },
                    });
                  }}
                  className="text-slate-500 hover:text-rose-400 p-2 cursor-pointer transition-colors"
                  title="Hapus Pengumuman"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-white">Audit Log Aktivitas Administrator</h2>
            <p className="text-xs text-slate-400">
              Riwayat kronologis aktivitas operasional panitia (Kerahasiaan pilihan suara siswa tetap terisolasi)
            </p>
          </div>

          <div className="bg-[#0B1A30] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#071324] text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Pelaksana</th>
                    <th className="px-4 py-3">Aksi</th>
                    <th className="px-4 py-3">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                  {adminLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-amber-300">{log.adminName}</td>
                      <td className="px-4 py-2.5 text-white">{log.action}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-sans text-xs">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUPABASE DATABASE INTEGRATION */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Integrasi Backend
                </span>
                <h2 className="text-xl font-black text-white mt-1">Status Koneksi Supabase</h2>
                <p className="text-xs text-slate-400">
                  Target Endpoint: <code className="text-amber-300 font-mono">https://egdmzrjeenpfzdlxpowe.supabase.co</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={checkDb}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Uji Ulang Koneksi</span>
                </button>
                <button
                  onClick={handleSyncToSupabase}
                  disabled={isSyncingDb}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isSyncingDb ? 'Sinkronisasi...' : 'Sinkronkan Data ke Supabase'}</span>
                </button>
              </div>
            </div>

            {/* FORM PENGATURAN KREDENSIAL VITE_SUPABASE_URL */}
            <div className="p-5 rounded-2xl bg-[#071324] border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Konfigurasi Kredensial Supabase (URL &amp; Anon Key)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Anda dapat memasukkan atau mengubah URL dan Anon Public Key Supabase langsung di sini:
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    VITE_SUPABASE_URL (Project URL)
                  </label>
                  <input
                    type="url"
                    value={customDbUrl}
                    onChange={(e) => setCustomDbUrl(e.target.value)}
                    placeholder="https://xxxxxxxxxxxx.supabase.co"
                    className="w-full bg-[#0B1A30] border border-slate-700 focus:border-amber-400 text-amber-300 text-xs sm:text-sm font-mono rounded-xl px-4 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    VITE_SUPABASE_ANON_KEY (Public Anon Key)
                  </label>
                  <textarea
                    rows={2}
                    value={customDbAnonKey}
                    onChange={(e) => setCustomDbAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-[#0B1A30] border border-slate-700 focus:border-amber-400 text-slate-300 text-xs font-mono rounded-xl p-3 outline-none"
                  ></textarea>
                </div>

                {saveDbNotice && (
                  <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    {saveDbNotice}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-400">
                    *Kredensial juga dapat didefinisikan pada file <code>.env</code> di root project.
                  </div>
                  <button
                    onClick={async () => {
                      updateSupabaseConfig(customDbUrl, customDbAnonKey);
                      setSaveDbNotice('Kredensial Supabase berhasil disimpan dan diterapkan!');
                      await checkDb();
                      setTimeout(() => setSaveDbNotice(null), 3000);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Simpan &amp; Uji Koneksi Sekarang
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Status Box */}
            <div className="p-4 rounded-2xl bg-[#071324] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                {dbStatus.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span className={dbStatus.ok ? 'text-emerald-300' : 'text-amber-300'}>
                  {dbStatus.message}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistem secara otomatis menyediakan fallback penyimpanan lokal berdaya tahan tinggi sehingga bilik suara dapat langsung diuji dan digunakan tanpa jeda, serta menyinkronkan data secara instan saat tabel di Supabase siap.
              </p>
            </div>

            {/* SQL Script Viewer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Skrip SQL Pembuatan Tabel di Supabase (SQL Editor)</span>
                </h3>
                <button
                  onClick={copySqlSchema}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyFeedback ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
                </button>
              </div>

              <div className="relative bg-[#050D1A] rounded-2xl p-4 border border-slate-800 max-h-72 overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: KELOLA ADMIN (ADMIN & PANITIA MANAGEMENT) */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Admin Header & Notice */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Kelola Administrator &amp; Panitia</h2>
                    <p className="text-xs text-slate-400">
                      Pengaturan hak akses, penambahan panitia baru, ganti kata sandi, dan status akun sistem.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenAddAdmin}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all self-stretch sm:self-auto justify-center"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Admin Baru</span>
              </button>
            </div>

            {adminNotice && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 border ${
                  adminNotice.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {adminNotice.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{adminNotice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminNotice(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#071324] border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Akun Admin</p>
                <p className="text-2xl font-black text-white mt-1">{admins.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Terdaftar dalam sistem</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#071324] border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Super Admin</p>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {admins.filter((a) => a.role === 'super_admin').length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Hak akses konfigurasi penuh</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#071324] border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Panitia PPO</p>
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-2xl font-black text-sky-400 mt-1">
                  {admins.filter((a) => a.role === 'panitia').length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Operasional bilik &amp; DPT</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#071324] border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status Aktif</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {admins.filter((a) => a.status === 'active').length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Dapat login ke sistem</p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari admin berdasarkan nama atau @username..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full bg-[#071324] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
              />
              {adminSearch && (
                <button
                  onClick={() => setAdminSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap mr-1">Role:</span>
              <button
                onClick={() => setAdminRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  adminRoleFilter === 'ALL'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Semua ({admins.length})
              </button>
              <button
                onClick={() => setAdminRoleFilter('super_admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  adminRoleFilter === 'super_admin'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Super Admin ({admins.filter((a) => a.role === 'super_admin').length})
              </button>
              <button
                onClick={() => setAdminRoleFilter('panitia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  adminRoleFilter === 'panitia'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Panitia ({admins.filter((a) => a.role === 'panitia').length})
              </button>
            </div>
          </div>

          {/* Admin Table & Cards */}
          <div className="bg-[#0B1A30] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {filteredAdmins.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-300">Tidak ada administrator yang cocok</p>
                <p className="text-xs text-slate-500">
                  Coba ubah kata kunci pencarian atau filter peranan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#071324] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Administrator</th>
                      <th className="py-3.5 px-4">Hak Akses</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Aktivitas Login</th>
                      <th className="py-3.5 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAdmins.map((adm) => {
                      const isCurrent = currentSessionAdmin?.id === adm.id;
                      const isOnlySuper =
                        adm.role === 'super_admin' &&
                        admins.filter((a) => a.role === 'super_admin').length <= 1;

                      return (
                        <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                  adm.role === 'super_admin'
                                    ? 'bg-gradient-to-tr from-amber-500 to-amber-700 text-slate-950'
                                    : 'bg-gradient-to-tr from-sky-500 to-sky-700 text-white'
                                }`}
                              >
                                {adm.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-white text-xs sm:text-sm">
                                    {adm.fullName}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      (Akun Anda)
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] text-slate-400">
                                  @{adm.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {adm.role === 'super_admin' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>Super Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                <UserCheck className="w-3 h-3 text-sky-400" />
                                <span>Panitia PPO</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {adm.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                <span>Ditangguhkan</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-400">
                            <p className="text-[11px] text-slate-300">
                              {adm.lastLogin
                                ? new Date(adm.lastLogin).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : 'Belum pernah login'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Dibuat: {new Date(adm.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenChangePassword(adm)}
                                title="Ganti Kata Sandi"
                                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditAdmin(adm)}
                                title="Edit Data Admin"
                                className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleAdminStatus(adm)}
                                disabled={isCurrent}
                                title={
                                  isCurrent
                                    ? 'Tidak dapat menonaktifkan akun sendiri'
                                    : adm.status === 'active'
                                    ? 'Tangguhkan Akses Akun'
                                    : 'Aktifkan Kembali Akun'
                                }
                                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                                  isCurrent
                                    ? 'opacity-30 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                                    : adm.status === 'active'
                                    ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-700'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteAdmin(adm)}
                                disabled={isCurrent || isOnlySuper}
                                title={
                                  isCurrent
                                    ? 'Tidak dapat menghapus akun sendiri'
                                    : isOnlySuper
                                    ? 'Harus ada minimal satu Super Admin'
                                    : 'Hapus Akun Admin'
                                }
                                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                                  isCurrent || isOnlySuper
                                    ? 'opacity-30 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security & Access Level Notes */}
          <div className="bg-[#071324] border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Panduan Hak Akses &amp; Keamanan Sistem E-Voting</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
              <div className="p-3.5 rounded-2xl bg-[#0B1A30] border border-slate-800/80 space-y-1.5">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Super Admin
                </p>
                <p className="text-[11px] leading-relaxed">
                  Memiliki kendali penuh atas sistem: menambah/mengedit paslon, pengaturan jadwal pemilihan, publikasi hasil pemilu, konfigurasi database, serta menambah dan menghapus akun panitia.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B1A30] border border-slate-800/80 space-y-1.5">
                <p className="font-bold text-sky-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Panitia Pemilihan Organisasi (PPO)
                </p>
                <p className="text-[11px] leading-relaxed">
                  Dikhususkan untuk staf operasional di bilik suara: verifikasi DPT pemilih, reset kode akses jika kartu siswa hilang, dan memantau persentase partisipasi tanpa mengubah pengaturan inti.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              *Setiap penambahan, pengeditan kata sandi, maupun penghapusan admin akan dicatat secara otomatis dalam <strong>Audit Log</strong> sistem tanpa mengekspos kata sandi rahasia.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CANDIDATE */}
      {isCandidateModalOpen && editingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0B1A30] border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-4 my-8">
            <h2 className="text-lg font-black text-white">
              {editingCandidate.id ? 'Edit Pasangan Calon' : 'Tambah Paslon Baru'}
            </h2>

            <form onSubmit={handleSaveCandidate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nomor Urut Paslon</label>
                  <input
                    type="number"
                    value={editingCandidate.candidateNumber}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, candidateNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={editingCandidate.tagline}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, tagline: e.target.value })}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nama Calon Ketua</label>
                  <input
                    type="text"
                    value={editingCandidate.chairmanName}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, chairmanName: e.target.value })}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Kelas Calon Ketua</label>
                  <input
                    type="text"
                    value={editingCandidate.chairmanClass}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, chairmanClass: e.target.value })}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nama Calon Wakil Ketua</label>
                  <input
                    type="text"
                    value={editingCandidate.viceChairmanName}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, viceChairmanName: e.target.value })}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Kelas Calon Wakil Ketua</label>
                  <input
                    type="text"
                    value={editingCandidate.viceChairmanClass}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, viceChairmanClass: e.target.value })}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">URL Foto Paslon (Unsplash / Cloud)</label>
                <input
                  type="url"
                  value={editingCandidate.photoUrl}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, photoUrl: e.target.value })}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Visi</label>
                <textarea
                  value={editingCandidate.vision}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, vision: e.target.value })}
                  rows={2}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Misi (Pisahkan dengan baris baru per poin)
                </label>
                <textarea
                  value={editingCandidate.missions.join('\n')}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      missions: e.target.value.split('\n').filter((m) => m.trim().length > 0),
                    })
                  }
                  rows={3}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                >
                  Simpan Paslon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SINGLE VOTER */}
      {isVoterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h2 className="text-base font-black text-white">Tambah Siswa ke DPT</h2>
            <form onSubmit={handleAddVoter} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">NISN Siswa</label>
                <input
                  type="text"
                  placeholder="Contoh: 0071234509"
                  value={newVoterNisn}
                  onChange={(e) => setNewVoterNisn(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Nama Siswa"
                  value={newVoterName}
                  onChange={(e) => setNewVoterName(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400">Kelas Siswa</label>
                  <span className="text-[10px] text-amber-400 font-semibold">Tombol Cepat:</span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: X A 1"
                  value={newVoterClass}
                  onChange={(e) => setNewVoterClass(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-[#071324]/60 rounded-xl border border-slate-800">
                  {availableClassList.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewVoterClass(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        newVoterClass === preset
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Jenis Kelamin</label>
                <select
                  value={newVoterGender}
                  onChange={(e) => setNewVoterGender(e.target.value as 'L' | 'P')}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Kode Akses / PIN (Opsional)</label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk otomatis 6 digit angka"
                  value={newVoterPasscode}
                  onChange={(e) => setNewVoterPasscode(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVoterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    await handleAddVoter(e);
                    setIsVoterModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-bold cursor-pointer"
                >
                  + Simpan &amp; Tambah Lagi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                >
                  Simpan &amp; Tutup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADVANCED SMART IMPORT (TABLE / CSV / EXCEL / GELAR PROTECTION) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0B1A30] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 text-white space-y-5 shadow-2xl my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Import Masal Data Pemilih / Siswa (DPT)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Smart Table Engine
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Salin &amp; tempel langsung dari Excel, Google Sheets, Dapodik, atau file CSV/TSV
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplateCSV}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Unduh file format CSV dengan tanda kutip aman"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Template CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplateExcelTab}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Unduh file format Tab Delimited (Excel TSV)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Template Excel (Tab)</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* GELAR & SINGLE FIELD PROTECTION CALLOUT */}
              <div className="bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-emerald-500/15 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-black">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Proteksi Gelar &amp; Satu Field Aktif:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  Ketika menyalin tabel dari <strong>Excel</strong> atau <strong>Google Sheets</strong>, seluruh isi sel nama disimpan sebagai <strong>SATU FIELD</strong> utuh. Tanda <strong>titik (.)</strong> dan <strong>koma (,)</strong> pada nama gelar akademik (contoh: <code className="text-amber-300 bg-slate-900/80 px-1 py-0.5 rounded font-mono font-bold">Drs. H. Januar Arifin, M.Pd.</code> atau <code className="text-amber-300 bg-slate-900/80 px-1 py-0.5 rounded font-mono font-bold">Siti, S.Pd., M.Si.</code>) <strong>TIDAK akan memecah atau menggeser kolom tabel</strong>.
                </p>
              </div>

              {/* Format & Delimiter Toolbar */}
              <div className="bg-[#071324] border border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Pemisah Kolom Tabel (Pilih Format):
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setImportDelimiter('auto')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          importDelimiter === 'auto'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        ⚡ Otomatis (Rekomendasi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportDelimiter('tab')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          importDelimiter === 'tab'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                        title="Untuk salinan langsung dari Excel / Spreadsheet yang dipisahkan tombol Tab"
                      >
                        📋 Tab (Salin dari Excel)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportDelimiter('semicolon')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          importDelimiter === 'semicolon'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                        title="Untuk file CSV format Indonesia / Windows yang menggunakan titik koma"
                      >
                        📑 Titik Koma ( ; )
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportDelimiter('comma')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          importDelimiter === 'comma'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                        title="Untuk file CSV standar koma dengan rekonsiliasi gelar"
                      >
                        📝 Koma ( , )
                      </button>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white pt-1 sm:pt-0">
                    <input
                      type="checkbox"
                      checked={importUpdateExisting}
                      onChange={(e) => setImportUpdateExisting(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-semibold">Perbarui data jika NISN sudah ada</span>
                  </label>
                </div>
              </div>

              {/* Upload & Preset Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="csv-file-upload-smart"
                    className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File (.csv / .tsv / .txt)</span>
                  </label>
                  <input
                    type="file"
                    id="csv-file-upload-smart"
                    accept=".csv, .txt, .tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (reader.result) {
                            setCsvRawText(reader.result.toString());
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setCsvRawText(
                        '0081234501\tDrs. H. Januar Arifin, M.Pd.\tX A 1\tL\t123456\n' +
                          '0081234502\tSiti Rahmawati, S.Pd., M.Si.\tX A 2\tP\t234567\n' +
                          '0081234503\tBudi Gunawan, S.Kom.\tXI B 1\tL\t345678\n' +
                          '0081234504\tDewi Lestari, S.T., M.Eng.\tXII A 1\tP\t456789\n' +
                          '0081234505\tMuhammad Farhan\tXII B 2\tL\t567890'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Contoh Data Tabel Bergelar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCsvRawText(
                        '"0081234511","Drs. H. Ahmad Santoso, M.Pd.","X A 1","L","112233"\n' +
                          '"0081234512","Hj. Rina Wulandari, S.E., M.M.","X B 2","P","223344"\n' +
                          '"0081234513","Candra Wijaya, S.Kom.","XI A 2","L","334455"'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Contoh CSV Kutip</span>
                  </button>
                </div>

                {csvRawText && (
                  <button
                    type="button"
                    onClick={() => setCsvRawText('')}
                    className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Kosongkan Teks
                  </button>
                )}
              </div>

              {/* Text Input Area */}
              <div>
                <textarea
                  rows={6}
                  placeholder={`Tempel (Paste) data dari tabel Excel / Google Sheets di sini:\nNISN\tNama Lengkap (Termasuk Gelar)\tKelas\tGender\tPIN\n0081234501\tDrs. H. Januar Arifin, M.Pd.\tX A 1\tL\t123456\n0081234502\tSiti Rahmawati, S.Pd., M.Si.\tX A 2\tP\t234567`}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 focus:border-amber-400 text-white font-mono text-xs p-3.5 rounded-2xl outline-none transition-colors"
                ></textarea>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>
                    Format fleksibel: Mendukung 2 sampai 5 kolom (NISN, Nama Lengkap &amp; Gelar, Kelas, L/P, PIN).
                  </span>
                  <span>{csvRawText.split(/\r?\n/).filter((l) => l.trim()).length} baris teks terdeteksi</span>
                </div>
              </div>

              {/* REAL-TIME LIVE TABLE PREVIEW (PEMBUKTIAN SATU FIELD) */}
              {parsedPreviewList.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#071324] p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Pratinjau Hasil Pembacaan Tabel:
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✅ Siap Diimpor: {parsedPreviewList.filter((p) => p.isValid).length} baris
                      </span>
                      {parsedPreviewList.some(
                        (p) => p.fullName.includes('.') || p.fullName.includes(',')
                      ) && (
                        <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          🛡️ Gelar Terproteksi: {parsedPreviewList.filter(
                            (p) => p.fullName.includes('.') || p.fullName.includes(',')
                          ).length} nama
                        </span>
                      )}
                      {parsedPreviewList.some((p) => !p.isValid) && (
                        <span className="px-2.5 py-1 rounded-lg font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          ⚠️ Tidak Valid: {parsedPreviewList.filter((p) => !p.isValid).length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#071324] max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0B1A30] text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">NISN</th>
                          <th className="py-2.5 px-3">
                            <span className="text-amber-400">Nama Lengkap &amp; Gelar</span>
                            <span className="text-[9px] text-slate-500 block font-normal">(1 Field Utuh)</span>
                          </th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3">L/P</th>
                          <th className="py-2.5 px-3">PIN Akses</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                        {parsedPreviewList.slice(0, 15).map((row, idx) => {
                          const hasTitle = row.fullName.includes('.') || row.fullName.includes(',');

                          return (
                            <tr
                              key={idx}
                              className={
                                row.isValid
                                  ? 'hover:bg-slate-800/40 text-slate-200'
                                  : 'bg-rose-500/10 text-rose-300'
                              }
                            >
                              <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-amber-400">{row.nisn}</td>
                              <td className="py-2 px-3 font-sans font-bold text-white">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{row.fullName}</span>
                                  {hasTitle && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      Gelar Utuh
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 font-sans">{row.className}</td>
                              <td className="py-2 px-3">{row.gender}</td>
                              <td className="py-2 px-3 text-slate-400">{row.passcode}</td>
                              <td className="py-2 px-3 text-right">
                                {row.isValid ? (
                                  <span className="text-[10px] font-bold text-emerald-400">OK</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-400">{row.error}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {parsedPreviewList.length > 15 && (
                    <p className="text-[11px] text-slate-400 text-center italic">
                      + Menampilkan 15 baris pertama dari total {parsedPreviewList.length} data pemilih.
                    </p>
                  )}
                </div>
              )}

              {/* Status Notice */}
              {importNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold border flex items-start gap-2.5 ${
                    importNoticeType === 'error'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {importNoticeType === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  )}
                  <span>{importNotice}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
              <span className="text-xs text-slate-400">
                {parsedPreviewList.filter((p) => p.isValid).length > 0
                  ? `Siap mengimpor ${parsedPreviewList.filter((p) => p.isValid).length} pemilih ke dalam DPT.`
                  : 'Tempelkan data atau unggah file untuk melihat pratinjau tabel.'}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleImportCSV}
                  disabled={isImporting || parsedPreviewList.filter((p) => p.isValid).length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan ke DPT...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Mulai Import (
                        {parsedPreviewList.filter((p) => p.isValid).length} Siswa)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ANNOUNCEMENT */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h2 className="text-base font-black text-white">Buat Pengumuman Baru</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Prioritas</label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as any)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Penting (Important)</option>
                  <option value="urgent">Mendesak (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!annTitle.trim()) return;
                    await electionStore.saveAnnouncement(
                      {
                        id: 'ann-' + Math.random().toString(36).substring(2, 7),
                        title: annTitle,
                        content: annContent,
                        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                        priority: annPriority,
                      },
                      'Admin'
                    );
                    setIsAnnounceModalOpen(false);
                    await loadAllAdminData();
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                >
                  Terbitkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VOTER */}
      {isEditVoterModalOpen && editingVoter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1A30] border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Edit Data Siswa</h2>
                  <p className="text-[11px] text-slate-400">Perbarui identitas atau status hak suara siswa</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEditedVoter} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">NISN Siswa</label>
                <input
                  type="text"
                  value={editingVoter.nisn}
                  onChange={(e) => setEditingVoter({ ...editingVoter, nisn: e.target.value })}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingVoter.fullName}
                  onChange={(e) => setEditingVoter({ ...editingVoter, fullName: e.target.value })}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400">Kelas Siswa</label>
                  <span className="text-[10px] text-amber-400 font-semibold">Tombol Cepat:</span>
                </div>
                <input
                  type="text"
                  value={editingVoter.className}
                  onChange={(e) => setEditingVoter({ ...editingVoter, className: e.target.value })}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                  required
                />
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-[#071324]/60 rounded-xl border border-slate-800">
                  {availableClassList.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingVoter({ ...editingVoter, className: preset })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        editingVoter.className === preset
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Jenis Kelamin</label>
                <select
                  value={editingVoter.gender}
                  onChange={(e) => setEditingVoter({ ...editingVoter, gender: e.target.value as 'L' | 'P' })}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">PIN / Kode Akses</label>
                <input
                  type="text"
                  value={editingVoter.passcode}
                  onChange={(e) => setEditingVoter({ ...editingVoter, passcode: e.target.value })}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Status Hak Suara</label>
                <select
                  value={editingVoter.hasVoted ? 'voted' : 'unvoted'}
                  onChange={(e) => {
                    const isVoted = e.target.value === 'voted';
                    setEditingVoter({
                      ...editingVoter,
                      hasVoted: isVoted,
                      votedAt: isVoted ? (editingVoter.votedAt || new Date().toISOString()) : null,
                      receiptCode: isVoted ? (editingVoter.receiptCode || 'REC-' + Math.random().toString(36).substring(2, 8).toUpperCase()) : undefined,
                    });
                  }}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none"
                >
                  <option value="unvoted">Belum Memilih (Hak Suara Aktif)</option>
                  <option value="voted">Sudah Memilih</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Mengubah ke "Belum Memilih" akan mereset hak suara siswa agar dapat melakukan voting ulang jika terjadi kendala teknis.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditVoterModalOpen(false);
                    setEditingVoter(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ADMIN USER */}
      {isManageAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0B1A30] border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {adminModalMode === 'create' ? 'Tambah Akun Administrator Baru' : 'Edit Data Administrator'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {adminModalMode === 'create'
                      ? 'Buat kredensial login panitia atau pembina baru'
                      : `Perbarui profil dan wewenang akun @${adminFormUsername}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageAdminModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rahmat Hidayat, S.Pd / Budi Santoso"
                  value={adminFormFullName}
                  onChange={(e) => setAdminFormFullName(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username (Untuk Login)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
                  <input
                    type="text"
                    placeholder="username_admin"
                    value={adminFormUsername}
                    onChange={(e) => setAdminFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hanya huruf, angka, dan underscore tanpa spasi.
                </p>
              </div>

              {adminModalMode === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kata Sandi Awal (Minimal 6 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi baru"
                      value={adminFormPassword}
                      onChange={(e) => setAdminFormPassword(e.target.value)}
                      className="w-full bg-[#071324] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Hak Akses / Peranan (Role)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      adminFormRole === 'super_admin'
                        ? 'bg-amber-500/15 border-amber-500/60 text-white'
                        : 'bg-[#071324] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminRole"
                      value="super_admin"
                      checked={adminFormRole === 'super_admin'}
                      onChange={() => setAdminFormRole('super_admin')}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <p className="font-bold text-xs flex items-center gap-1 text-amber-400">
                        <Crown className="w-3.5 h-3.5" />
                        Super Admin
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Akses penuh semua pengaturan, DPT, dan kelola admin.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      adminFormRole === 'panitia'
                        ? 'bg-sky-500/15 border-sky-500/60 text-white'
                        : 'bg-[#071324] border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminRole"
                      value="panitia"
                      checked={adminFormRole === 'panitia'}
                      onChange={() => setAdminFormRole('panitia')}
                      className="mt-0.5 accent-sky-500"
                    />
                    <div>
                      <p className="font-bold text-xs flex items-center gap-1 text-sky-400">
                        <UserCheck className="w-3.5 h-3.5" />
                        Panitia PPO
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Akses operasional verifikasi DPT dan panduan bilik suara.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Status Akun
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      adminFormStatus === 'active'
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold'
                        : 'bg-[#071324] border-slate-700 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminStatus"
                      value="active"
                      checked={adminFormStatus === 'active'}
                      onChange={() => setAdminFormStatus('active')}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs">Aktif</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      adminFormStatus === 'suspended'
                        ? 'bg-rose-500/15 border-rose-500/60 text-rose-300 font-bold'
                        : 'bg-[#071324] border-slate-700 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adminStatus"
                      value="suspended"
                      checked={adminFormStatus === 'suspended'}
                      onChange={() => setAdminFormStatus('suspended')}
                      className="accent-rose-500"
                    />
                    <span className="text-xs">Ditangguhkan</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManageAdminModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {adminModalMode === 'create' ? 'Tambah Administrator' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE ADMIN PASSWORD */}
      {isChangePasswordModalOpen && targetAdminForPassword && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0B1A30] border border-amber-500/40 rounded-3xl p-6 sm:p-7 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Ganti Kata Sandi</h2>
                  <p className="text-[11px] text-slate-400">
                    Akun: <strong className="text-white">{targetAdminForPassword.fullName}</strong> (@{targetAdminForPassword.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi baru"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full bg-[#071324] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full bg-[#071324] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  required
                  minLength={6}
                />
                {confirmPasswordInput && newPasswordInput !== confirmPasswordInput && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">
                    *Kata sandi konfirmasi belum sama
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newPasswordInput || newPasswordInput !== confirmPasswordInput}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IN-APP CONFIRMATION (REPLACES WINDOW.CONFIRM/PROMPT) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1A30] border border-slate-700/80 rounded-3xl p-6 text-white space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.isDanger
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={async () => {
                  try {
                    setIsConfirmLoading(true);
                    await confirmModal.onConfirm();
                  } finally {
                    setIsConfirmLoading(false);
                    setConfirmModal(null);
                  }
                }}
                className={`px-5 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isConfirmLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{confirmModal.actionLabel || 'Ya, Lanjutkan'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
