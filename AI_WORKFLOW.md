# AI CODING AGENT WORKFLOW

Dokumen ini adalah instruksi permanen untuk AI coding agent yang bekerja di project ini. Ikuti panduan ini secara ketat untuk menjaga efisiensi dan akurasi.

---

# FIRST RULE

Sebelum membaca atau mengubah source code, WAJIB lakukan langkah berikut:

1. **Baca `PROJECT_MAP.md`** untuk memahami konteks arsitektur dan alur data.
2. **Tentukan fitur yang terlibat** berdasarkan permintaan user.
3. **Identifikasi file target** secara spesifik dari Feature Location Guide di bawah.
4. **Hanya buka file yang relevan** menggunakan tool `read` atau `glob`.

**JANGAN scan seluruh repository** (misal: `glob **/*` atau `grep` tanpa filter spesifik) kecuali:
- Bug tidak ditemukan setelah memeriksa dependency langsung.
- Dependency atau alur data tidak jelas dari `PROJECT_MAP.md`.
- User secara eksplisit meminta refactor besar atau analisis menyeluruh.

---

# FEATURE LOCATION GUIDE

Gunakan panduan ini untuk mengetahui di mana harus mencari kode berdasarkan fitur:

### 1. Child Selection & Domain Setup
- **Lokasi UI**: `src/components/StartPanel.tsx`, `src/components/Nav.tsx`
- **Lokasi Backend/DB**: Tabel `children`, `facts` (Supabase)
- **Lokasi Service**: `src/lib/supabase.ts`
- **Lokasi State**: `selectedChild`, `selectedDomain` di `src/App.tsx`
- **Lokasi Test**: (Belum ada, gunakan `seed.ts` sebagai referensi data)

### 2. Question Practice Session (Fill, MC, TF, Speed, Balloon)
- **Lokasi UI**: `src/components/QuestionPanel.tsx`, `src/components/BalloonPanel.tsx`, `src/components/MatchPanel.tsx`
- **Lokasi Backend/DB**: Tabel `facts` (read), `attempts` (write)
- **Lokasi Service**: `src/lib/supabase.ts` (via fungsi `saveAttempt` di `App.tsx`)
- **Lokasi State**: `sessionFacts`, `sessionFactIndex`, `sessionAttempts`, `phase` di `src/App.tsx`
- **Lokasi Logika Game**: `src/lib/gameData.ts` (parsing soal, generate opsi, build queue)

### 3. Parent Dashboard (Weak/Strong Facts)
- **Lokasi UI**: `src/components/DashboardPanel.tsx`
- **Lokasi Backend/DB**: Tabel `attempts` join `facts`
- **Lokasi Service**: `src/lib/supabase.ts`
- **Lokasi State**: Local state `weakFacts`, `strongFacts` di `src/components/DashboardPanel.tsx`
- **Lokasi Logika**: Kriteria filter ada di dalam `fetchStats` di `DashboardPanel.tsx`

### 4. Skill Progression & Unlocking
- **Lokasi UI**: `src/components/StartPanel.tsx` (indikator 🔒 / ✓)
- **Lokasi Backend/DB**: Tabel `attempts` (dibaca untuk agregasi)
- **Lokasi State**: Computed state `skillStats` di `src/App.tsx`
- **Lokasi Logika**: Fungsi `computeStats` di `src/App.tsx` dan `computeSkillMastery` di `src/lib/gameData.ts`

---

# DEBUGGING PROCESS

Saat memperbaiki bug, ikuti urutan ini secara ketat:

1. **Identifikasi fitur** yang bermasalah dari permintaan user.
2. **Buka file entry point** fitur tersebut (lihat Feature Location Guide).
3. **Buka dependency langsung** dari file tersebut (misal: import yang digunakan).
4. **Lakukan perubahan minimal** yang hanya menargetkan akar masalah.

**LARANGAN**: Jangan membaca file yang tidak terkait secara langsung dengan alur eksekusi bug tersebut. Hindari "fishing expedition" membaca file acak.

---

# IMPLEMENTATION PROCESS

Saat menambah fitur baru atau memodifikasi fitur existing:

1. **Cari fitur paling mirip** yang sudah ada di codebase (misal: ingin tambah mode soal baru? lihat `QuestionPanel.tsx`).
2. **Clone pola yang ada** (naming convention, struktur komponen, cara panggil service).
3. **Ubah hanya file terkait** yang teridentifikasi di langkah pertama.
4. Pastikan tipe data di `src/types/index.ts` diperbarui jika ada struktur data baru.

---

# RESPONSE FORMAT

Sebelum melakukan aksi coding atau membaca file, AI WAJIB menyatakan:

1. **File yang akan dibuka**: Sebutkan path absolut atau relatif file target.
2. **Alasan membuka file tersebut**: Jelaskan secara singkat kaitannya dengan permintaan user (misal: "Membuka `QuestionPanel.tsx` untuk memodifikasi logika validasi jawaban mode Speed").

**LARANGAN**: Jangan membaca file lain tanpa alasan yang jelas dan terdokumentasi dalam respons. Jangan memberikan preamble atau postamble yang tidak perlu. Langsung ke inti eksekusi.
