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
