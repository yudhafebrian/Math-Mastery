# PROJECT OVERVIEW

## Tujuan Aplikasi
Game edukasi latihan fakta matematika (penjumlahan dan perkalian) untuk anak sekolah dasar. Tujuannya adalah membantu anak membangun ingatan otomatis (automatic recall) terhadap fakta matematika dasar dengan melacak akurasi dan waktu respons, serta memberikan dashboard untuk orang tua memantau progres.

## Fitur Utama
- **Manajemen Profil Anak**: Pembuatan dan pemilihan profil anak tanpa autentikasi kompleks.
- **Progression System (Skill Unlock)**: Skill harus dikuasai (akurasi ≥90% dan rata-rata waktu ≤3 detik) sebelum skill berikutnya terbuka.
- **Mode Pertanyaan Variatif**: Fill in Blank, Multiple Choice, True/False, Speed, dan Balloon.
- **Match Rounds**: Sesi latihan diselingi ronde "Match" setiap 5 fakta untuk memperkuat ingatan.
- **Parent Dashboard**: Menampilkan fakta lemah (perlu latihan) dan fakta kuat (sudah dikuasai) berdasarkan data historis.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Tooling**: `tsx` (untuk script seeding)

## Flow Bisnis Utama
1. Orang tua memilih/membuat profil anak.
2. Memilih domain (Addition atau Multiplication).
3. Sistem menampilkan daftar skill berurutan; hanya skill yang *unlocked* yang bisa dipraktikkan.
4. Anak memulai sesi latihan: menjawab pertanyaan individu (mode bergantian) diselingi ronde Match.
5. Setiap jawaban dicatat ke database (akurasi & waktu respons).
6. Sesi berakhir dengan ringkasan. Jika kriteria mastery terpenuhi, skill berikutnya terbuka.
7. Orang tua dapat memantau progres melalui tab "Parent" (Dashboard).

---

# DIRECTORY MAP

## `src/`
Fungsi: Direktori utama kode sumber aplikasi React.
- **File Penting**: `App.tsx`, `main.tsx`
- **Dependency**: `lib/`, `types/`, `components/`

### `src/components/`
Fungsi: Komponen UI React yang modular.
- **File Penting**: 
  - `StartPanel.tsx` (Halaman awal pemilihan anak & skill)
  - `QuestionPanel.tsx` (UI utama menjawab pertanyaan)
  - `MatchPanel.tsx` (UI untuk ronde pencocokan)
  - `DashboardPanel.tsx` (UI dashboard orang tua)
  - `Nav.tsx` (Navigasi antar tab utama)
- **Dependency**: `src/types/`, `src/lib/gameData.ts`

### `src/lib/`
Fungsi: Logika bisnis, utilitas, dan koneksi layanan.
- **File Penting**: 
  - `supabase.ts` (Inisialisasi client Supabase)
  - `gameData.ts` (Logika mastery, urutan skill, parsing pertanyaan, pembuatan antrian sesi)
- **Dependency**: `src/types/`, `.env`

### `src/types/`
Fungsi: Definisi tipe data TypeScript global.
- **File Penting**: `index.ts` (berisi interface `Child`, `Fact`, `Attempt`, `ChildStats`)

## `public/`
Fungsi: Aset statis.
- **File Penting**: `music/correct.mp3`, `music/wrong.mp3`

## Root Directory
- **`schema.sql`**: Skema database PostgreSQL (sumber kebenaran struktur tabel).
- **`seed.ts`**: Script untuk mengisi database dengan data awal (anak dan fakta matematika).
- **`package.json`**: Dependency dan script npm (`dev`, `build`, `seed`).

---

# DATABASE TABLE SCHEME
*(Lihat `schema.sql` untuk detail lengkap)*

1. **`children`**
   - `id` (uuid, PK)
   - `name` (text)
   - `avatar` (text)
   - `created_at` (timestamptz)

2. **`facts`**
   - `id` (serial, PK)
   - `domain` (text: 'addition' | 'multiplication')
   - `skill` (text, misal: 'Make 10', '×2')
   - `question` (text, misal: '6 + 7' atau '_ + 7 = 13')
   - `answer` (integer)
   - `strategy` (text, tips menjawab)

3. **`attempts`**
   - `id` (uuid, PK)
   - `child_id` (uuid, FK ke `children`)
   - `fact_id` (integer, FK ke `facts`)
   - `is_correct` (boolean)
   - `response_time_ms` (integer)
   - `created_at` (timestamptz)

---

# FEATURE MAP

### 1. Child Selection & Domain Setup
- **Entry Point**: `src/App.tsx` → `StartPanel.tsx`
- **Halaman UI**: `StartPanel.tsx`
- **API/Service**: `supabase.from('children').select()`
- **Database**: `children`, `facts`
- **State Management**: `selectedChild`, `selectedDomain` di `App.tsx`
- **File untuk Dimodifikasi**: `src/components/StartPanel.tsx`, `src/App.tsx`

