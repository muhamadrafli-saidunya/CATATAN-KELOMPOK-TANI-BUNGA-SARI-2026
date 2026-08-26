import * as XLSX from 'xlsx';
import { Petani, PanenRecord, ArmadaTruk, PengaturanKelompok } from '../types';

/**
 * Generates and downloads a clean, beautifully structured Excel workbook (.xlsx)
 * for harvest (Panen TBS) template with sample data, column definitions, and lookup reference sheets.
 */
export const downloadPanenExcelTemplate = (
  petaniList?: Petani[],
  armadaList?: ArmadaTruk[],
  pengaturan?: PengaturanKelompok
) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Template Data Panen
  const samplePanenData = [
    {
      'No': 1,
      'No SPB': 'SPB-2026-001',
      'Tanggal Panen': '2026-08-25',
      'Nama Petani': 'H. Syamsudin Siregar',
      'Blok Lahan': 'Blok A (Utara)',
      'Timbangan Kebun (Kg)': 5420,
      'Timbangan Pabrik (Kg)': 5360,
      'Harga TBS (Rp/Kg)': 2780,
      'Potongan Pedaran (Kg)': 0,
      'Iuran Kas (Rp)': 0,
      'Upah Panen (Rp)': 0,
      'Kasbon Pupuk (Rp)': 0,
      'PKS Tujuan': 'PT. Sawit Sejahtera Tapung',
      'Plat Truk': 'BM 8412 TA',
      'Nama Sopir': 'Pak Eko',
      'Nama Pemanen': 'Regu A (3 Orang)',
      'Status Bayar': 'Siap Bayar',
      'Catatan': 'Buah matang sempurna grade A',
    },
    {
      'No': 2,
      'No SPB': 'SPB-2026-002',
      'Tanggal Panen': '2026-08-25',
      'Nama Petani': 'M. Yusuf Hasibuan',
      'Blok Lahan': 'Blok B (Timur)',
      'Timbangan Kebun (Kg)': 6180,
      'Timbangan Pabrik (Kg)': 6090,
      'Harga TBS (Rp/Kg)': 2780,
      'Potongan Pedaran (Kg)': 0,
      'Iuran Kas (Rp)': 0,
      'Upah Panen (Rp)': 0,
      'Kasbon Pupuk (Rp)': 0,
      'PKS Tujuan': 'PT. Sawit Sejahtera Tapung',
      'Plat Truk': 'BM 8412 TA',
      'Nama Sopir': 'Pak Eko',
      'Nama Pemanen': 'Regu B',
      'Status Bayar': 'Siap Bayar',
      'Catatan': '',
    },
    {
      'No': 3,
      'No SPB': 'SPB-2026-003',
      'Tanggal Panen': '2026-08-25',
      'Nama Petani': 'Ahmad Ridwan Dalimunthe',
      'Blok Lahan': 'Blok D (Barat)',
      'Timbangan Kebun (Kg)': 7850,
      'Timbangan Pabrik (Kg)': 7720,
      'Harga TBS (Rp/Kg)': 2780,
      'Potongan Pedaran (Kg)': 0,
      'Iuran Kas (Rp)': 0,
      'Upah Panen (Rp)': 0,
      'Kasbon Pupuk (Rp)': 0,
      'PKS Tujuan': 'PT. Agro Mandiri Sawit',
      'Plat Truk': 'BM 9120 ZB',
      'Nama Sopir': 'Bang Anto',
      'Nama Pemanen': 'Regu C (4 Orang)',
      'Status Bayar': 'Siap Bayar',
      'Catatan': 'TBS panen rotasi 12 hari',
    },
    {
      'No': 4,
      'No SPB': 'SPB-2026-004',
      'Tanggal Panen': '2026-08-25',
      'Nama Petani': 'Siti Rohana Harahap',
      'Blok Lahan': 'Blok C (Selatan)',
      'Timbangan Kebun (Kg)': 4200,
      'Timbangan Pabrik (Kg)': 4140,
      'Harga TBS (Rp/Kg)': 2780,
      'Potongan Pedaran (Kg)': 0,
      'Iuran Kas (Rp)': 0,
      'Upah Panen (Rp)': 0,
      'Kasbon Pupuk (Rp)': 0,
      'PKS Tujuan': 'PT. Sawit Sejahtera Tapung',
      'Plat Truk': 'BM 8412 TA',
      'Nama Sopir': 'Pak Eko',
      'Nama Pemanen': 'Regu A',
      'Status Bayar': 'Siap Bayar',
      'Catatan': '',
    },
  ];

  const wsPanenTemplate = XLSX.utils.json_to_sheet(samplePanenData);
  wsPanenTemplate['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // No SPB
    { wch: 15 }, // Tanggal Panen
    { wch: 26 }, // Nama Petani
    { wch: 18 }, // Blok Lahan
    { wch: 22 }, // Timbangan Kebun (Kg)
    { wch: 22 }, // Timbangan Pabrik (Kg)
    { wch: 18 }, // Harga TBS (Rp/Kg)
    { wch: 22 }, // Potongan Pedaran (Kg)
    { wch: 16 }, // Iuran Kas (Rp)
    { wch: 16 }, // Upah Panen (Rp)
    { wch: 18 }, // Kasbon Pupuk (Rp)
    { wch: 26 }, // PKS Tujuan
    { wch: 16 }, // Plat Truk
    { wch: 16 }, // Nama Sopir
    { wch: 20 }, // Nama Pemanen
    { wch: 16 }, // Status Bayar
    { wch: 30 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, wsPanenTemplate, 'Template Data Panen');

  // 2. Sheet 2: Petunjuk & Aturan Kolom
  const petunjukPanenData = [
    {
      'Nama Kolom': 'No SPB',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: SPB-2026-001)',
      'Keterangan & Logika': 'Nomor Surat Pengantar Buah. Jika dikosongkan, sistem akan otomatis membuat nomor SPB berurutan.',
    },
    {
      'Nama Kolom': 'Tanggal Panen',
      'Status': 'WAJIB',
      'Format & Contoh': 'YYYY-MM-DD (cth: 2026-08-25)',
      'Keterangan & Logika': 'Tanggal pelaksanaan panen dan penimbangan di kebun/ram.',
    },
    {
      'Nama Kolom': 'Nama Petani',
      'Status': 'WAJIB',
      'Format & Contoh': 'Teks (cth: H. Syamsudin Siregar)',
      'Keterangan & Logika': 'Nama anggota petani terdaftar. Sesuaikan dengan sheet "Master Petani".',
    },
    {
      'Nama Kolom': 'Blok Lahan',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: Blok A (Utara))',
      'Keterangan & Logika': 'Blok lokasi lahan kebun yang dipanen.',
    },
    {
      'Nama Kolom': 'Timbangan Kebun (Kg)',
      'Status': 'WAJIB',
      'Format & Contoh': 'Angka dalam Kg (cth: 5420)',
      'Keterangan & Logika': 'Berat timbangan buah di kebun / RAM luar sebelum dimuat ke truk.',
    },
    {
      'Nama Kolom': 'Timbangan Pabrik (Kg)',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Angka dalam Kg (cth: 5360)',
      'Keterangan & Logika': 'Hasil timbangan netto di Pabrik Kelapa Sawit (PKS). Jika belum ada slip PKS, isi sama dengan Timbangan Kebun.',
    },
    {
      'Nama Kolom': 'Harga TBS (Rp/Kg)',
      'Status': 'WAJIB',
      'Format & Contoh': 'Angka Rupiah (cth: 2780)',
      'Keterangan & Logika': 'Harga penetapan TBS per kilogram pada tanggal periode panen terkait.',
    },
    {
      'Nama Kolom': 'Potongan Pedaran (Kg)',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Angka dalam Kg (cth: 0)',
      'Keterangan & Logika': 'Potongan sortir / pedaran per petani. Isi 0 jika tidak ada potongan.',
    },
    {
      'Nama Kolom': 'Iuran Kas (Rp)',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Nominal Rupiah (cth: 0)',
      'Keterangan & Logika': 'Iuran kas kelompok per transaksi. Isi 0 jika dinonaktifkan.',
    },
    {
      'Nama Kolom': 'Upah Panen (Rp)',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Nominal Rupiah (cth: 0)',
      'Keterangan & Logika': 'Total upah pemanen. Isi 0 jika dibayar mandiri oleh petani.',
    },
    {
      'Nama Kolom': 'Kasbon Pupuk (Rp)',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Nominal Rupiah (cth: 0)',
      'Keterangan & Logika': 'Potongan angsuran kasbon/pupuk anggota pada panen ini.',
    },
    {
      'Nama Kolom': 'PKS Tujuan',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: PT. Sawit Sejahtera Tapung)',
      'Keterangan & Logika': 'Pabrik penerima muatan TBS.',
    },
    {
      'Nama Kolom': 'Plat Truk',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: BM 8412 TA)',
      'Keterangan & Logika': 'Nomor polisi armada pengangkut TBS.',
    },
    {
      'Nama Kolom': 'Nama Sopir',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: Pak Eko)',
      'Keterangan & Logika': 'Nama pengemudi truk armada.',
    },
    {
      'Nama Kolom': 'Nama Pemanen',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: Regu A)',
      'Keterangan & Logika': 'Nama tim atau regu pemanen TBS.',
    },
    {
      'Nama Kolom': 'Status Bayar',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Siap Bayar / Lunas / Draft',
      'Keterangan & Logika': 'Status pencairan hasil panen petani. Default: Siap Bayar.',
    },
    {
      'Nama Kolom': 'Catatan',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks Bebas',
      'Keterangan & Logika': 'Keterangan tambahan operasional atau mutu TBS.',
    },
  ];

  const wsPetunjukPanen = XLSX.utils.json_to_sheet(petunjukPanenData);
  wsPetunjukPanen['!cols'] = [
    { wch: 24 }, // Nama Kolom
    { wch: 14 }, // Status
    { wch: 35 }, // Format & Contoh
    { wch: 65 }, // Keterangan & Logika
  ];

  XLSX.utils.book_append_sheet(wb, wsPetunjukPanen, 'Petunjuk & Aturan Kolom');

  // 3. Sheet 3: Master Petani (Lookup)
  if (petaniList && petaniList.length > 0) {
    const masterPetaniRows = petaniList.map((p, idx) => ({
      'No': idx + 1,
      'Nama Lengkap Petani': p.nama,
      'Blok Lahan': p.blokLahan,
      'Luas Kebun (Ha)': p.luasHa,
      'No HP / WhatsApp': p.noHp,
      'Rekening / Bank': `${p.bank} - ${p.noRekening}`,
      'Status': p.statusAktif ? 'Aktif' : 'Nonaktif',
    }));

    const wsMasterPetani = XLSX.utils.json_to_sheet(masterPetaniRows);
    wsMasterPetani['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 30 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMasterPetani, 'Master Petani');
  }

  // 4. Sheet 4: Master Armada & PKS
  const pksDefault = pengaturan?.namaPksDefault || 'PT. Sawit Sejahtera Tapung';
  const masterArmadaRows = (armadaList && armadaList.length > 0 ? armadaList : [
    { platNomor: 'BM 8412 TA', namaSopir: 'Pak Eko', jenisKendaraan: 'Colt Diesel Canter', kapasitasTon: 8.5, status: 'Aktif' },
    { platNomor: 'BM 9120 ZB', namaSopir: 'Bang Anto', jenisKendaraan: 'Dump Truk Dyna', kapasitasTon: 9.0, status: 'Aktif' },
    { platNomor: 'BM 8871 QT', namaSopir: 'Pak Rizal', jenisKendaraan: 'Colt Diesel HDX', kapasitasTon: 8.5, status: 'Aktif' },
  ]).map((a, idx) => ({
    'No': idx + 1,
    'Plat Nomor Truk': a.platNomor,
    'Nama Sopir': a.namaSopir,
    'Jenis Kendaraan': a.jenisKendaraan,
    'Kapasitas (Ton)': a.kapasitasTon,
    'PKS Langganan': pksDefault,
    'Status Armada': a.status,
  }));

  const wsMasterArmada = XLSX.utils.json_to_sheet(masterArmadaRows);
  wsMasterArmada['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMasterArmada, 'Master Armada & PKS');

  XLSX.writeFile(wb, 'Template_Input_Panen_Kelompok_Tani.xlsx');
};

/**
 * Exports detailed Panen records to a professional multi-sheet Excel workbook (.xlsx).
 */
export const exportPanenToExcel = (
  panenList: PanenRecord[],
  options?: {
    namaKelompok?: string;
    periodeLabel?: string;
  }
) => {
  const wb = XLSX.utils.book_new();
  const namaKelompok = options?.namaKelompok || 'Kelompok Tani Bunga Sari';
  const periodeLabel = options?.periodeLabel || 'Semua Periode';

  // 1. Sheet 1: Rekap & Detail Data Panen TBS
  const dataRows = panenList.map((p, idx) => {
    const kebunKg = p.timbanganRamKg > 0 ? p.timbanganRamKg : p.timbanganPksKg;
    const pabrikKg = p.timbanganPksKg > 0 ? p.timbanganPksKg : p.timbanganRamKg;
    const selisihKg = kebunKg - pabrikKg;
    const susutPersen = kebunKg > 0 ? Number(((selisihKg / kebunKg) * 100).toFixed(2)) : 0;

    return {
      'No': idx + 1,
      'No. SPB': p.noSpb,
      'Tanggal Panen': p.tanggal,
      'Nama Petani': p.petaniNama,
      'Blok Lahan': p.blokLahan,
      'Timbangan Kebun (Kg)': kebunKg,
      'Timbangan Pabrik (Kg)': pabrikKg,
      'Selisih / Susut (Kg)': selisihKg,
      'Susut (%)': `${susutPersen}%`,
      'Harga TBS (Rp/Kg)': p.hargaTbsPerKg,
      'Pendapatan Bruto (Rp)': p.totalBruto,
      'Potongan Pedaran (Kg)': p.potonganPedaranKg || 0,
      'Potongan Pedaran (Rp)': p.potonganPedaranRupiah || 0,
      'Iuran Kas (Rp)': p.potonganIuranKasRupiah || 0,
      'Upah Panen (Rp)': p.upahPemanenRupiah || 0,
      'Kasbon Pupuk (Rp)': p.kasbonPupukRupiah || 0,
      'Total Potongan (Rp)': p.totalPotongan || 0,
      'Netto Diterima Petani (Rp)': p.totalNetto,
      'PKS Tujuan': p.namaPks,
      'Plat Truk': p.platTruk,
      'Nama Sopir': p.namaSopir,
      'Nama Pemanen': p.namaPemanen || '-',
      'Status Bayar': p.statusPembayaran,
      'Catatan': p.catatan || '-',
    };
  });

  const wsDetail = XLSX.utils.json_to_sheet(dataRows);
  wsDetail['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // No SPB
    { wch: 15 }, // Tanggal
    { wch: 26 }, // Petani
    { wch: 18 }, // Blok
    { wch: 20 }, // Kebun Kg
    { wch: 20 }, // Pabrik Kg
    { wch: 18 }, // Selisih Kg
    { wch: 12 }, // Susut %
    { wch: 18 }, // Harga TBS
    { wch: 22 }, // Bruto
    { wch: 20 }, // Pedaran Kg
    { wch: 20 }, // Pedaran Rp
    { wch: 16 }, // Iuran Kas
    { wch: 16 }, // Upah Panen
    { wch: 18 }, // Kasbon
    { wch: 20 }, // Total Potongan
    { wch: 24 }, // Netto Petani
    { wch: 26 }, // PKS
    { wch: 16 }, // Truk
    { wch: 16 }, // Sopir
    { wch: 18 }, // Pemanen
    { wch: 14 }, // Status
    { wch: 26 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Panen TBS');

  // 2. Sheet 2: Ringkasan Rekap Petani
  const petaniSummary: Record<string, {
    nama: string;
    blok: string;
    totalRit: number;
    totalKebunKg: number;
    totalPabrikKg: number;
    totalSelisihKg: number;
    totalBruto: number;
    totalPotongan: number;
    totalNetto: number;
    statusBayar: string;
  }> = {};

  panenList.forEach(p => {
    const key = p.petaniNama;
    if (!petaniSummary[key]) {
      petaniSummary[key] = {
        nama: p.petaniNama,
        blok: p.blokLahan,
        totalRit: 0,
        totalKebunKg: 0,
        totalPabrikKg: 0,
        totalSelisihKg: 0,
        totalBruto: 0,
        totalPotongan: 0,
        totalNetto: 0,
        statusBayar: p.statusPembayaran,
      };
    }
    const kebunKg = p.timbanganRamKg > 0 ? p.timbanganRamKg : p.timbanganPksKg;
    const pabrikKg = p.timbanganPksKg > 0 ? p.timbanganPksKg : p.timbanganRamKg;

    petaniSummary[key].totalRit += 1;
    petaniSummary[key].totalKebunKg += kebunKg;
    petaniSummary[key].totalPabrikKg += pabrikKg;
    petaniSummary[key].totalSelisihKg += (kebunKg - pabrikKg);
    petaniSummary[key].totalBruto += p.totalBruto;
    petaniSummary[key].totalPotongan += (p.totalPotongan || 0);
    petaniSummary[key].totalNetto += p.totalNetto;
  });

  const petaniSummaryRows = Object.values(petaniSummary).map((s, idx) => ({
    'No': idx + 1,
    'Nama Petani': s.nama,
    'Blok Lahan': s.blok,
    'Total Rit / SPB': s.totalRit,
    'Total Timbangan Kebun (Kg)': s.totalKebunKg,
    'Total Timbangan Pabrik (Kg)': s.totalPabrikKg,
    'Total Susut / Selisih (Kg)': s.totalSelisihKg,
    'Rata-rata Susut (%)': s.totalKebunKg > 0 ? `${((s.totalSelisihKg / s.totalKebunKg) * 100).toFixed(2)}%` : '0%',
    'Total Pendapatan Bruto (Rp)': s.totalBruto,
    'Total Potongan (Rp)': s.totalPotongan,
    'Total Bersih / Netto Petani (Rp)': s.totalNetto,
    'Status': s.statusBayar,
  }));

  const wsPetaniSummary = XLSX.utils.json_to_sheet(petaniSummaryRows);
  wsPetaniSummary['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 20 },
    { wch: 28 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPetaniSummary, 'Rekap Petani');

  // 3. Sheet 3: Ringkasan Pengiriman Armada & PKS
  const armadaSummary: Record<string, {
    platTruk: string;
    namaSopir: string;
    namaPks: string;
    totalRit: number;
    totalKebunKg: number;
    totalPksKg: number;
    medaranKg: number;
  }> = {};

  panenList.forEach(p => {
    const key = `${p.platTruk}_${p.namaPks}`;
    if (!armadaSummary[key]) {
      armadaSummary[key] = {
        platTruk: p.platTruk,
        namaSopir: p.namaSopir,
        namaPks: p.namaPks,
        totalRit: 0,
        totalKebunKg: 0,
        totalPksKg: 0,
        medaranKg: 0,
      };
    }
    const kebunKg = p.timbanganRamKg > 0 ? p.timbanganRamKg : p.timbanganPksKg;
    const pabrikKg = p.timbanganPksKg > 0 ? p.timbanganPksKg : p.timbanganRamKg;

    armadaSummary[key].totalRit += 1;
    armadaSummary[key].totalKebunKg += kebunKg;
    armadaSummary[key].totalPksKg += pabrikKg;
    armadaSummary[key].medaranKg += Math.max(0, kebunKg - pabrikKg);
  });

  const armadaSummaryRows = Object.values(armadaSummary).map((a, idx) => ({
    'No': idx + 1,
    'Plat Nomor Truk': a.platTruk,
    'Nama Sopir': a.namaSopir,
    'PKS Tujuan': a.namaPks,
    'Jumlah SPB / Angkutan': a.totalRit,
    'Total Dimuat Kebun (Kg)': a.totalKebunKg,
    'Total Diterima PKS (Kg)': a.totalPksKg,
    'Medaran / Selisih Tonase (Kg)': a.medaranKg,
    'Persentase Selisih (%)': a.totalKebunKg > 0 ? `${((a.medaranKg / a.totalKebunKg) * 100).toFixed(2)}%` : '0%',
  }));

  const wsArmadaSummary = XLSX.utils.json_to_sheet(armadaSummaryRows);
  wsArmadaSummary['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 20 },
    { wch: 28 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 26 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsArmadaSummary, 'Rekap Armada & PKS');

  // 4. Sheet 4: Ringkasan Informasi Laporan
  const grandTotalKebunKg = panenList.reduce((s, p) => s + (p.timbanganRamKg > 0 ? p.timbanganRamKg : p.timbanganPksKg), 0);
  const grandTotalPksKg = panenList.reduce((s, p) => s + (p.timbanganPksKg > 0 ? p.timbanganPksKg : p.timbanganRamKg), 0);
  const grandTotalNetto = panenList.reduce((s, p) => s + p.totalNetto, 0);
  const grandTotalBruto = panenList.reduce((s, p) => s + p.totalBruto, 0);

  const infoRows = [
    { 'Parameter / Informasi': 'Nama Kelompok Tani', 'Nilai / Keterangan': namaKelompok },
    { 'Parameter / Informasi': 'Periode Laporan Panen', 'Nilai / Keterangan': periodeLabel },
    { 'Parameter / Informasi': 'Waktu Ekspor Berkas', 'Nilai / Keterangan': new Date().toLocaleString('id-ID') },
    { 'Parameter / Informasi': 'Total Transaksi SPB', 'Nilai / Keterangan': `${panenList.length} SPB` },
    { 'Parameter / Informasi': 'Total Tonase Timbangan Kebun', 'Nilai / Keterangan': `${grandTotalKebunKg.toLocaleString('id-ID')} Kg (${(grandTotalKebunKg / 1000).toFixed(2)} Ton)` },
    { 'Parameter / Informasi': 'Total Tonase Timbangan PKS', 'Nilai / Keterangan': `${grandTotalPksKg.toLocaleString('id-ID')} Kg (${(grandTotalPksKg / 1000).toFixed(2)} Ton)` },
    { 'Parameter / Informasi': 'Total Selisih / Susut Kebun-PKS', 'Nilai / Keterangan': `${(grandTotalKebunKg - grandTotalPksKg).toLocaleString('id-ID')} Kg` },
    { 'Parameter / Informasi': 'Total Bruto Penjualan TBS', 'Nilai / Keterangan': `Rp ${grandTotalBruto.toLocaleString('id-ID')}` },
    { 'Parameter / Informasi': 'Total Bersih / Netto Diterima Petani', 'Nilai / Keterangan': `Rp ${grandTotalNetto.toLocaleString('id-ID')}` },
  ];

  const wsInfo = XLSX.utils.json_to_sheet(infoRows);
  wsInfo['!cols'] = [
    { wch: 34 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Informasi Laporan');

  const dateStr = new Date().toISOString().split('T')[0];
  const safeTitle = namaKelompok.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Rekap_Panen_Sawit_${safeTitle}_${dateStr}.xlsx`);
};

/**
 * Generates and downloads a clean, beautifully structured Excel workbook (.xlsx)
 * with sample data, column definitions, guidelines, and reference lookups.
 */
export const downloadPetaniExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Template Data Petani
  const templateData = [
    {
      'No': 1,
      'Nama Lengkap Petani': 'H. Syamsudin Siregar',
      'NIK (KTP)': '1401021508750001',
      'No HP / WhatsApp': '081268492011',
      'Blok Lahan': 'Blok A (Utara)',
      'Luas Lahan (Ha)': 2.5,
      'Jumlah Pokok (Batang)': 340,
      'Bank Penyalur': 'BRI',
      'Nomor Rekening': '1234-01-004589-53-2',
      'Status Anggota': 'Aktif',
      'Tanggal Bergabung': '2024-01-15',
    },
    {
      'No': 2,
      'Nama Lengkap Petani': 'M. Yusuf Hasibuan',
      'NIK (KTP)': '1401021903800002',
      'No HP / WhatsApp': '085271904423',
      'Blok Lahan': 'Blok B (Timur)',
      'Luas Lahan (Ha)': 3.0,
      'Jumlah Pokok (Batang)': 410,
      'Bank Penyalur': 'Bank Mandiri',
      'Nomor Rekening': '108-00-1492048-1',
      'Status Anggota': 'Aktif',
      'Tanggal Bergabung': '2024-01-15',
    },
    {
      'No': 3,
      'Nama Lengkap Petani': 'Siti Rohana Harahap',
      'NIK (KTP)': '1401024511820003',
      'No HP / WhatsApp': '082194002931',
      'Blok Lahan': 'Blok C (Selatan)',
      'Luas Lahan (Ha)': 1.8,
      'Jumlah Pokok (Batang)': 245,
      'Bank Penyalur': 'BSI',
      'Nomor Rekening': '7145892011',
      'Status Anggota': 'Aktif',
      'Tanggal Bergabung': '2024-02-01',
    },
    {
      'No': 4,
      'Nama Lengkap Petani': 'Ahmad Ridwan Dalimunthe',
      'NIK (KTP)': '1401020304780004',
      'No HP / WhatsApp': '081372849102',
      'Blok Lahan': 'Blok D (Barat)',
      'Luas Lahan (Ha)': 4.0,
      'Jumlah Pokok (Batang)': 550,
      'Bank Penyalur': 'BRI',
      'Nomor Rekening': '5421-01-009182-50-3',
      'Status Anggota': 'Aktif',
      'Tanggal Bergabung': '2024-02-10',
    },
    {
      'No': 5,
      'Nama Lengkap Petani': 'H. Buyung Sulaeman',
      'NIK (KTP)': '1401020807720005',
      'No HP / WhatsApp': '081275893012',
      'Blok Lahan': 'Blok A (Utara)',
      'Luas Lahan (Ha)': 2.0,
      'Jumlah Pokok (Batang)': 270,
      'Bank Penyalur': 'BSI',
      'Nomor Rekening': '7129481023',
      'Status Anggota': 'Aktif',
      'Tanggal Bergabung': '2024-03-01',
    },
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(templateData);

  // Set column widths for Sheet 1
  wsTemplate['!cols'] = [
    { wch: 6 },  // No
    { wch: 26 }, // Nama Lengkap Petani
    { wch: 20 }, // NIK
    { wch: 18 }, // No HP / WhatsApp
    { wch: 18 }, // Blok Lahan
    { wch: 16 }, // Luas Lahan (Ha)
    { wch: 22 }, // Jumlah Pokok (Batang)
    { wch: 16 }, // Bank Penyalur
    { wch: 24 }, // Nomor Rekening
    { wch: 16 }, // Status Anggota
    { wch: 18 }, // Tanggal Bergabung
  ];

  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Data Petani');

  // 2. Sheet 2: Petunjuk Pengisian
  const petunjukData = [
    {
      'Nama Kolom': 'Nama Lengkap Petani',
      'Status': 'WAJIB',
      'Format & Contoh': 'Teks (cth: H. Syamsudin Siregar)',
      'Keterangan & Aturan': 'Nama lengkap anggota petani sesuai KTP atau buku kas kelompok.',
    },
    {
      'Nama Kolom': 'NIK (KTP)',
      'Status': 'OPSIONAL',
      'Format & Contoh': '16 Digit Angka (cth: 1401021508750001)',
      'Keterangan & Aturan': 'Nomor Induk Kependudukan untuk administrasi legalitas & sertifikasi ISPO.',
    },
    {
      'Nama Kolom': 'No HP / WhatsApp',
      'Status': 'WAJIB',
      'Format & Contoh': 'Angka (cth: 081268492011)',
      'Keterangan & Aturan': 'Nomor kontak aktif untuk pengiriman slip panen & notifikasi hasil timbangan.',
    },
    {
      'Nama Kolom': 'Blok Lahan',
      'Status': 'WAJIB',
      'Format & Contoh': 'Teks (cth: Blok A (Utara), Blok B)',
      'Keterangan & Aturan': 'Lokasi blok kebun sawit anggota.',
    },
    {
      'Nama Kolom': 'Luas Lahan (Ha)',
      'Status': 'WAJIB',
      'Format & Contoh': 'Desimal angka (cth: 2.5 atau 3)',
      'Keterangan & Aturan': 'Luas hamparan kebun sawit produktif dalam satuan Hektar (Ha). Gunakan titik (.) untuk desimal.',
    },
    {
      'Nama Kolom': 'Jumlah Pokok (Batang)',
      'Status': 'WAJIB',
      'Format & Contoh': 'Angka bulat (cth: 340)',
      'Keterangan & Aturan': 'Total populasi pohon sawit produktif. Standar berkisar antara 130 - 143 pokok per Hektar.',
    },
    {
      'Nama Kolom': 'Bank Penyalur',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks (cth: BRI, Mandiri, BSI, BCA)',
      'Keterangan & Aturan': 'Nama bank rekening penerima pencairan hasil penjualan TBS.',
    },
    {
      'Nama Kolom': 'Nomor Rekening',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'Teks/Angka (cth: 1234-01-004589-53-2)',
      'Keterangan & Aturan': 'Nomor rekening transfer atas nama anggota.',
    },
    {
      'Nama Kolom': 'Status Anggota',
      'Status': 'WAJIB',
      'Format & Contoh': 'Aktif / Nonaktif',
      'Keterangan & Aturan': 'Pilih "Aktif" jika anggota rutin menyetor hasil panen TBS ke kelompok.',
    },
    {
      'Nama Kolom': 'Tanggal Bergabung',
      'Status': 'OPSIONAL',
      'Format & Contoh': 'YYYY-MM-DD (cth: 2024-01-15)',
      'Keterangan & Aturan': 'Tanggal resmi anggota terdaftar di kelompok tani.',
    },
  ];

  const wsPetunjuk = XLSX.utils.json_to_sheet(petunjukData);
  wsPetunjuk['!cols'] = [
    { wch: 24 }, // Nama Kolom
    { wch: 12 }, // Status
    { wch: 35 }, // Format & Contoh
    { wch: 55 }, // Keterangan & Aturan
  ];

  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk Pengisian');

  // 3. Sheet 3: Referensi Blok & Bank
  const referensiData = [
    {
      'Daftar Blok Standar': 'Blok A (Utara)',
      'Daftar Bank Umum': 'BRI (Bank Rakyat Indonesia)',
      'Estimasi Pokok / Ha': '136 Pokok / Ha (Jarak 9m x 9m segitiga)',
    },
    {
      'Daftar Blok Standar': 'Blok B (Timur)',
      'Daftar Bank Umum': 'Bank Mandiri',
      'Estimasi Pokok / Ha': '143 Pokok / Ha (Jarak 9m x 8.7m)',
    },
    {
      'Daftar Blok Standar': 'Blok C (Selatan)',
      'Daftar Bank Umum': 'BSI (Bank Syariah Indonesia)',
      'Estimasi Pokok / Ha': '128 Pokok / Ha (Lahan Gambut)',
    },
    {
      'Daftar Blok Standar': 'Blok D (Barat)',
      'Daftar Bank Umum': 'Bank Riau Kepri Syariah',
      'Estimasi Pokok / Ha': '138 Pokok / Ha',
    },
    {
      'Daftar Blok Standar': 'Blok Plasma Inti',
      'Daftar Bank Umum': 'BCA',
      'Estimasi Pokok / Ha': '140 Pokok / Ha',
    },
    {
      'Daftar Blok Standar': 'Blok Swadaya Baru',
      'Daftar Bank Umum': 'BNI',
      'Estimasi Pokok / Ha': '135 Pokok / Ha',
    },
  ];

  const wsReferensi = XLSX.utils.json_to_sheet(referensiData);
  wsReferensi['!cols'] = [
    { wch: 26 },
    { wch: 32 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, wsReferensi, 'Master Referensi');

  // Write file & trigger download
  XLSX.writeFile(wb, 'Template_Impor_Data_Petani_Kelompok_Tani.xlsx');
};

/**
 * Exports current live Petani list to a clean, professionally formatted Excel workbook (.xlsx).
 */
export const exportPetaniToExcel = (petaniList: Petani[], namaKelompok = 'Kelompok Tani Bunga Sari') => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Anggota
  const dataRows = petaniList.map((p, idx) => ({
    'No': idx + 1,
    'Nama Lengkap Petani': p.nama,
    'NIK': p.nik || '-',
    'No HP / WhatsApp': p.noHp || '-',
    'Blok Lahan': p.blokLahan,
    'Luas Lahan (Ha)': p.luasHa,
    'Jumlah Pokok (Btg)': p.jmlPokok,
    'Bank Penyalur': p.bank,
    'Nomor Rekening': p.noRekening,
    'Status': p.statusAktif ? 'Aktif' : 'Nonaktif',
    'Tanggal Gabung': p.tanggalGabung,
  }));

  const wsData = XLSX.utils.json_to_sheet(dataRows);

  wsData['!cols'] = [
    { wch: 6 },  // No
    { wch: 26 }, // Nama
    { wch: 20 }, // NIK
    { wch: 18 }, // No HP
    { wch: 18 }, // Blok
    { wch: 16 }, // Luas
    { wch: 20 }, // Pokok
    { wch: 16 }, // Bank
    { wch: 24 }, // Rekening
    { wch: 14 }, // Status
    { wch: 16 }, // Tanggal
  ];

  XLSX.utils.book_append_sheet(wb, wsData, 'Data Anggota Petani');

  // Sheet 2: Ringkasan Per Blok
  const blokSummaryMap: Record<string, { jumlahPetani: number; totalLuasHa: number; totalPokok: number; aktif: number }> = {};
  
  petaniList.forEach(p => {
    const blok = p.blokLahan || 'Lainnya';
    if (!blokSummaryMap[blok]) {
      blokSummaryMap[blok] = { jumlahPetani: 0, totalLuasHa: 0, totalPokok: 0, aktif: 0 };
    }
    blokSummaryMap[blok].jumlahPetani += 1;
    blokSummaryMap[blok].totalLuasHa += p.luasHa;
    blokSummaryMap[blok].totalPokok += p.jmlPokok;
    if (p.statusAktif) blokSummaryMap[blok].aktif += 1;
  });

  const blokRows = Object.entries(blokSummaryMap).map(([blok, data], idx) => ({
    'No': idx + 1,
    'Nama Blok Lahan': blok,
    'Jumlah Petani': data.jumlahPetani,
    'Anggota Aktif': data.aktif,
    'Total Luas (Ha)': Number(data.totalLuasHa.toFixed(2)),
    'Total Pokok Sawit (Btg)': data.totalPokok,
    'Rata-rata Luas / Petani (Ha)': Number((data.totalLuasHa / (data.jumlahPetani || 1)).toFixed(2)),
  }));

  const wsBlok = XLSX.utils.json_to_sheet(blokRows);
  wsBlok['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(wb, wsBlok, 'Ringkasan Blok Kebun');

  const dateStr = new Date().toISOString().split('T')[0];
  const safeTitle = namaKelompok.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Data_Petani_${safeTitle}_${dateStr}.xlsx`);
};

/**
 * Parses an uploaded Excel (.xlsx, .xls) or text/csv file into an array of generic records.
 */
export const readUploadedSpreadsheet = async (file: File): Promise<Record<string, unknown>[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Read the first worksheet (or sheet with 'petani', 'panen', or 'template' in name)
    let targetSheetName = wb.SheetNames[0];
    const matchingSheet = wb.SheetNames.find(name => 
      name.toLowerCase().includes('panen') ||
      name.toLowerCase().includes('petani') || 
      name.toLowerCase().includes('template') || 
      name.toLowerCase().includes('data')
    );
    if (matchingSheet) {
      targetSheetName = matchingSheet;
    }

    const worksheet = wb.Sheets[targetSheetName];
    if (!worksheet) return [];

    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    return jsonData;
  }

  // Fallback for CSV / TXT / JSON:
  const textContent = await file.text();
  const trimmed = textContent.trim();

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Continue to CSV parsing
    }
  }

  // Parse CSV / TSV with SheetJS
  const wb = XLSX.read(textContent, { type: 'string' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
};

