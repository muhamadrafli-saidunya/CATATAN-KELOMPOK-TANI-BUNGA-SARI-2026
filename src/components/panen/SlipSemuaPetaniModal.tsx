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
import { Printer, Copy, CheckCircle2, TreePine, FileSpreadsheet } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SlipSemuaPetaniModalProps {
  isOpen: boolean;
  onClose: () => void;
  petani: Petani | null;
  harvests: PanenRecord[];
  periodeLabel?: string;
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

export const SlipSemuaPetaniModal: React.FC<SlipSemuaPetaniModalProps> = ({
  isOpen,
  onClose,
  petani,
  harvests,
  periodeLabel = 'Agustus 2026',
}) => {
  const { pengaturan } = useApp();
  const [copied, setCopied] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!petani || harvests.length === 0) return null;

  // Akumulasi Total Semua SPB Petani
  const totalRit = harvests.length;
  const totalRamKg = harvests.reduce((sum, p) => sum + (p.timbanganRamKg || p.timbanganPksKg || 0), 0);
  const totalPksKg = harvests.reduce((sum, p) => sum + (p.timbanganPksKg || p.timbanganRamKg || 0), 0);
  const totalSelisihKg = harvests.reduce((sum, p) => sum + p.selisihKg, 0);
  const totalBruto = harvests.reduce((sum, p) => sum + p.totalBruto, 0);
  const totalPedaranRupiah = harvests.reduce((sum, p) => sum + p.potonganPedaranRupiah, 0);
  const totalIuranKasRupiah = harvests.reduce((sum, p) => sum + p.potonganIuranKasRupiah, 0);
  const totalUpahPanenRupiah = harvests.reduce((sum, p) => sum + p.upahPemanenRupiah, 0);
  const totalKasbonPupukRupiah = harvests.reduce((sum, p) => sum + p.kasbonPupukRupiah, 0);
  const totalPotongan = harvests.reduce((sum, p) => sum + p.totalPotongan, 0);
  const totalNetto = harvests.reduce((sum, p) => sum + p.totalNetto, 0);

  const allLunas = harvests.every(p => p.statusPembayaran === 'Lunas');
  const statusBayarLabel = allLunas ? 'Lunas' : 'Siap Bayar';

  const handlePrint = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
    window.print();
  };

  const handleCopyWa = () => {
    let rincianSpb = '';
    harvests.forEach((h, idx) => {
      const kgKebun = h.timbanganRamKg || h.timbanganPksKg;
      rincianSpb += `\n*${idx + 1}. SPB: ${h.noSpb}* (${formatTanggalPendek(h.tanggal)})
   • Muatan: ${formatKg(kgKebun)} @ ${formatRupiah(h.hargaTbsPerKg)}/kg
   • PKS: ${h.namaPks} (${h.platTruk})
   • Potongan: -${formatRupiah(h.totalPotongan)}
   • *Netto: ${formatRupiah(h.totalNetto)}*\n`;
    });

    const text = `*SLIP REKAPITULASI PEMBAYARAN PANEN (SEMUA SPB)*
*${pengaturan.namaKelompok.toUpperCase()}*
---------------------------------------
Nama Petani : *${petani.nama}*
Blok Lahan  : ${petani.blokLahan} (${petani.luasLahanHa} Ha)
Rekening    : ${petani.bank} - ${petani.noRekening}
Periode     : ${periodeLabel}
Total SPB   : ${totalRit} Rit Pengiriman
---------------------------------------
*RINCIAN TRANSAKSI SPB:*${rincianSpb}
---------------------------------------
*RINGKASAN TOTAL AKUMULASI:*
• Total Tonase Kebun : ${formatKg(totalRamKg)}
• Total Tonase Pabrik: ${formatKg(totalPksKg)}

*RINCIAN SELURUH POTONGAN:*
• Pot. Pedaran/Sortasi : -${formatRupiah(totalPedaranRupiah)}
• Iuran Kas Kelompok   : -${formatRupiah(totalIuranKasRupiah)}
• Upah Pemanen & Muat  : -${formatRupiah(totalUpahPanenRupiah)}
• Kasbon / Pupuk       : -${formatRupiah(totalKasbonPupukRupiah)}
• *Total Semua Potongan : -${formatRupiah(totalPotongan)}*
---------------------------------------
*TOTAL BERSIH (NETTO) DITERIMA PETANI:*
👉 *${formatRupiah(totalNetto)}*
_Terbilang: #${angkaTerbilang(totalNetto)} Rupiah#_
---------------------------------------
Status: ${statusBayarLabel.toUpperCase()}
_Bendahara: ${pengaturan.bendahara}_
_Ketua: ${pengaturan.ketua}_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Kwitansi & Slip Rekapitulasi Pembayaran (Semua SPB)</span>
        </div>
      }
      description={`Pratinjau cetak slip lengkap seluruh transaksi pengiriman SPB untuk ${petani.nama} (${totalRit} Rit Pengiriman)`}
    >
      <div className="space-y-6">
        
        {/* Printable Card Area */}
        <div 
          ref={printContentRef}
          id="printable-slip-semua"
          className="bg-white text-gray-900 p-6 sm:p-8 rounded-2xl border-2 border-gray-300 shadow-md font-sans print:shadow-none print:border-none print:p-0 print:m-0"
        >
          {/* Header Kop Surat Kelompok Tani */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 print:bg-black">
                <TreePine className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-black">
                  {pengaturan.namaKelompok}
                </h2>
                <p className="text-xs text-gray-700 font-semibold mt-0.5">
                  {pengaturan.legalitasNo || pengaturan.badanHukum}
                </p>
                <p className="text-xs text-gray-700 font-medium leading-relaxed max-w-xl mt-0.5">
                  {pengaturan.alamatLengkap || pengaturan.alamat || `${pengaturan.desa}, ${pengaturan.kecamatan}, ${pengaturan.kabupaten} - ${pengaturan.provinsi}`}
                </p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Kontak / WhatsApp: {pengaturan.kontakPengurus || pengaturan.noKontak}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-500 text-emerald-950 text-xs font-mono font-bold uppercase rounded">
                SLIP REKAPITULASI PEMBAYARAN TBS
              </span>
              <p className="text-xs font-mono font-bold text-gray-800 mt-2">
                Periode: {periodeLabel}
              </p>
              <p className="text-xs text-gray-600">
                Total: {totalRit} Pengiriman (Rit SPB)
              </p>
            </div>
          </div>

          {/* Info Petani */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-0.5 w-28">Nama Petani</td>
                    <td className="font-bold text-gray-900 py-0.5">: {petani.nama}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Blok / Lahan</td>
                    <td className="font-semibold text-gray-800 py-0.5">: {petani.blokLahan} ({petani.luasLahanHa} Ha)</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Rekening Bank</td>
                    <td className="font-mono text-gray-800 py-0.5">: {petani.bank} ({petani.noRekening})</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-0.5 w-28">Total Transaksi</td>
                    <td className="font-semibold text-gray-800 py-0.5">: {totalRit} Rit SPB Panen</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Periode Laporan</td>
                    <td className="font-semibold text-gray-800 py-0.5">: {periodeLabel}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Status Bayar</td>
                    <td className="py-0.5">
                      : <strong className={`uppercase font-bold px-2 py-0.5 rounded text-[10px] ${
                        allLunas 
                          ? 'text-emerald-800 bg-emerald-100' 
                          : 'text-amber-800 bg-amber-100'
                      }`}>
                        {statusBayarLabel}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Rincian Semua SPB */}
          <div className="py-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center justify-between">
              <span>I. Rincian Semua Pengiriman SPB ({totalRit} Rit)</span>
              <span className="text-[11px] font-normal text-gray-500 lowercase">dasar hitung: timbangan kebun × harga tbs</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-300">
                <thead className="bg-gray-100 text-gray-700 font-bold">
                  <tr>
                    <th className="p-2 text-left border-r border-gray-300 w-8">No</th>
                    <th className="p-2 text-left border-r border-gray-300">No. SPB</th>
                    <th className="p-2 text-left border-r border-gray-300">Tanggal</th>
                    <th className="p-2 text-left border-r border-gray-300">Truk / PKS</th>
                    <th className="p-2 text-right border-r border-gray-300">Berat (Kg)</th>
                    <th className="p-2 text-right border-r border-gray-300">Harga (Rp)</th>
                    <th className="p-2 text-right border-r border-gray-300">Potongan (Rp)</th>
                    <th className="p-2 text-right">Netto (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {harvests.map((h, index) => {
                    const kg = h.timbanganRamKg || h.timbanganPksKg;
                    return (
                      <tr key={h.id} className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}>
                        <td className="p-2 text-center border-r border-gray-300 text-gray-500">{index + 1}</td>
                        <td className="p-2 font-mono font-bold text-gray-900 border-r border-gray-300">{h.noSpb}</td>
                        <td className="p-2 text-gray-600 border-r border-gray-300">{formatTanggalPendek(h.tanggal)}</td>
                        <td className="p-2 text-gray-600 border-r border-gray-300">{h.platTruk} - {h.namaPks}</td>
                        <td className="p-2 text-right font-mono font-bold border-r border-gray-300">{formatNumber(kg)} kg</td>
                        <td className="p-2 text-right font-mono border-r border-gray-300">{formatRupiah(h.hargaTbsPerKg)}</td>
                        <td className="p-2 text-right font-mono text-rose-700 border-r border-gray-300">-{formatRupiah(h.totalPotongan)}</td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">{formatRupiah(h.totalNetto)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="p-2 text-right border-r border-gray-300 uppercase">
                      Subtotal Seluruh SPB
                    </td>
                    <td className="p-2 text-right font-mono border-r border-gray-300 text-gray-950">
                      {formatNumber(totalRamKg)} kg
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center text-gray-400">-</td>
                    <td className="p-2 text-right font-mono border-r border-gray-300 text-rose-700">
                      -{formatRupiah(totalPotongan)}
                    </td>
                    <td className="p-2 text-right font-mono text-emerald-800 text-sm">
                      {formatRupiah(totalNetto)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Rincian Akumulasi Potongan */}
          <div className="py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              II. Rincian Akumulasi Seluruh Potongan
            </h4>
            <table className="w-full text-xs border border-gray-300">
              <thead className="bg-gray-100 text-gray-700 font-bold">
                <tr>
                  <th className="p-2 text-left border-r border-gray-300">Jenis Potongan</th>
                  <th className="p-2 text-left border-r border-gray-300">Keterangan / Rincian</th>
                  <th className="p-2 text-right">Total Potongan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-2 border-r border-gray-300">Potongan Pedaran / Sortasi</td>
                  <td className="p-2 border-r border-gray-300 text-gray-600">Akumulasi pedaran dari {totalRit} rit SPB</td>
                  <td className="p-2 text-right font-mono text-rose-700">-{formatRupiah(totalPedaranRupiah)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-gray-300">Iuran Kas & Operasional Kelompok</td>
                  <td className="p-2 border-r border-gray-300 text-gray-600">Tarif {formatRupiah(pengaturan.tarifIuranKasPerKg)}/kg untuk kas kelompok</td>
                  <td className="p-2 text-right font-mono text-rose-700">-{formatRupiah(totalIuranKasRupiah)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-gray-300">Upah Pemanen & Muat TBS</td>
                  <td className="p-2 border-r border-gray-300 text-gray-600">Tarif {formatRupiah(pengaturan.tarifUpahPanenPerKg)}/kg untuk upah kerja pemanen</td>
                  <td className="p-2 text-right font-mono text-rose-700">-{formatRupiah(totalUpahPanenRupiah)}</td>
                </tr>
                {totalKasbonPupukRupiah > 0 && (
                  <tr>
                    <td className="p-2 border-r border-gray-300 font-semibold">Potongan Kasbon / Pupuk Kelompok</td>
                    <td className="p-2 border-r border-gray-300 text-gray-600">Pelunasan cicilan pupuk / kasbon petani</td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">-{formatRupiah(totalKasbonPupukRupiah)}</td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="p-2 text-right border-r border-gray-300 uppercase">
                    Total Seluruh Potongan ({totalRit} Rit)
                  </td>
                  <td className="p-2 text-right font-mono text-rose-700 font-bold">
                    -{formatRupiah(totalPotongan)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Bersih Box */}
          <div className="my-4 p-4 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-emerald-950 tracking-wider">
                JUMLAH TOTAL BERSIH DITERIMA PETANI (SEMUA SPB):
              </p>
              <p className="text-xs italic text-gray-700 mt-1">
                Terbilang: #{angkaTerbilang(totalNetto)} Rupiah#
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                {formatRupiah(totalNetto)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-3 text-center text-xs">
            <div>
              <p className="text-gray-500">Petani / Anggota,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="font-bold underline uppercase">{petani.nama}</span>
              </div>
            </div>

            <div>
              <p className="text-gray-500">Bendahara Kelompok,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="font-bold underline">{pengaturan.bendahara}</span>
              </div>
            </div>

            <div>
              <p className="text-gray-500">Ketua Kelompok Tani,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="font-bold underline">{pengaturan.ketua}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-400 text-center flex items-center justify-between">
            <span>Dicetak otomatis melalui Aplikasi Kelompok Tani Bunga Sari</span>
            <span>Rekap {totalRit} SPB - {periodeLabel}</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyWa}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin untuk WhatsApp!' : 'Salin Teks WhatsApp (Semua SPB)'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Slip Semua (Print / PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
