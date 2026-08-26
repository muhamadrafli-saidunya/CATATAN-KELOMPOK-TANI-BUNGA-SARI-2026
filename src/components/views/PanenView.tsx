import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PanenRecord } from '../../types';
import { Badge } from '../common/Badge';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Printer, 
  Edit3, 
  Trash2, 
  Download, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Scale,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { 
  formatRupiah, 
  formatKg, 
  formatTanggalPendek, 
  formatNumber 
} from '../../lib/utils';
import { downloadPanenExcelTemplate, exportPanenToExcel } from '../../lib/excelHelper';
import { ImportPanenModal } from '../panen/ImportPanenModal';

interface PanenViewProps {
  onOpenAddPanen: () => void;
  onOpenEditPanen: (record: PanenRecord) => void;
}

export const PanenView: React.FC<PanenViewProps> = ({ onOpenAddPanen, onOpenEditPanen }) => {
  const { 
    panenList, 
    petaniList, 
    armadaList,
    pengaturan,
    deletePanen, 
    batchUpdateStatusPanen, 
    setSelectedPanenForSlip,
    userRole,
    activePetaniId
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetaniFilter, setSelectedPetaniFilter] = useState<string>(
    userRole === 'petani' && activePetaniId ? activePetaniId : 'all'
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [filterSusutTinggiOnly, setFilterSusutTinggiOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'tanggal-desc' | 'tanggal-asc' | 'tonase-desc' | 'netto-desc'>('tanggal-desc');

  // Selected for batch action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered & Sorted Records
  const filteredPanen = useMemo(() => {
    return panenList.filter((item) => {
      // Role lock
      if (userRole === 'petani' && activePetaniId && item.petaniId !== activePetaniId) {
        return false;
      }

      // Search Query
      const matchSearch = 
        item.noSpb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.petaniNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.platTruk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaPks.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaSopir.toLowerCase().includes(searchQuery.toLowerCase());

      // Petani Filter
      const matchPetani = selectedPetaniFilter === 'all' || item.petaniId === selectedPetaniFilter;

      // Status Filter
      const matchStatus = selectedStatusFilter === 'all' || item.statusPembayaran === selectedStatusFilter;

      return matchSearch && matchPetani && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'tanggal-desc') return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (sortBy === 'tanggal-asc') return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      if (sortBy === 'tonase-desc') return (b.timbanganRamKg || b.timbanganPksKg) - (a.timbanganRamKg || a.timbanganPksKg);
      if (sortBy === 'netto-desc') return b.totalNetto - a.totalNetto;
      return 0;
    });
  }, [panenList, searchQuery, selectedPetaniFilter, selectedStatusFilter, sortBy, userRole, activePetaniId]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredPanen.length / itemsPerPage) || 1;
  const paginatedPanen = filteredPanen.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Summary of filtered
  const sumTonaseKebun = filteredPanen.reduce((s, i) => s + (i.timbanganRamKg || i.timbanganPksKg), 0);
  const sumPotongan = filteredPanen.reduce((s, i) => s + i.totalPotongan, 0);
  const sumNetto = filteredPanen.reduce((s, i) => s + i.totalNetto, 0);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedPanen.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPanen.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchMarkPaid = () => {
    if (selectedIds.length === 0) return;
    batchUpdateStatusPanen(selectedIds, 'Lunas');
    setSelectedIds([]);
  };

  // Download Template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    downloadPanenExcelTemplate(petaniList, armadaList, pengaturan);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    exportPanenToExcel(filteredPanen, {
      namaKelompok: pengaturan.namaKelompok || 'Kelompok Tani Bunga Sari',
      periodeLabel: selectedPetaniFilter !== 'all' 
        ? `Petani: ${petaniList.find(p => p.id === selectedPetaniFilter)?.nama || 'Terpilih'}` 
        : 'Semua Rekap Panen',
    });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'No SPB',
      'Tanggal',
      'Nama Petani',
      'Blok Lahan',
      'Timbangan Kebun (kg)',
      'Harga TBS (Rp/kg)',
      'Total Bruto (Rp)',
      'Potongan Pedaran (Rp)',
      'Iuran Kas (Rp)',
      'Upah Panen (Rp)',
      'Kasbon Pupuk (Rp)',
      'Total Potongan (Rp)',
      'Netto Petani (Rp)',
      'Tujuan Pengiriman',
      'Plat Truk',
      'Status Pembayaran'
    ];

    const rows = filteredPanen.map(p => [
      p.noSpb,
      p.tanggal,
      `"${p.petaniNama}"`,
      `"${p.blokLahan}"`,
      p.timbanganRamKg || p.timbanganPksKg,
      p.hargaTbsPerKg,
      p.totalBruto,
      p.potonganPedaranRupiah,
      p.potonganIuranKasRupiah,
      p.upahPemanenRupiah,
      p.kasbonPupukRupiah,
      p.totalPotongan,
      p.totalNetto,
      `"${p.namaPks}"`,
      `"${p.platTruk}"`,
      p.statusPembayaran
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Panen_Sawit_Bunga_Sari_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Catatan Panen & Penimbangan SPB</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data timbangan Surat Pengantar Buah (SPB) kebun, penetapan harga TBS, dan slip hasil panen petani.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userRole === 'admin' && (
            <>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Unduh Template Excel (.xlsx) Standar Panen TBS Siap Pakai"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span>Template Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Impor transaksi panen massal dari file Excel (.xlsx) atau CSV"
              >
                <Upload className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span>Impor Panen</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Ekspor seluruh data panen aktif ke berkas Microsoft Excel (.xlsx) multi-sheet"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Ekspor cepat format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {userRole === 'admin' && (
            <button
              type="button"
              onClick={onOpenAddPanen}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Input Panen Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar Bento Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari No. SPB, Nama Petani, Plat Truk, PKS..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
            />
          </div>

          {/* Petani Filter */}
          <div>
            <select
              value={selectedPetaniFilter}
              onChange={(e) => {
                setSelectedPetaniFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={userRole === 'petani'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">Semua Petani ({petaniList.length})</option>
              {petaniList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="Siap Bayar">Siap Bayar</option>
              <option value="Lunas">Lunas (Selesai)</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="tanggal-desc">Tanggal Terbaru</option>
              <option value="tanggal-asc">Tanggal Terlama</option>
              <option value="tonase-desc">Tonase Timbang Terbesar</option>
              <option value="netto-desc">Hasil Netto Terbesar</option>
            </select>
          </div>
        </div>

        {/* Quick Info & Batch Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Menampilkan <strong>{filteredPanen.length}</strong> dari <strong>{panenList.length}</strong> transaksi panen
            </span>
          </div>

          {/* Batch Action */}
          {userRole === 'admin' && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-lg text-xs">
              <span className="font-bold text-green-600 dark:text-green-400">{selectedIds.length} terpilih</span>
              <button
                type="button"
                onClick={handleBatchMarkPaid}
                className="px-2.5 py-1 rounded-md bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Lunas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Banner Bento Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div>
          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Total SPB Panen</span>
          <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
            {filteredPanen.length} Transaksi
          </strong>
        </div>
        <div>
          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider flex items-center gap-1">
            <span>Timbangan Kebun</span>
            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold px-1 rounded">Acuan Bayar</span>
          </span>
          <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
            {formatKg(sumTonaseKebun)}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Total Potongan</span>
          <strong className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
            -{formatRupiah(sumPotongan)}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Total Netto Petani</span>
          <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
            {formatRupiah(sumNetto)}
          </strong>
        </div>
      </div>

      {/* Main Panen Table Bento Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                {userRole === 'admin' && (
                  <th className="p-3.5 pl-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      {selectedIds.length > 0 && selectedIds.length === paginatedPanen.length ? (
                        <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3.5">No. SPB / Tanggal</th>
                <th className="p-3.5">Petani & Lokasi Kebun</th>
                <th className="p-3.5 text-right">Timbangan Kebun (Acuan Bayar)</th>
                <th className="p-3.5 text-right">Harga TBS</th>
                <th className="p-3.5 text-right">Total Potongan</th>
                <th className="p-3.5 text-right">Netto Petani</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedPanen.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'admin' ? 9 : 8} className="p-8 text-center text-slate-400">
                    Tidak ada catatan panen yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedPanen.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  const beratKebun = record.timbanganRamKg || record.timbanganPksKg;

                  return (
                    <tr 
                      key={record.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-green-500/5 dark:bg-green-500/10' : ''
                      }`}
                    >
                      {userRole === 'admin' && (
                        <td className="p-3.5 pl-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(record.id)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}

                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white font-mono">{record.noSpb}</p>
                        <p className="text-[11px] text-slate-400">{formatTanggalPendek(record.tanggal)}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{record.petaniNama}</p>
                        <p className="text-[11px] text-slate-400">{record.blokLahan}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Truk: {record.platTruk}</p>
                      </td>

                      {/* Timbangan Kebun (Acuan Bayar) */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatKg(beratKebun)}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-tight px-1 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded">
                              Acuan
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">
                            Basis Bayar Petani
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatRupiah(record.hargaTbsPerKg)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                        -{formatRupiah(record.totalPotongan)}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          Pedaran: {record.potonganPedaranKg}kg
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-green-600 dark:text-green-400">
                        {formatRupiah(record.totalNetto)}
                      </td>

                      <td className="p-3.5 text-center">
                        <Badge
                          variant={
                            record.statusPembayaran === 'Lunas' ? 'success' :
                            record.statusPembayaran === 'Siap Bayar' ? 'warning' : 'neutral'
                          }
                          size="sm"
                          dot
                        >
                          {record.statusPembayaran}
                        </Badge>
                      </td>

                      <td className="p-3.5 pr-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPanenForSlip(record)}
                            className="p-1.5 rounded-md text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Cetak Slip Pembayaran"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {userRole === 'admin' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenEditPanen(record)}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Catatan Panen"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(record.id)}
                                className="p-1.5 rounded-md text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Halaman {currentPage} dari {totalPages} ({filteredPanen.length} total data)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white px-2">
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Catatan Panen?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Data SPB ini akan dihapus secara permanen dari sistem rekapitulasi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePanen(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Panen Modal */}
      <ImportPanenModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />

    </div>
  );
};
