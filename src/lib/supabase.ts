import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://egdmzrjeenpfzdlxpowe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZG16cmplZW5wZnpkbHhwb3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzOTQ2NjksImV4cCI6MjEwODk3MDY2OX0.tfpLbHhZL-MUrUBVMShBr5lF4Uaewksxjouow8VSoxM';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('osis_custom_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('osis_custom_supabase_anon_key') : null;

  return {
    url: localUrl || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  };
}

const currentConfig = getSupabaseConfig();
export let supabase = createClient(currentConfig.url, currentConfig.anonKey);

export function updateSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('osis_custom_supabase_url', url.trim());
    localStorage.setItem('osis_custom_supabase_anon_key', anonKey.trim());
  }
  supabase = createClient(url.trim(), anonKey.trim());
}

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string; tablesExist?: boolean }> {
  try {
    const { error } = await supabase.from('candidates').select('id').limit(1);
    if (!error) {
      return { ok: true, message: 'Terhubung ke Supabase & tabel candidates siap.', tablesExist: true };
    }
    // Error could be "relation 'candidates' does not exist"
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return {
        ok: true,
        message: 'Terhubung ke Supabase, namun tabel belum dibuat. Gunakan script SQL di menu Database untuk generate tabel.',
        tablesExist: false
      };
    }
    return { ok: false, message: `Koneksi Supabase error: ${error.message}`, tablesExist: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Koneksi ke Supabase gagal';
    return { ok: false, message, tablesExist: false };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- SKEMA DATABASE SUPABASE UNTUK OSIS VOTE
-- Jalankan skrip ini di SQL Editor Supabase Anda (Dashboard > SQL Editor > New Query)

-- 1. Tabel Pengaturan Pemilihan (elections)
CREATE TABLE IF NOT EXISTS elections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_address TEXT,
  school_logo TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing', -- upcoming, ongoing, completed
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_results_published BOOLEAN NOT NULL DEFAULT false,
  allow_realtime_before_end BOOLEAN NOT NULL DEFAULT false,
  tagline TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Kandidat (candidates)
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  candidate_number INT NOT NULL UNIQUE,
  chairman_name TEXT NOT NULL,
  vice_chairman_name TEXT NOT NULL,
  chairman_class TEXT NOT NULL,
  vice_chairman_class TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  chairman_photo_url TEXT,
  vice_chairman_photo_url TEXT,
  tagline TEXT,
  vision TEXT NOT NULL,
  missions JSONB NOT NULL DEFAULT '[]'::jsonb,
  work_programs JSONB NOT NULL DEFAULT '[]'::jsonb,
  color_theme TEXT DEFAULT '#1E3E62',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Pemilih Tetap (voters)
-- Disimpan terpisah dari pilihan suara demi asas Luber Jurdil (Rahasia)
CREATE TABLE IF NOT EXISTS voters (
  id TEXT PRIMARY KEY,
  nisn TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  passcode TEXT NOT NULL,
  has_voted BOOLEAN NOT NULL DEFAULT false,
  voted_at TIMESTAMPTZ,
  receipt_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Suara Anonim (votes)
-- PENTING: TIDAK MENYIMPAN voter_id atau NISN agar pilihan siswa tidak dapat dilacak siapa pun.
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  election_id TEXT NOT NULL,
  verification_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pengumuman (announcements)
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Log Aktivitas Admin (admin_logs)
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS dan Policy Public Baca & Tulis untuk E-Voting
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon to select and operate for voter client
DO $$ BEGIN
  CREATE POLICY "Public full access elections" ON elections FOR ALL USING (true);
  CREATE POLICY "Public full access candidates" ON candidates FOR ALL USING (true);
  CREATE POLICY "Public full access voters" ON voters FOR ALL USING (true);
  CREATE POLICY "Public full access votes" ON votes FOR ALL USING (true);
  CREATE POLICY "Public full access announcements" ON announcements FOR ALL USING (true);
  CREATE POLICY "Public full access admin_logs" ON admin_logs FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
`;
