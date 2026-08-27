import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Printer, 
  FileText, 
  Download, 
  Share2, 
  Check, 
  Building, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { 
  formatRupiah, 
  formatKg, 
  formatTanggalIndo, 
  formatNumber,
  formatBulanTahunIndo,
  getDaftarPilihanBulan
} from '../../lib/utils';
import { exportPanenToExcel } from '../../lib/excelHelper';

export const CetakLaporanView: React.FC = () => {
  const { panenList, petaniList, kasList, pengaturan } = useApp();

  const [reportType, setReportType] = useState<'rekap-panen' | 'selisih-susut' | 'kas-kelompok'>('rekap-panen');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [copied, setCopied] = useState(false);

  // Daftar 12 Bulan Lengkap dan Riwayat Bulan Panen Aktual
  const periodeBulanList = useMemo(() => {
    return getDaftarPilihanBulan(panenList.map(p => p.tanggal));
  }, [panenList]);

  // Filter records
  const filteredPanen = panenList.filter(p => selectedMonth === 'all' || p.tanggal.startsWith(selectedMonth));

  // Totals
  const totalRam = filteredPanen.reduce((s, p) => s + p.timbanganRamKg, 0);
  const totalPks = filteredPanen.reduce((s, p) => s + p.timbanganPksKg, 0);
  const totalSelisih = filteredPanen.reduce((s, p) => s + p.selisihKg, 0);
  const totalNilaiSelisih = filteredPanen.reduce((s, p) => s + (p.selisihKg * (p.hargaTbsPerKg || pengaturan.hargaTbsDefault || 2780)), 0);
  const totalBruto = filteredPanen.reduce((s, p) => s + p.totalBruto, 0);
  const totalPedaran = filteredPanen.reduce((s, p) => s + p.potonganPedaranRupiah, 0);
  const totalIuran = filteredPanen.reduce((s, p) => s + p.potonganIuranKasRupiah, 0);
  const totalUpah = filteredPanen.reduce((s, p) => s + p.upahPemanenRupiah, 0);
  const totalKasbon = filteredPanen.reduce((s, p) => s + p.kasbonPupukRupiah, 0);
  const totalPotongan = filteredPanen.reduce((s, p) => s + p.totalPotongan, 0);
  const totalNetto = filteredPanen.reduce((s, p) => s + p.totalNetto, 0);

  const periodeLabel = formatBulanTahunIndo(selectedMonth);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportPanenToExcel(filteredPanen, {
      namaKelompok: pengaturan.namaKelompok || 'Kelompok Tani Bunga Sari',
      periodeLabel,
    });
  };

  const handleCopyWaSummary = () => {
    const text = `*LAPORAN REKAPITULASI PANEN SAWIT*\n*${pengaturan.namaKelompok.toUpperCase()}*\nPeriode: ${periodeLabel}\n\n*RINGKASAN TOTAL:*
- Total Tonase Ram Kebun: ${formatKg(totalRam)}
- Total Tonase PKS Netto: ${formatKg(totalPks)}
- Selisih Timbangan (Susut): -${formatKg(totalSelisih)} (${totalRam > 0 ? ((totalSelisih / totalRam) * 100).toFixed(2) : 0}%)
- Total Bruto Panen: ${formatRupiah(totalBruto)}
- Total Potongan (Pedaran/Iuran/Upah): -${formatRupiah(totalPotongan)}
- Total Iuran Kas Terkumpul: +${formatRupiah(totalIuran)}
- *TOTAL NETTO DIBAYARKAN KE PETANI:* *${formatRupiah(totalNetto)}*

_Dicetak resmi melalui Sistem Manajemen Kelompok Tani Bunga Sari._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Control Toolbar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Pusat Cetak Dokumen & Laporan Resmi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Format laporan formal dengan kop surat dan kolom tanda tangan pengurus untuk arsip fisik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="rekap-panen">Rekapitulasi Panen & Netto Petani</option>
            <option value="selisih-susut">Laporan Audit Selisih & Susut Tonase</option>
            <option value="kas-kelompok">Laporan Buku Kas & Keuangan</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="all">Semua Periode (1 Tahun Penuh)</option>
            {periodeBulanList.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Unduh seluruh rekap panen dalam format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWaSummary}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Ringkasan WA'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Document Canvas */}
      <div className="bg-white text-gray-950 p-8 sm:p-12 rounded-2xl border border-gray-300 shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full font-serif">
        
        {/* Formal Letterhead (KOP SURAT) */}
        <div className="border-b-4 border-double border-gray-900 pb-4 mb-6 text-center relative">
          <div className="inline-block mb-1">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-gray-950 font-sans">
              KELOMPOK TANI KELAPA SAWIT &quot;{pengaturan.namaKelompok.toUpperCase()}&quot;
            </h1>
            <p className="text-xs text-gray-700 font-sans tracking-wide">
              {pengaturan.legalitasNo || pengaturan.badanHukum}
            </p>
            <p className="text-xs text-gray-600 font-sans mt-0.5 max-w-2xl mx-auto">
              {pengaturan.alamatLengkap || pengaturan.alamat || `${pengaturan.desa}, ${pengaturan.kecamatan}, ${pengaturan.kabupaten} - ${pengaturan.provinsi}`} • Kontak: {pengaturan.kontakPengurus || pengaturan.noKontak}
            </p>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-bold uppercase underline tracking-wide">
            {reportType === 'rekap-panen' && 'LAPORAN REKAPITULASI HASIL PANEN & PEMBAGIAN PENDAPATAN'}
            {reportType === 'selisih-susut' && 'LAPORAN AUDIT PENYUSUTAN & SELISIH TIMBANGAN TBS'}
            {reportType === 'kas-kelompok' && 'LAPORAN BUKU KAS & PERTANGGUNGJAWABAN KEUANGAN'}
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-sans">
            Periode: <strong>{periodeLabel}</strong> | Dicetak pada: {formatTanggalIndo(new Date().toISOString())}
          </p>
        </div>

        {/* Table Content */}
        {reportType === 'rekap-panen' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 text-left">
                <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-400">
                  <tr>
                    <th className="border border-gray-400 p-2 text-center w-8">No</th>
                    <th className="border border-gray-400 p-2">Nama Petani</th>
                    <th className="border border-gray-400 p-2 text-center">Blok</th>
                    <th className="border border-gray-400 p-2 text-right">PKS Netto (Kg)</th>
                    <th className="border border-gray-400 p-2 text-right">Bruto (Rp)</th>
                    <th className="border border-gray-400 p-2 text-right">Pedaran</th>
                    <th className="border border-gray-400 p-2 text-right">Iuran Kas</th>
                    <th className="border border-gray-400 p-2 text-right">Upah / Kasbon</th>
                    <th className="border border-gray-400 p-2 text-right font-bold">Netto Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {petaniList.map((petani, idx) => {
                    const records = filteredPanen.filter(p => p.petaniId === petani.id);
                    const pksKg = records.reduce((s, p) => s + p.timbanganPksKg, 0);
                    const bruto = records.reduce((s, p) => s + p.totalBruto, 0);
                    const pedaran = records.reduce((s, p) => s + p.potonganPedaranRupiah, 0);
                    const iuran = records.reduce((s, p) => s + p.potonganIuranKasRupiah, 0);
                    const upahKasbon = records.reduce((s, p) => s + p.upahPemanenRupiah + p.kasbonPupukRupiah, 0);
                    const netto = records.reduce((s, p) => s + p.totalNetto, 0);

                    return (
                      <tr key={petani.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-gray-400 p-1.5 font-bold">{petani.nama}</td>
                        <td className="border border-gray-400 p-1.5 text-center">{petani.blokLahan.slice(0, 6)}</td>
                        <td className="border border-gray-400 p-1.5 text-right font-mono">{formatNumber(pksKg)}</td>
                        <td className="border border-gray-400 p-1.5 text-right font-mono">{formatRupiah(bruto)}</td>
                        <td className="border border-gray-400 p-1.5 text-right font-mono">{formatRupiah(pedaran)}</td>
                        <td className="border border-gray-400 p-1.5 text-right font-mono">{formatRupiah(iuran)}</td>
                        <td className="border border-gray-400 p-1.5 text-right font-mono">{formatRupiah(upahKasbon)}</td>
                        <td className="border border-gray-400 p-1.5 text-right font-mono font-bold text-gray-950">
                          {formatRupiah(netto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-200 font-bold border-t-2 border-gray-800">
                  <tr>
                    <td colSpan={3} className="border border-gray-400 p-2 text-center uppercase">TOTAL KESELURUHAN</td>
                    <td className="border border-gray-400 p-2 text-right font-mono">{formatNumber(totalPks)} kg</td>
                    <td className="border border-gray-400 p-2 text-right font-mono">{formatRupiah(totalBruto)}</td>
                    <td className="border border-gray-400 p-2 text-right font-mono">{formatRupiah(totalPedaran)}</td>
                    <td className="border border-gray-400 p-2 text-right font-mono">{formatRupiah(totalIuran)}</td>
                    <td className="border border-gray-400 p-2 text-right font-mono">{formatRupiah(totalUpah + totalKasbon)}</td>
                    <td className="border border-gray-400 p-2 text-right font-mono font-bold">{formatRupiah(totalNetto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {reportType === 'selisih-susut' && (
          <div className="space-y-4 font-sans text-xs">
            <table className="w-full border-collapse border border-gray-400 text-left">
              <thead className="bg-gray-100 font-bold border-b border-gray-400">
                <tr>
                  <th className="border border-gray-400 p-2">No. SPB</th>
                  <th className="border border-gray-400 p-2">Tanggal</th>
                  <th className="border border-gray-400 p-2">Nama Petani</th>
                  <th className="border border-gray-400 p-2">PKS Tujuan</th>
                  <th className="border border-gray-400 p-2 text-right">Ram (Kg)</th>
                  <th className="border border-gray-400 p-2 text-right">PKS (Kg)</th>
                  <th className="border border-gray-400 p-2 text-right">Susut (Kg)</th>
                  <th className="border border-gray-400 p-2 text-right">Susut (%)</th>
                  <th className="border border-gray-400 p-2 text-right font-bold">Nilai Selisih (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPanen.map((p, idx) => {
                  const nilaiSelisih = p.selisihKg * (p.hargaTbsPerKg || pengaturan.hargaTbsDefault || 2780);
                  return (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 p-1.5 font-mono">{p.noSpb}</td>
                      <td className="border border-gray-400 p-1.5">{p.tanggal}</td>
                      <td className="border border-gray-400 p-1.5">{p.petaniNama}</td>
                      <td className="border border-gray-400 p-1.5">{p.namaPks}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono">{formatNumber(p.timbanganRamKg)}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono">{formatNumber(p.timbanganPksKg)}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono text-rose-700">-{p.selisihKg}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono">{p.persentaseSelisih}%</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono font-bold text-slate-900">{formatRupiah(nilaiSelisih)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-200 font-bold border-t-2 border-gray-800">
                <tr>
                  <td colSpan={4} className="border border-gray-400 p-2 text-center uppercase">TOTAL SELISIH SUSUT TIMBANGAN</td>
                  <td className="border border-gray-400 p-2 text-right font-mono">{formatNumber(totalRam)} kg</td>
                  <td className="border border-gray-400 p-2 text-right font-mono">{formatNumber(totalPks)} kg</td>
                  <td className="border border-gray-400 p-2 text-right font-mono text-rose-700">-{formatNumber(totalSelisih)} kg</td>
                  <td className="border border-gray-400 p-2 text-right font-mono">{totalRam > 0 ? ((totalSelisih / totalRam) * 100).toFixed(2) : 0}%</td>
                  <td className="border border-gray-400 p-2 text-right font-mono font-bold text-slate-900">{formatRupiah(totalNilaiSelisih)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {reportType === 'kas-kelompok' && (
          <div className="space-y-4 font-sans text-xs">
            <table className="w-full border-collapse border border-gray-400 text-left">
              <thead className="bg-gray-100 font-bold border-b border-gray-400">
                <tr>
                  <th className="border border-gray-400 p-2">Tanggal</th>
                  <th className="border border-gray-400 p-2">Kategori</th>
                  <th className="border border-gray-400 p-2">Uraian Keterangan</th>
                  <th className="border border-gray-400 p-2 text-right">Masuk (Rp)</th>
                  <th className="border border-gray-400 p-2 text-right">Keluar (Rp)</th>
                  <th className="border border-gray-400 p-2 text-right">Saldo (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {kasList.map((k, idx) => (
                  <tr key={k.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-400 p-1.5">{k.tanggal}</td>
                    <td className="border border-gray-400 p-1.5 font-bold">{k.kategori}</td>
                    <td className="border border-gray-400 p-1.5">{k.keterangan}</td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono">{k.jenis === 'Masuk' ? formatRupiah(k.jumlah) : '-'}</td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono">{k.jenis === 'Keluar' ? formatRupiah(k.jumlah) : '-'}</td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono font-bold">{formatRupiah(k.saldoSetelah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Block (Tanda Tangan Pengurus) */}
        <div className="mt-12 pt-6 border-t border-gray-400 grid grid-cols-3 gap-4 text-center text-xs font-sans">
          <div>
            <p className="text-gray-600">Mengetahui,</p>
            <p className="font-bold uppercase mt-1">Ketua Kelompok Tani</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase">{pengaturan.namaKetua}</p>
          </div>

          <div>
            <p className="text-gray-600">Disusun oleh,</p>
            <p className="font-bold uppercase mt-1">Bendahara Kelompok</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase">{pengaturan.namaBendahara}</p>
          </div>

          <div>
            <p className="text-gray-600">Diverifikasi oleh,</p>
            <p className="font-bold uppercase mt-1">Perwakilan Anggota</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase">H. SYAMSUDIN</p>
          </div>
        </div>

      </div>

    </div>
  );
};
