export interface Candidate {
  id: string;
  candidateNumber: number; // 1, 2, 3
  chairmanName: string;
  viceChairmanName: string;
  chairmanClass: string;
  viceChairmanClass: string;
  photoUrl: string;
  chairmanPhotoUrl?: string;
  viceChairmanPhotoUrl?: string;
  tagline: string;
  vision: string;
  missions: string[];
  workPrograms: {
    title: string;
    description: string;
    category: 'Akademik' | 'Kesiswaan' | 'Kreatif' | 'Sosial' | 'Teknologi';
  }[];
  voteCount?: number;
  colorTheme?: string;
}

export interface Voter {
  id: string;
  nisn: string;
  fullName: string;
  className: string;
  gender: 'L' | 'P';
  passcode: string; // hashed or 6-digit access code
  hasVoted: boolean;
  votedAt?: string | null;
  status: 'active' | 'blocked';
  receiptCode?: string;
}

export interface VoteRecord {
  id: string;
  candidateId: string;
  electionId: string;
  timestamp: string;
  verificationHash: string; // Anonymous cryptographic receipt token
}

export interface ElectionSettings {
  id: string;
  title: string;
  academicYear: string;
  schoolName: string;
  schoolAddress: string;
  schoolLogo: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isResultsPublished: boolean;
  allowRealtimeBeforeEnd: boolean;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  role: 'super_admin' | 'panitia';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

