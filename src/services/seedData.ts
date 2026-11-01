import { Candidate, ElectionSettings, Voter, Announcement, AdminLog, AdminUser } from '../types';

export const INITIAL_SETTINGS: ElectionSettings = {
  id: 'election-2026-2027',
  title: 'PEMILIHAN KETUA & WAKIL KETUA OSIS',
  academicYear: '2026/2027',
  schoolName: 'SMA NEGERI 1 RAHAYU',
  schoolAddress: 'Jl. Pendidikan No. 45, Kompleks Karang Rahayu, Jawa Barat',
  schoolLogo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=300&q=80',
  status: 'ongoing',
  startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Started 2 hours ago
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),   // Closes in 24 hours
  isResultsPublished: false, // Hidden until election closes / published by admin
  allowRealtimeBeforeEnd: false,
  tagline: 'Satu Suara, Satu Perubahan, Masa Depan Sekolah, RAHAYU',
  contactEmail: 'panitia.evoting@sman1rahayu.sch.id',
  contactPhone: '+62 821-2345-6789 (WhatsApp Panitia)',
  contactPerson: 'Bapak Ahmad Fauzi, S.Pd (Pembina OSIS) / Naufal Rizky (Ketua MPK)',
};

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-01',
    candidateNumber: 1,
    chairmanName: 'Muhammad Rizky Pratama',
    viceChairmanName: 'Siti Nurhaliza Azzahra',
    chairmanClass: 'XI A 1',
    viceChairmanClass: 'XI B 2',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    chairmanPhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
    viceChairmanPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
    tagline: 'Sinergi Harmoni, Berprestasi Tanpa Henti',
    vision: 'Mewujudkan OSIS SMA Negeri 1 Rahayu sebagai wadah aspirasi yang inklusif, adaptif terhadap kemajuan era digital, berkarakter luhur, dan berdaya saing global.',
    missions: [
      'Meningkatkan partisipasi aktif seluruh siswa dalam kegiatan ekstrakurikuler dan akademik melalui platform digital terintegrasi.',
      'Menanamkan budaya kepemimpinan berwawasan lingkungan hidup (Green Campus Initiative) dan kesetiakawanan sosial.',
      'Memfasilitasi ruang kreatif siswa dalam bidang seni, sains terapan, kewirausahaan muda, dan olahraga prestasi.',
      'Membangun komunikasi transparan dan dua arah antara siswa, guru, komite sekolah, dan alumni.'
    ],
    workPrograms: [
      {
        title: 'Rahayu Digital Student Hub',
        description: 'Aplikasi web mading sekolah, rekap prestasi, dan forum aspirasi siswa secara transparan.',
        category: 'Teknologi'
      },
      {
        title: 'Rahayu EduFest & Career Day',
        description: 'Pameran kampus PTN/PTS favorit, bimbingan SNBP/SNBT, dan temu alumni inspiratif.',
        category: 'Akademik'
      },
      {
        title: 'Eco-School Zero Waste Movement',
        description: 'Bank sampah plastik bernilai beasiswa, pemilahan organik, dan taman hydroponik sekolah.',
        category: 'Sosial'
      },
      {
        title: 'Pekan Olahraga & Seni (PORSENI) Milenial',
        description: 'Turnamen e-sports resmi, futsal, basket, festival tari kreasi sunda dan band akustik.',
        category: 'Kreatif'
      }
    ],
    colorTheme: '#1E3E62'
  },
  {
    id: 'cand-02',
    candidateNumber: 2,
    chairmanName: 'Farhan Dwi Ramadhan',
    viceChairmanName: 'Amanda Putri Lestari',
    chairmanClass: 'XI A 3',
    viceChairmanClass: 'XI BAHASA',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    chairmanPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    viceChairmanPhotoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
    tagline: 'Kreatif, Kolaboratif, Berbudi Pekerti Luhur',
    vision: 'Membangun ekosistem sekolah yang menyenangkan, mendorong kreativitas tanpa batas, serta mencetak kader pemimpin berakhlak mulia dan berwawasan kebangsaan.',
    missions: [
      'Mengoptimalkan peran ekstrakurikuler sebagai laboratorium soft skills, kepemimpinan, dan bakat siswa.',
      'Mengembangkan program bimbingan sebaya (Peer Tutoring) untuk memperkuat pemahaman akademik tanpa stres.',
      'Menghidupkan pentas ekspresi seni, literasi modern, dan podcast siswa "Suara Rahayu".',
      'Mewujudkan sekolah ramah anak yang bebas dari bullying, diskriminasi, dan intoleransi.'
    ],
    workPrograms: [
      {
        title: 'Podcast "Suara Rahayu" & Media Kreatif',
        description: 'Kanal siaran mingguan membahas isu kekinian siswa, tips belajar, dan showcase bakat.',
        category: 'Kreatif'
      },
      {
        title: 'Sahabat Sebaya (Anti-Bullying Center)',
        description: 'Unit konseling teman sebaya berkolaborasi dengan Guru BK untuk kesehatan mental pelajar.',
        category: 'Kesiswaan'
      },
      {
        title: 'Inkubator Wirausaha Muda Pelajar',
        description: 'Bazar kewirausahaan, pelatihan digital marketing, dan packaging produk buatan siswa.',
        category: 'Kreatif'
      },
      {
        title: 'Bakti Peduli Desa & Donor Darah',
        description: 'Aksi sosial tahunan pengabdian ke desa sekitar, mengajar anak-anak, dan bakti sembako.',
        category: 'Sosial'
      }
    ],
    colorTheme: '#0F766E'
  },
  {
    id: 'cand-03',
    candidateNumber: 3,
    chairmanName: 'Arya Bagus Perkasa',
    viceChairmanName: 'Devi Anggraeni Kusuma',
    chairmanClass: 'XI B 1',
    viceChairmanClass: 'XI A 2',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    chairmanPhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
    viceChairmanPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    tagline: 'Aksi Nyata, Nyata Kerjanya, Gemilang Hasilnya',
    vision: 'Menjadikan OSIS sebagai jembatan pembaharuan yang solutif, responsif, berintegritas tinggi, serta membawa nama harum sekolah di kancah nasional maupun internasional.',
    missions: [
      'Memperkuat advokasi hak belajar siswa, fasilitas sekolah, serta kenyamanan ruang belajar bersama.',
      'Menggiatkan klub olimpiade sains, debat bahasa inggris, riset ilmiah remaja (KIR), dan robotika.',
      'Menyusun agenda kegiatan yang terencana, tepat waktu, dan akuntabel kepada seluruh warga sekolah.',
      'Meningkatkan jiwa patriotisme, kedisiplinan, dan kepedulian terhadap kebersihan lingkungan sekolah.'
    ],
    workPrograms: [
      {
        title: 'Rahayu Olympiad & Research Bootcamp',
        description: 'Pembinaan intensif persiapan OSN, FLS2N, O2SN, dan Lomba Debat Nasional.',
        category: 'Akademik'
      },
      {
        title: 'Open Transparency Report OSIS',
        description: 'Laporan pertanggungjawaban anggaran dan program kerja OSIS secara terbuka setiap triwulan.',
        category: 'Kesiswaan'
      },
      {
        title: 'Smart Library & Cozy Study Corner',
        description: 'Revitalisasi pojok baca kelas dengan e-book gratis dan ruang diskusi kondusif.',
        category: 'Akademik'
      },
      {
        title: 'Festival Budaya Nusantara & Pasundan',
        description: 'Pentas busana adat, festival kuliner tradisional, dan pagelaran musik angklung kolosal.',
        category: 'Kreatif'
      }
    ],
    colorTheme: '#854D0E'
  }
];

