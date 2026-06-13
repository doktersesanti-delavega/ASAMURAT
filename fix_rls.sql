-- SCRIPT PERBAIKAN KEAMANAN ROW-LEVEL SECURITY (RLS)
-- Jalankan kode ini di dalam menu SQL Editor Supabase Anda
-- agar fungsi Insert pada file Excel dan Modul Pembayaran Kasir dapat berjalan dengan baik.

-- 1. Hapus aturan lama (apabila ada) 
DROP POLICY IF EXISTS "Allow all access on tarif_layanan" ON public.tarif_layanan;
DROP POLICY IF EXISTS "Allow anon insert" ON public.tarif_layanan;
DROP POLICY IF EXISTS "Allow all access on pembayaran" ON public.pembayaran;

-- 2. Buat kembali aturan Allow All yang memperbolehkan segala Role melakukan aksinya
CREATE POLICY "Allow all access on tarif_layanan" 
ON public.tarif_layanan 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on pembayaran" 
ON public.pembayaran 
FOR ALL USING (true) WITH CHECK (true);

-- 3. Update aturan Pengaturan Instansi agar dapat diatur
CREATE POLICY "Allow all access on pengaturan_instansi" 
ON public.pengaturan_instansi 
FOR ALL USING (true) WITH CHECK (true);
