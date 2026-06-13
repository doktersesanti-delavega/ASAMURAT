-- LANGKAH 2: SCHEMA DATABASE (KASIR & TARIF) & MIGRATION SCRIPT

-- 1. Buat ENUM untuk status pembayaran
CREATE TYPE status_pembayaran AS ENUM ('LUNAS', 'PENDING');

-- 2. Buat tabel tarif_layanan
CREATE TABLE IF NOT EXISTS public.tarif_layanan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis_pelayanan VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    tarif_rupiah DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS untuk tarif_layanan
ALTER TABLE public.tarif_layanan ENABLE ROW LEVEL SECURITY;

-- 3. Buat tabel pembayaran
CREATE TABLE IF NOT EXISTS public.pembayaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surat_keterangan_id UUID NOT NULL UNIQUE REFERENCES public.surat_keterangan(id) ON DELETE CASCADE,
    nomor_kwitansi VARCHAR(255) NOT NULL,
    total_bayar DECIMAL(12, 2) NOT NULL DEFAULT 0,
    metode_pembayaran VARCHAR(50),
    status status_pembayaran NOT NULL DEFAULT 'PENDING',
    kasir_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS untuk pembayaran
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies dasar
DROP POLICY IF EXISTS "Allow read access for authenticated users on tarif_layanan" ON public.tarif_layanan;
DROP POLICY IF EXISTS "Allow insert access for authenticated users on tarif_layanan" ON public.tarif_layanan;
DROP POLICY IF EXISTS "Allow update access for authenticated users on tarif_layanan" ON public.tarif_layanan;
DROP POLICY IF EXISTS "Allow delete access for authenticated users on tarif_layanan" ON public.tarif_layanan;

DROP POLICY IF EXISTS "Allow read access for authenticated users on pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Allow insert access for authenticated users on pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Allow update access for authenticated users on pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Allow delete access for authenticated users on pembayaran" ON public.pembayaran;

CREATE POLICY "Allow all access on tarif_layanan" ON public.tarif_layanan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on pembayaran" ON public.pembayaran FOR ALL USING (true) WITH CHECK (true);

-- 5. MIGRATION SCRIPT: Migrasi Data Lama (Legacy Data)
-- Memastikan semua data surat_keterangan yang sudah ada di-generate data pembayarannya.
-- Status 'LUNAS', total 0, dan nomor kwitansi didasarkan id surat.
INSERT INTO public.pembayaran (
    id, 
    surat_keterangan_id, 
    nomor_kwitansi, 
    total_bayar, 
    metode_pembayaran, 
    status, 
    created_at, 
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    'LEGACY-' || id::text, 
    0,
    'LEGACY_MIGRATION',
    'LUNAS'::status_pembayaran,
    created_at,
    created_at
FROM public.surat_keterangan
-- Memastikan query aman apabila dijalankan berkali-kali, tidak akan duplikat (mengandalkan UNIQUE dari surat_keterangan_id)
ON CONFLICT (surat_keterangan_id) DO NOTHING;
