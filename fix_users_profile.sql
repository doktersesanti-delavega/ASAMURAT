-- SCRIPT UNTUK MEMBERBAIKI PENGGUNA YANG TIDAK MASUK KE TABEL USERS_PROFILE
-- Jalankan kode ini di dalam menu SQL Editor Supabase Anda

-- 1. Buat fungsi trigger untuk mengisi profil secara otomatis ketika user mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (id, nama_lengkap, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', split_part(NEW.email, '@', 1)),
    'Pendaftaran' -- Role default setelah daftar
  );
  RETURN NEW;
END;
$$;

-- 2. Daftar trigger (hapus jika sudah ada sebelumnya agar tidak error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Pasang trigger pada tabel auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. INSERT OTOMATIS DATA YANG SUDAH TERLANJUR MENDAFTAR TAPI PROFILNYA KOSONG
-- Script ini akan menyalin data dari auth.users yang belum memiliki profil ke tabel users_profile
INSERT INTO public.users_profile (id, nama_lengkap, role)
SELECT id, split_part(email, '@', 1), 'SuperAdmin' 
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users_profile);
