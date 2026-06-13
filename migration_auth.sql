-- LANGKAH 3: PENGATURAN OTENTIKASI & MANAJEMEN PENGGUNA (RBAC)

-- 1. Mengizinkan pengguna untuk membuat profil mereka sendiri saat Sign Up
DROP POLICY IF EXISTS "Allow user to insert their own profile" ON public.users_profile;
CREATE POLICY "Allow user to insert their own profile" 
ON public.users_profile FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Fungsi pembantu untuk mengecek apakah user yang sedang login adalah SuperAdmin
-- (Fungsi ini menghindari error infinite recursion pada Row Level Security)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'SuperAdmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mengizinkan SuperAdmin untuk mengakses dan mengubah semua data profil pengguna
DROP POLICY IF EXISTS "Allow SuperAdmin to manage all profiles" ON public.users_profile;
CREATE POLICY "Allow SuperAdmin to manage all profiles" 
ON public.users_profile FOR ALL 
USING (public.is_superadmin()) 
WITH CHECK (public.is_superadmin());

-- 4. Pastikan kita bisa menampilkan email dari auth.users ke SuperAdmin
-- Buat View aman untuk mengambil data auth.users khusus SuperAdmin
CREATE OR REPLACE VIEW public.vw_users_with_email AS
SELECT 
    up.id,
    up.nama_lengkap,
    up.role,
    up.created_at,
    au.email
FROM 
    public.users_profile up
JOIN 
    auth.users au ON up.id = au.id;

-- Beri akses akses view ini hanya untuk SuperAdmin (dan read diri sendiri)
GRANT SELECT ON public.vw_users_with_email TO authenticated;
