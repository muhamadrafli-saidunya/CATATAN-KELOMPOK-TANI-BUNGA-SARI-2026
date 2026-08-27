import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Rupiah Indonesia (contoh: Rp 14.500.000)
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format Angka Ribuan (contoh: 14.250)
export function formatNumber(num: number | null | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
}

// Format Berat Tonase (contoh: 5.420 kg / 5,42 Ton)
export function formatKg(kg: number | null | undefined): string {
  if (kg === undefined || kg === null || isNaN(kg)) return '0 kg';
  return `${formatNumber(kg)} kg`;
}

export function formatTon(kg: number | null | undefined): string {
  if (kg === undefined || kg === null || isNaN(kg)) return '0 Ton';
  const ton = kg / 1000;
  return `${ton.toFixed(2).replace('.', ',')} Ton`;
}

// Format Tanggal Indonesia (contoh: 25 Agustus 2026 atau 25/08/2026)
export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatTanggalPendek(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Nama-nama bulan dalam bahasa Indonesia
export const NAMA_BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Format Periode Bulan Tahun (contoh: 2026-08 -> Agustus 2026, all -> Semua Periode)
export function formatBulanTahunIndo(periodStr: string): string {
  if (!periodStr || periodStr === 'all') return 'Semua Periode';
  const parts = periodStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${NAMA_BULAN_INDO[monthIdx]} ${year}`;
    }
  }
  return periodStr;
}

export interface PeriodeBulanOption {
  value: string;
  label: string;
  count: number;
  isCurrent?: boolean;
}

// Menghasilkan daftar 12 bulan lengkap (Januari - Desember) digabung dengan bulan panen aktual
export function getDaftarPilihanBulan(panenDates: string[], referenceYear = 2026, currentMonthCode = '2026-08'): PeriodeBulanOption[] {
  // Hitung jumlah transaksi panen per bulan
  const countMap: Record<string, number> = {};
  panenDates.forEach(dateStr => {
    if (dateStr && dateStr.length >= 7) {
      const ym = dateStr.slice(0, 7);
      countMap[ym] = (countMap[ym] || 0) + 1;
    }
  });

  // Kumpulkan semua tahun yang ada dari data dan referenceYear
  const years = new Set<number>([referenceYear]);
  Object.keys(countMap).forEach(ym => {
    const y = parseInt(ym.slice(0, 4), 10);
    if (!isNaN(y)) years.add(y);
  });

  const sortedYears = Array.from(years).sort((a, b) => b - a);
  const options: PeriodeBulanOption[] = [];

  sortedYears.forEach(year => {
    // 12 bulan dalam setahun (dimulai dari Desember ke Januari atau Januari ke Desember)
    // Standar akuntansi: urutkan dari bulan terbaru (Desember -> Januari)
    for (let m = 12; m >= 1; m--) {
      const monthPad = m.toString().padStart(2, '0');
      const val = `${year}-${monthPad}`;
      const monthName = NAMA_BULAN_INDO[m - 1];
      const count = countMap[val] || 0;
      const isCurrent = val === currentMonthCode;

      let label = `${monthName} ${year}`;
      if (isCurrent) {
        label += ' (Bulan Berjalan)';
      }
      if (count > 0) {
        label += ` • ${count} Panen`;
      }

      options.push({
        value: val,
        label,
        count,
        isCurrent,
      });
    }
  });

  return options;
}

// Helper untuk status badge susut tonase
export function getSusutBadgeClass(persen: number, toleransi: number = 2.0): {
  color: string;
  bg: string;
  border: string;
  label: string;
  icon: string;
} {
  const absPersen = Math.abs(persen);
  if (absPersen <= 1.0) {
    return {
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      label: 'Sangat Baik (Aman)',
      icon: 'check-circle',
    };
  } else if (absPersen <= toleransi) {
    return {
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      label: 'Wajar / Toleransi',
      icon: 'alert-triangle',
    };
  } else {
    return {
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      label: 'Susut Tinggi (Perlu Cek)',
      icon: 'alert-octagon',
    };
  }
}
