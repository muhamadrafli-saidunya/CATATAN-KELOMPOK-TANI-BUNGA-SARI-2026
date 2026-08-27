import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PanenRecord, Petani } from '../../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  formatTanggalPendek,
  formatKg, 
  formatNumber 
} from '../../lib/utils';
import { Printer, Copy, CheckCircle2, TreePine, FileSpreadsheet, Scale, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SlipRekapTanggalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tanggal: string;
  harvests: PanenRecord[];
}

// Terbilang helper sederhana untuk bahasa Indonesia
function angkaTerbilang(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  if (angka < 0) return `Minus ${angkaTerbilang(Math.abs(angka))}`;
  if (angka < 12) return bilangan[angka];
  if (angka < 20) return `${angkaTerbilang(angka - 10)} Belas`;
  if (angka < 100) return `${angkaTerbilang(Math.floor(angka / 10))} Puluh ${angkaTerbilang(angka % 10)}`.trim();
  if (angka < 200) return `Seratus ${angkaTerbilang(angka - 100)}`.trim();
  if (angka < 1000) return `${angkaTerbilang(Math.floor(angka / 100))} Ratus ${angkaTerbilang(angka % 100)}`.trim();
  if (angka < 2000) return `Seribu ${angkaTerbilang(angka - 1000)}`.trim();
  if (angka < 1000000) return `${angkaTerbilang(Math.floor(angka / 1000))} Ribu ${angkaTerbilang(angka % 1000)}`.trim();
  if (angka < 1000000000) return `${angkaTerbilang(Math.floor(angka / 1000000))} Juta ${angkaTerbilang(angka % 1000000)}`.trim();
  return `${formatRupiah(angka)}`;
}