export const INITIAL_VOTERS: Voter[] = [
  {
    id: 'voter-01',
    nisn: '0071234501',
    fullName: 'Aditya Pratama Putra',
    className: 'X A 1',
    gender: 'L',
    passcode: '123456',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-02',
    nisn: '0071234502',
    fullName: 'Anisa Citra Dewi',
    className: 'X A 2',
    gender: 'P',
    passcode: '234567',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-03',
    nisn: '0071234503',
    fullName: 'Bagas Wahyu Saputra',
    className: 'XI A 1',
    gender: 'L',
    passcode: '345678',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-04',
    nisn: '0071234504',
    fullName: 'Cantika Putri Maharani',
    className: 'XI B 1',
    gender: 'P',
    passcode: '456789',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-05',
    nisn: '0071234505',
    fullName: 'Dimas Anggara Yudha',
    className: 'XII A 1',
    gender: 'L',
    passcode: '567890',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-06',
    nisn: '0071234506',
    fullName: 'Eka Nur Safitri',
    className: 'XII B 2',
    gender: 'P',
    passcode: '678901',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-07',
    nisn: '0071234507',
    fullName: 'Fikri Haikal Ramadhan',
    className: 'X BAHASA',
    gender: 'L',
    passcode: '789012',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  },
  {
    id: 'voter-08',
    nisn: '0071234508',
    fullName: 'Gita Melani Sukmawati',
    className: 'XI B 2',
    gender: 'P',
    passcode: '890123',
    hasVoted: false,
    votedAt: null,
    status: 'active'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    title: 'Pelaksanaan E-Voting OSIS Periode 2026/2027 Resmi Dibuka',
    content: 'Panitia Pemilihan Umum Ketua & Wakil Ketua OSIS (PPO) mengumumkan bahwa bilik suara digital telah dibuka. Seluruh siswa/i yang tercatat di DPT diharapkan menggunakan hak suaranya dengan bijak, jujur, dan bertanggung jawab.',
    date: '31 Oktober 2026',
    priority: 'urgent'
  },
  {
    id: 'ann-02',
    title: 'Kerahasiaan Suara Dijamin 100% Menggunakan Sistem Hash Kriptografis',
    content: 'Sistem OSIS VOTE menggunakan pemisahan otentikasi pemilih dan data suara. Pilihan kandidat Anda disimpan secara anonim tanpa nama atau NISN, sehingga pilihan Anda bersifat Rahasia, Bebas, dan Adil.',
    date: '30 Oktober 2026',
    priority: 'important'
  },
  {
    id: 'ann-03',
    title: 'Layanan Bantuan & Reset Kode Akses Bilik Suara',
    content: 'Jika kartu pemilih hilang atau lupa kode akses NISN, silakan hubungi Posko Bantuan Panitia di Ruang Laboratorium Komputer atau melalui WhatsApp Center resmi.',
    date: '29 Oktober 2026',
    priority: 'normal'
  }
];

export const INITIAL_ADMIN_LOGS: AdminLog[] = [
  {
    id: 'log-01',
    adminName: 'Panitia Inti (Ahmad Fauzi)',
    action: 'Inisialisasi Pemilihan',
    details: 'Status pemilihan diubah menjadi "Sedang Berlangsung". Bilik suara dibuka.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-02',
    adminName: 'Admin Sistem',
    action: 'Verifikasi DPT',
    details: 'Verifikasi 8 Daftar Pemilih Tetap awal berhasil disinkronkan.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'adm-01',
    username: 'admin',
    fullName: 'Administrator Utama OSIS',
    password: 'adminosis2026',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastLogin: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'adm-02',
    username: 'panitia',
    fullName: 'Panitia Pemilihan OSIS (PPO)',
    password: 'panitia2026',
    role: 'panitia',
    status: 'active',
    createdAt: '2026-10-15T09:30:00.000Z',
  },
  {
    id: 'adm-03',
    username: 'pembina',
    fullName: 'Pembina Kesiswaan OSIS',
    password: 'pembina2026',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-10-20T10:15:00.000Z',
  },
];