### 2. Question Practice Session
- **Entry Point**: `src/App.tsx` (fungsi `startSession`)
- **Halaman UI**: `QuestionPanel.tsx`, `BalloonPanel.tsx`, `MatchPanel.tsx`
- **API/Service**: `supabase.from('attempts').insert()` (via `saveAttempt`)
- **Database**: `facts` (read), `attempts` (write)
- **State Management**: `sessionFacts`, `sessionFactIndex`, `sessionAttempts`, `phase` di `App.tsx`
- **File untuk Dimodifikasi**: `src/components/QuestionPanel.tsx`, `src/lib/gameData.ts`

### 3. Parent Dashboard
- **Entry Point**: `Nav.tsx` → `DashboardPanel.tsx`
- **Halaman UI**: `DashboardPanel.tsx`
- **API/Service**: `supabase.from('attempts').select('*, facts!inner(...)')`
- **Database**: `attempts`, `facts`
- **State Management**: `weakFacts`, `strongFacts` (local state di `DashboardPanel.tsx`)
- **File untuk Dimodifikasi**: `src/components/DashboardPanel.tsx`, `src/lib/gameData.ts` (jika mengubah kriteria weak/strong)

### 4. Skill Progression & Unlocking
- **Entry Point**: `src/App.tsx` (fungsi `computeStats` dan `endSession`)
- **Halaman UI**: `StartPanel.tsx` (menampilkan status 🔒 Locked / ✓ Unlocked)
- **Database**: `attempts` (dibaca untuk menghitung akurasi dan rata-rata waktu)
- **State Management**: `skillStats` (computed state di `App.tsx`)
- **File untuk Dimodifikasi**: `src/App.tsx`, `src/lib/gameData.ts` (fungsi `computeSkillMastery`)

---

# REQUEST ROUTING

Jika user meminta:
- **Mengubah design UI atau UX**: Periksa `src/index.css` (variabel CSS, custom styles) dan file komponen terkait di `src/components/`.
- **Mengubah fitur existing (logika game)**: Periksa `src/App.tsx` (state flow) dan `src/lib/gameData.ts` (aturan game, urutan skill, kriteria mastery).
- **Menambah fitur baru (halaman/komponen)**: Periksa `src/App.tsx` (untuk menambahkan route/view baru), `src/types/index.ts` (untuk tipe data baru), dan buat komponen baru di `src/components/`.
- **Mengubah isi database / menambah tabel/kolom/row**: Periksa `schema.sql` (untuk DDL), `src/types/index.ts` (untuk update interface TypeScript), dan `seed.ts` (jika perlu menambah data dummy). *Catatan: Perubahan skema juga harus dicerminkan di dashboard Supabase.*

---

# DATA FLOW

**Alur Menjawab Pertanyaan:**
1. **UI**: User memasukkan jawaban di `QuestionPanel.tsx`.
2. **State**: `QuestionPanel` memanggil prop `onAnswer(correct, timeMs)`. `App.tsx` menerima ini, memperbarui state `sessionAttempts`, dan memanggil fungsi `recordAttempt`.
3. **Service**: `App.tsx` memanggil `saveAttempt`, yang mengeksekusi `supabase.from('attempts').insert(...)`.
4. **API**: Supabase JS Client mengirim request REST ke backend Supabase.
5. **Database**: Data tersimpan di tabel `attempts` di PostgreSQL.

**Alur Menghitung Mastery:**
1. **Database**: `App.tsx` mengambil semua `attempts` untuk `child_id` yang dipilih.
2. **Service/Logic**: Fungsi `computeStats` di `App.tsx` (atau `computeSkillMastery` di `gameData.ts`) mengelompokkan attempts berdasarkan `skill`.
3. **State**: Hasil perhitungan (accuracy, avgTime) disimpan di state `skillStats`.
4. **UI**: `StartPanel.tsx` membaca `skillStats` untuk menentukan apakah skill berstatus `locked`, `In progress`, atau `Unlocked` (mastered).

---

# IMPORTANT FILES
Daftar file yang hampir selalu menjadi sumber perubahan:
1. `src/App.tsx` - Pusat manajemen state dan alur sesi aplikasi.
2. `src/lib/gameData.ts` - Logika inti game (urutan skill, parsing soal, kalkulasi mastery).
3. `src/components/QuestionPanel.tsx` - Komponen UI utama interaksi user.
4. `src/types/index.ts` - Definisi tipe data yang digunakan di seluruh aplikasi.
5. `schema.sql` - Referensi struktur database.

---

# DO NOT TOUCH
Daftar file sensitif atau konfigurasi yang tidak boleh diubah kecuali diminta secara eksplisit:
1. `.env` - Berisi kredensial Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. `node_modules/` - Direktori dependensi yang di-generate otomatis.
3. `dist/` - Direktori output build produksi.
4. `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` - File konfigurasi build/tooling (ubah hanya jika ada instruksi spesifik untuk mengubah setup proyek).
5. `package-lock.json` - Biarkan npm mengelolanya secara otomatis saat menginstall dependensi.