export const SlipRekapTanggalModal: React.FC<SlipRekapTanggalModalProps> = ({
  isOpen,
  onClose,
  tanggal,
  harvests,
}) => {
  const { pengaturan, petaniList } = useApp();
  const [copied, setCopied] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || harvests.length === 0) return null;

  // Akumulasi Total Semua SPB pada tanggal ini
  const totalRit = harvests.length;
  const totalRamKg = harvests.reduce((sum, p) => sum + (p.timbanganRamKg || p.timbanganPksKg || 0), 0);
  const totalPksKg = harvests.reduce((sum, p) => sum + (p.timbanganPksKg || p.timbanganRamKg || 0), 0);
  const totalSelisihKg = harvests.reduce((sum, p) => sum + p.selisihKg, 0);
  const avgSusutPersen = totalRamKg > 0 ? ((totalSelisihKg / totalRamKg) * 100).toFixed(2) : '0';
  const totalBruto = harvests.reduce((sum, p) => sum + p.totalBruto, 0);
  const totalPedaranRupiah = harvests.reduce((sum, p) => sum + p.potonganPedaranRupiah, 0);
  const totalIuranKasRupiah = harvests.reduce((sum, p) => sum + p.potonganIuranKasRupiah, 0);
  const totalUpahPanenRupiah = harvests.reduce((sum, p) => sum + p.upahPemanenRupiah, 0);
  const totalKasbonPupukRupiah = harvests.reduce((sum, p) => sum + p.kasbonPupukRupiah, 0);
  const totalPotongan = harvests.reduce((sum, p) => sum + p.totalPotongan, 0);
  const totalNetto = harvests.reduce((sum, p) => sum + p.totalNetto, 0);

  const avgHarga = totalPksKg > 0 ? Math.round(totalBruto / totalPksKg) : (pengaturan.hargaTbsDefault || 2780);

  const allLunas = harvests.every(p => p.statusPembayaran === 'Lunas');
  const statusBayarLabel = allLunas ? 'Lunas' : 'Siap Bayar';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWa = () => {
    let text = `*REKAPITULASI PANEN HARIAN*\n`;
    text += `*${pengaturan.namaKelompok.toUpperCase()}*\n`;
    text += `Tanggal Panen: ${formatTanggalIndo(tanggal)}\n`;
    text += `Total: ${totalRit} SPB / Petani\n`;
    text += `------------------------------------\n`;
    text += `*RINCIAN HASIL PANEN PETANI:*\n`;

    harvests.forEach((h, idx) => {
      const farmer = petaniList.find(pt => pt.id === h.petaniId);
      const farmerNama = farmer?.nama || h.petaniNama || 'Petani Sawit';
      const farmerBlok = farmer?.blokLahan || h.blokLahan || '-';

      text += `${idx + 1}. *${farmerNama}* (${farmerBlok})\n`;
      text += `   - Tonase PKS: ${formatKg(h.timbanganPksKg)} (Ram: ${formatKg(h.timbanganRamKg)})\n`;
      text += `   - Harga TBS : ${formatRupiah(h.hargaTbsPerKg)}/kg\n`;
      text += `   - Bruto     : ${formatRupiah(h.totalBruto)}\n`;
      text += `   - Potongan  : -${formatRupiah(h.totalPotongan)}\n`;
      text += `   - *NETTO*   : *${formatRupiah(h.totalNetto)}* [${h.statusPembayaran}]\n\n`;
    });

    text += `------------------------------------\n`;
    text += `*TOTAL KESELURUHAN TANGGAL INI:*\n`;
    text += `• Total Tonase Ram : ${formatKg(totalRamKg)}\n`;
    text += `• Total Tonase PKS : ${formatKg(totalPksKg)}\n`;
    text += `• Selisih (Susut)  : -${formatKg(totalSelisihKg)} (${avgSusutPersen}%)\n`;
    text += `• Rata-rata Harga  : ${formatRupiah(avgHarga)}/kg\n`;
    text += `• Total Bruto      : ${formatRupiah(totalBruto)}\n`;
    text += `• Total Potongan   : -${formatRupiah(totalPotongan)}\n`;
    text += `• *TOTAL NETTO DIBAYAR:* *${formatRupiah(totalNetto)}*\n\n`;
    text += `_Dokumen Resmi ${pengaturan.namaKelompok} - Dicetak otomatis melalui Sistem Sawit Mandiri_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="4xl"
    >
      <div className="space-y-4">
        {/* Action Top Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Rekap Panen Tanggal {formatTanggalIndo(tanggal)}
              </h4>
              <p className="text-[11px] text-slate-400">
                {totalRit} Petani / SPB • Total Netto: {formatRupiah(totalNetto)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWa}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap Harian</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL SHEET */}
        <div 
          ref={printContentRef}
          id="rekap-tanggal-printable-sheet"
          className="bg-white text-gray-900 p-6 sm:p-8 rounded-xl border border-gray-300 shadow-sm print:p-0 print:border-none print:shadow-none font-sans text-xs"
        >
          {/* Header Kop Kelompok */}
          <div className="border-b-2 border-gray-900 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center text-white print:border print:border-gray-800">
                <TreePine className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base font-black uppercase tracking-wide text-gray-900 leading-tight">
                  {pengaturan.namaKelompok || 'KELOMPOK TANI BUNGA SARI'}
                </h1>
                <p className="text-[11px] text-gray-600">
                  {pengaturan.alamatKelompok || 'Kec. Tapung Hilir, Kab. Kampar, Riau'}
                </p>
                <p className="text-[10px] text-gray-500">
                  Kontak / Rekening: {pengaturan.kontakHp} | Bank {pengaturan.namaBank} ({pengaturan.nomorRekening})
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-gray-100 text-gray-800 font-mono font-bold text-[11px] uppercase border border-gray-300">
                REKAP TANGGAL PANEN
              </span>
              <p className="text-[11px] font-bold text-gray-800 mt-1 font-mono">
                {formatTanggalIndo(tanggal)}
              </p>
              <p className="text-[10px] text-gray-500 font-mono">
                Total: {totalRit} SPB Petani
              </p>
            </div>
          </div>

          {/* Ringkasan Akumulasi Atas */}
          <div className="grid grid-cols-4 gap-2 mb-4 bg-gray-50 p-2.5 rounded border border-gray-200 font-mono text-[11px]">
            <div>
              <span className="text-gray-500 text-[10px] block">TOTAL RAM KEBUN:</span>
              <span className="font-bold text-gray-900">{formatNumber(totalRamKg)} kg</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">TOTAL PKS NETTO:</span>
              <span className="font-bold text-gray-900">{formatNumber(totalPksKg)} kg</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">SUSUT TIMBANGAN:</span>
              <span className="font-bold text-rose-700">-{formatNumber(totalSelisihKg)} kg ({avgSusutPersen}%)</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">RATA-RATA HARGA:</span>
              <span className="font-bold text-gray-900">{formatRupiah(avgHarga)}/kg</span>
            </div>
          </div>

          {/* Tabel Rincian Rekap Petani */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left border-collapse border border-gray-400 text-[11px]">
              <thead className="bg-gray-100 uppercase text-gray-700 font-bold border-b border-gray-400">
                <tr>
                  <th className="border border-gray-400 p-1.5 text-center w-8">No</th>
                  <th className="border border-gray-400 p-1.5">No. SPB</th>
                  <th className="border border-gray-400 p-1.5">Nama Petani / Blok</th>
                  <th className="border border-gray-400 p-1.5 text-right">Ram (Kg)</th>
                  <th className="border border-gray-400 p-1.5 text-right">PKS (Kg)</th>
                  <th className="border border-gray-400 p-1.5 text-right">Harga TBS</th>
                  <th className="border border-gray-400 p-1.5 text-right">Bruto (Rp)</th>
                  <th className="border border-gray-400 p-1.5 text-right">Potongan (Rp)</th>
                  <th className="border border-gray-400 p-1.5 text-right font-bold">Netto Petani (Rp)</th>
                  <th className="border border-gray-400 p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {harvests.map((h, index) => {
                  const farmer = petaniList.find(pt => pt.id === h.petaniId);
                  const farmerNama = farmer?.nama || h.petaniNama || 'Petani Sawit';
                  const farmerBlok = farmer?.blokLahan || h.blokLahan || '-';
                  const potDetail = h.totalPotongan > 0 
                    ? `Ped: ${formatNumber(h.potonganPedaranRupiah)} | Iuran: ${formatNumber(h.potonganIuranKasRupiah)}` 
                    : '-';
                  return (
                    <tr key={h.id} className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}>
                      <td className="border border-gray-400 p-1.5 text-center font-mono">{index + 1}</td>
                      <td className="border border-gray-400 p-1.5 font-mono font-bold">{h.noSpb}</td>
                      <td className="border border-gray-400 p-1.5 font-semibold">
                        <span className="font-bold text-gray-900 block">{farmerNama}</span>
                        <span className="block text-[10px] text-gray-600 font-normal">{farmerBlok}</span>
                      </td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono">{formatNumber(h.timbanganRamKg)}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono font-bold text-gray-900">{formatNumber(h.timbanganPksKg)}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono">{formatRupiah(h.hargaTbsPerKg)}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono">{formatRupiah(h.totalBruto)}</td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono text-rose-700" title={potDetail}>
                        -{formatRupiah(h.totalPotongan)}
                      </td>
                      <td className="border border-gray-400 p-1.5 text-right font-mono font-bold text-gray-900 text-xs">
                        {formatRupiah(h.totalNetto)}
                      </td>
                      <td className="border border-gray-400 p-1.5 text-center font-mono text-[10px]">
                        <span className={h.statusPembayaran === 'Lunas' ? 'text-green-700 font-bold' : 'text-amber-700 font-bold'}>
                          {h.statusPembayaran}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-200 font-bold border-t-2 border-gray-800 text-[11px]">
                <tr>
                  <td colSpan={3} className="border border-gray-400 p-2 text-center uppercase">
                    TOTAL KESELURUHAN ({totalRit} SPB)
                  </td>
                  <td className="border border-gray-400 p-2 text-right font-mono">{formatNumber(totalRamKg)} kg</td>
                  <td className="border border-gray-400 p-2 text-right font-mono">{formatNumber(totalPksKg)} kg</td>
                  <td className="border border-gray-400 p-2 text-right font-mono text-gray-600">-</td>
                  <td className="border border-gray-400 p-2 text-right font-mono">{formatRupiah(totalBruto)}</td>
                  <td className="border border-gray-400 p-2 text-right font-mono text-rose-700">-{formatRupiah(totalPotongan)}</td>
                  <td className="border border-gray-400 p-2 text-right font-mono text-gray-900 font-black text-sm">
                    {formatRupiah(totalNetto)}
                  </td>
                  <td className="border border-gray-400 p-2 text-center font-mono text-[10px] text-green-800">
                    {statusBayarLabel}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terbilang & Catatan */}
          <div className="bg-gray-50 border border-gray-300 p-2.5 rounded mb-6 font-mono text-[11px]">
            <p className="text-gray-700">
              <span className="font-bold text-gray-900">Terbilang Total Netto Petani: </span>
              <em># {angkaTerbilang(totalNetto)} Rupiah #</em>
            </p>
          </div>

          {/* Kolom 3 Tanda Tangan */}
          <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-2 border-t border-gray-300 text-gray-800 text-[11px]">
            <div>
              <p className="text-gray-500 mb-12">Mengetahui,<br /><span className="font-bold text-gray-800">Ketua Kelompok Tani</span></p>
              <p className="font-bold border-b border-gray-400 inline-block px-6 text-gray-900">
                {pengaturan.namaKetua || 'H. Syamsudin Siregar'}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-12">Disiapkan Oleh,<br /><span className="font-bold text-gray-800">Bendahara Kelompok</span></p>
              <p className="font-bold border-b border-gray-400 inline-block px-6 text-gray-900">
                {pengaturan.namaBendahara || 'Siti Rohana Harahap'}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-12">Pencatat Timbangan,<br /><span className="font-bold text-gray-800">Mandor / Kerani Ram</span></p>
              <p className="font-bold border-b border-gray-400 inline-block px-6 text-gray-900">
                {pengaturan.namaSeketaris || 'Pak Yanto (Mandor)'}
              </p>
            </div>
          </div>

          {/* Footer Timestamp */}
          <div className="mt-8 pt-2 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-400">
            <span>Sistem Informasi Rekapitulasi Sawit Mandiri v2.4</span>
            <span>Dicetak pada: {new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
