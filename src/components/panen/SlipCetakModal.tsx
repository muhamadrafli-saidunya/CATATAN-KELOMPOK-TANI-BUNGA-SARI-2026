import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PanenRecord, Petani } from '../../types';
import { 
  formatRupiah, 
  formatTanggalIndo, 
  formatKg, 
  formatNumber 
} from '../../lib/utils';
import { Printer, Share2, Check, TreePine, Download, Copy, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SlipCetakModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PanenRecord | null;
}

// Terbilang helper sederhana untuk bahasa Indonesia
function angkaTerbilang(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

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

export const SlipCetakModal: React.FC<SlipCetakModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { pengaturan, petaniList } = useApp();
  const [copied, setCopied] = React.useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  const petani = petaniList.find(p => p.id === record.petaniId);

  const handlePrint = () => {
    // Fire confetti for celebration of harvest payout
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
    const beratKebun = record.timbanganRamKg || record.timbanganPksKg;
    const text = `*SLIP PEMBAYARAN PANEN SAWIT*
*${pengaturan.namaKelompok}*
---------------------------------------
No. SPB: ${record.noSpb}
Tanggal: ${formatTanggalIndo(record.tanggal)}
Nama Petani: *${record.petaniNama}*
Lahan: ${record.blokLahan}
Bank/Rek: ${petani?.bank || 'Mandiri'} - ${petani?.noRekening || '-'}

*RINCIAN TIMBANGAN & NETTO:*
• Berat Timbangan Kebun: ${formatKg(beratKebun)}
• Harga TBS: ${formatRupiah(record.hargaTbsPerKg)}/kg
• *Netto Petani (Timbangan Kebun × Harga TBS): ${formatRupiah(record.totalNetto)}*

*RINCIAN POTONGAN:*
• Pedaran/Sortasi: -${formatRupiah(record.potonganPedaranRupiah)}
• Iuran Kas Kelompok: -${formatRupiah(record.potonganIuranKasRupiah)}
• Upah Pemanen: -${formatRupiah(record.upahPemanenRupiah)}
• Kasbon/Pupuk: -${formatRupiah(record.kasbonPupukRupiah)}
• *Total Potongan: -${formatRupiah(record.totalPotongan)}*
---------------------------------------
*TOTAL NETTO PETANI:*
👉 *${formatRupiah(record.totalNetto)}*
---------------------------------------
Status: ${record.statusPembayaran.toUpperCase()}
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
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-[#00AA13]" />
          <span>Kwitansi & Slip Pembayaran Panen</span>
        </div>
      }
      description={`Pratinjau cetak slip resmi untuk ${record.petaniNama} (${record.noSpb})`}
    >
      <div className="space-y-6">
        
        {/* Printable Paper Card Layout */}
        <div 
          ref={printContentRef}
          id="printable-slip"
          className="bg-white text-gray-900 p-6 sm:p-8 rounded-2xl border-2 border-gray-300 shadow-md font-sans print:shadow-none print:border-none print:p-0 print:m-0"
        >
          {/* Header Kop Kelompok Tani */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#00AA13] flex items-center justify-center text-white shrink-0 print:bg-black">
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
              <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-400 text-xs font-mono font-bold uppercase rounded">
                SLIP PEMBAYARAN TBS
              </span>
              <p className="text-xs font-mono font-bold text-gray-800 mt-2">
                No: {record.noSpb}
              </p>
              <p className="text-xs text-gray-600">
                Tanggal: {formatTanggalIndo(record.tanggal)}
              </p>
            </div>
          </div>

          {/* Info Petani & Pengiriman */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-0.5 w-28">Nama Petani</td>
                    <td className="font-bold text-gray-900 py-0.5">: {record.petaniNama}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Blok / Lahan</td>
                    <td className="font-semibold text-gray-800 py-0.5">: {record.blokLahan}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Rekening Bank</td>
                    <td className="font-mono text-gray-800 py-0.5">: {petani?.bank || 'Bank'} ({petani?.noRekening || '-'})</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-0.5 w-28">PKS Tujuan</td>
                    <td className="font-semibold text-gray-800 py-0.5">: {record.namaPks}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Truk / Sopir</td>
                    <td className="font-semibold text-gray-800 py-0.5">: {record.platTruk} ({record.namaSopir})</td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-0.5">Status Bayar</td>
                    <td className="py-0.5">
                      : <strong className="uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                        {record.statusPembayaran}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rincian Tonase & Hasil Netto Petani */}
          <div className="py-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              I. Rekapitulasi Timbangan & Netto Petani
            </h4>
            <table className="w-full text-xs border border-gray-300">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left border-r border-gray-300">Uraian Penimbangan</th>
                  <th className="p-2 text-right border-r border-gray-300">Berat (Kg)</th>
                  <th className="p-2 text-right border-r border-gray-300">Harga Satuan (Rp)</th>
                  <th className="p-2 text-right">Jumlah Netto (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-emerald-50/40">
                  <td className="p-2.5 border-r border-gray-300">
                    <span className="font-bold text-gray-900">Berat Timbangan Kebun / Ram</span>
                    <span className="block text-[10px] text-gray-500">Dasar perhitungan netto petani (Timbangan Kebun × Harga TBS)</span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-extrabold border-r border-gray-300 text-gray-950 text-sm">
                    {formatNumber(record.timbanganRamKg || record.timbanganPksKg)} kg
                  </td>
                  <td className="p-2.5 text-right font-mono font-semibold border-r border-gray-300 text-gray-800">
                    {formatRupiah(record.hargaTbsPerKg)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-extrabold text-sm text-[#00AA13]">
                    {formatRupiah(record.totalNetto)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rincian Potongan & Pedaran */}
          <div className="py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              II. Rincian Potongan & Pedaran
            </h4>
            <table className="w-full text-xs border border-gray-300">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left border-r border-gray-300">Jenis Potongan</th>
                  <th className="p-2 text-left border-r border-gray-300">Keterangan / Tarif</th>
                  <th className="p-2 text-right">Potongan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-2 border-r border-gray-300">Potongan Pedaran / Sortasi</td>
                  <td className="p-2 border-r border-gray-300 text-gray-600">{record.potonganPedaranKg} kg x {formatRupiah(record.hargaTbsPerKg)}</td>
                  <td className="p-2 text-right font-mono text-rose-700">-{formatRupiah(record.potonganPedaranRupiah)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-gray-300">Iuran Kas & Operasional Kelompok</td>
                  <td className="p-2 border-r border-gray-300 text-gray-600">{formatNumber(record.timbanganPksKg || record.timbanganRamKg)} kg x {formatRupiah(pengaturan.tarifIuranKasPerKg)}/kg</td>
                  <td className="p-2 text-right font-mono text-rose-700">-{formatRupiah(record.potonganIuranKasRupiah)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-gray-300">Upah Pemanen & Muat Buah</td>
                  <td className="p-2 border-r border-gray-300 text-gray-600">{formatNumber(record.timbanganPksKg || record.timbanganRamKg)} kg x {formatRupiah(pengaturan.tarifUpahPanenPerKg)}/kg</td>
                  <td className="p-2 text-right font-mono text-rose-700">-{formatRupiah(record.upahPemanenRupiah)}</td>
                </tr>
                {record.kasbonPupukRupiah > 0 && (
                  <tr>
                    <td className="p-2 border-r border-gray-300 font-semibold">Angsuran Kasbon / Pupuk Kelompok</td>
                    <td className="p-2 border-r border-gray-300 text-gray-600">Potongan cicilan pinjaman pupuk</td>
                    <td className="p-2 text-right font-mono text-rose-700 font-bold">-{formatRupiah(record.kasbonPupukRupiah)}</td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="p-2 text-right border-r border-gray-300 uppercase">
                    Total Seluruh Potongan
                  </td>
                  <td className="p-2 text-right font-mono text-rose-700 font-bold">
                    -{formatRupiah(record.totalPotongan)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Bersih Box */}
          <div className="my-4 p-4 bg-emerald-50 border-2 border-[#00AA13] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-emerald-900 tracking-wider">
                JUMLAH BERSIH DITERIMA PETANI (NETTO):
              </p>
              <p className="text-xs italic text-gray-700 mt-1">
                Terbilang: #{angkaTerbilang(record.totalNetto)} Rupiah#
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-black font-mono">
                {formatRupiah(record.totalNetto)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-3 text-center text-xs">
            <div>
              <p className="text-gray-500">Petani / Anggota,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="font-bold underline uppercase">{record.petaniNama}</span>
              </div>
            </div>

            <div>
              <p className="text-gray-500">Bendahara Kelompok,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="font-bold underline">{pengaturan.namaBendahara || pengaturan.bendahara}</span>
              </div>
            </div>

            <div>
              <p className="text-gray-500">Ketua Kelompok Tani,</p>
              <div className="h-16 flex items-end justify-center">
                <span className="font-bold underline">{pengaturan.namaKetua || pengaturan.ketua}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-400 text-center flex items-center justify-between">
            <span>Dicetak otomatis melalui Aplikasi Laporan Kelompok Tani Bunga Sari</span>
            <span>Ref: {record.id}</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyWa}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-2"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin untuk WhatsApp!' : 'Salin Teks WhatsApp'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#00AA13] hover:bg-[#00880D] active:scale-95 transition-all shadow-md shadow-[#00AA13]/30 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
