-- SCRIPT UNTUK MEMPERBAIKI AKUN YANG SANGKUT KARENA "EMAIL NOT CONFIRMED"
-- Jalankan kode ini di SQL Editor Supabase Anda

-- Perintah ini akan menandai semua akun yang belum dikonfirmasi menjadi sudah dikonfirmasi secara otomatis.
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
