-- LANGKAH 1: SCHEMA DATABASE (PROFIL INSTANSI GLOBAL & RBAC)

-- 1. Buat ENUM untuk access-control role
CREATE TYPE user_role AS ENUM ('SuperAdmin', 'Pendaftaran', 'Dokter', 'Kasir');

-- 2. Buat tabel users_profile untuk menyimpan role pengguna yang terhubung dengan Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Pendaftaran',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS untuk users_profile
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- 3. Buat tabel pengaturan_instansi (Single-Tenant White Label)
CREATE TABLE IF NOT EXISTS public.pengaturan_instansi (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nama_instansi VARCHAR(255) NOT NULL,
    dinas_naungan VARCHAR(255),
    alamat TEXT,
    telepon VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(100),
    logo_kiri_url VARCHAR(255),
    logo_kanan_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS untuk pengaturan_instansi
ALTER TABLE public.pengaturan_instansi ENABLE ROW LEVEL SECURITY;

-- 4. Insert data default (Puskesmas Kalitengah) tanpa menghapus yang ada (aman)
INSERT INTO public.pengaturan_instansi (
    id, 
    nama_instansi, 
    dinas_naungan, 
    alamat, 
    telepon, 
    email, 
    website
) VALUES (
    1,
    'Puskesmas Kalitengah',
    'Dinas Kesehatan Kabupaten Lamongan',
    'Jl. Pemuda No. 1, Kalitengah',
    '08111111111',
    'info@puskesmaskalitengah.com',
    'www.puskesmaskalitengah.com'
) ON CONFLICT (id) DO NOTHING;

-- 5. Set RLS Policies (Hak akses dasar: Semua orang (bahkan anon) bisa membaca pengaturan instansi untuk render awal / login screen), hanya read untuk user, tulis via dashboard.

CREATE POLICY "Allow read access to pengaturan_instansi for everyone" ON public.pengaturan_instansi FOR SELECT USING (true);
CREATE POLICY "Allow read access to users_profile for authenticated users" ON public.users_profile FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow user to update their own profile" ON public.users_profile FOR UPDATE USING (auth.uid() = id);
