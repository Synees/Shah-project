/**
 * Shah Project - Time & Date Utility
 * Mengatur zona waktu Asia/Jakarta (WIB, UTC+7) untuk seluruh operasi tanggal,
 * validasi H+15 (Seserahan) / H+20 (Mahar), dan normalisasi @db.Date Prisma.
 */

export const TIMEZONE_WIB = "Asia/Jakarta";
export const LEAD_DAYS_SESERAHAN = 15;
export const LEAD_DAYS_MAHAR = 20;

/**
 * Mendapatkan representasi waktu sekarang
 */
export function getNowWIB(): Date {
  return new Date();
}

/**
 * Mengambil komponen tanggal (tahun, bulan 1-12, hari, jam, menit) di zona WIB
 */
export function getWIBDateParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      partMap[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: partMap.year,
    month: partMap.month,
    day: partMap.day,
    hour: partMap.hour ?? 0,
    minute: partMap.minute ?? 0,
    second: partMap.second ?? 0,
  };
}

/**
 * Mengonversi string "YYYY-MM-DD" atau Date menjadi tanggal murni (pure Date)
 * dengan waktu 00:00:00.000 UTC untuk kolom PostgreSQL @db.Date di Prisma.
 * Mencegah pergeseran hari akibat perbedaan zona waktu server.
 */
export function parsePureDate(input: string | Date): Date {
  if (typeof input === "string") {
    const trimmed = input.trim();
    // Jika format YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    input = new Date(trimmed);
  }

  // Jika input adalah object Date, ekstrak komponen kalender dalam WIB
  const parts = getWIBDateParts(input);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0));
}

/**
 * Mengambil tanggal murni 'Hari Ini' dalam zona WIB (00:00:00.000 UTC)
 */
export function getTodayPureDate(): Date {
  return parsePureDate(new Date());
}

/**
 * Format tanggal murni menjadi string "YYYY-MM-DD"
 */
export function formatPureDate(date: Date | string): string {
  const d = parsePureDate(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Menambahkan sejumlah hari pada tanggal dasar kalender WIB
 */
export function addDaysWIB(baseDate: Date | string, days: number): Date {
  const pure = parsePureDate(baseDate);
  const result = new Date(pure.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Menghitung tanggal minimum yang diizinkan untuk eventDate
 * Jika pesanan memuat MAHAR: minimal H+20
 * Jika pesanan hanya SESERAHAN: minimal H+15
 */
export function getMinEventDate(hasMahar: boolean, fromDate: Date = new Date()): Date {
  const leadDays = hasMahar ? LEAD_DAYS_MAHAR : LEAD_DAYS_SESERAHAN;
  return addDaysWIB(fromDate, leadDays);
}

/**
 * Validasi apakah eventDate memenuhi aturan minimum hari pemesanan
 */
export function validateEventDate(
  eventDate: Date | string,
  hasMahar: boolean,
  submissionDate: Date = new Date()
): {
  isValid: boolean;
  minEventDate: Date;
  minDays: number;
  message?: string;
} {
  const targetDate = parsePureDate(eventDate);
  const minDate = getMinEventDate(hasMahar, submissionDate);
  const minDays = hasMahar ? LEAD_DAYS_MAHAR : LEAD_DAYS_SESERAHAN;

  if (targetDate.getTime() < minDate.getTime()) {
    const serviceType = hasMahar ? "Mahar" : "Boks Seserahan";
    return {
      isValid: false,
      minEventDate: minDate,
      minDays,
      message: `Pemesanan ${serviceType} memerlukan waktu pengerjaan minimal H+${minDays} (paling cepat ${formatDateDisplay(
        minDate
      )}).`,
    };
  }

  return {
    isValid: true,
    minEventDate: minDate,
    minDays,
  };
}

/**
 * Membuat batas waktu pembayaran (paymentDeadline)
 * Standar: sekarang + 24 jam
 */
export function createPaymentDeadline(from: Date = new Date(), hours = 24): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Format tanggal untuk tampilan UI berbahasa Indonesia
 * Contoh: "Sabtu, 14 Februari 2026"
 */
export function formatDateDisplay(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC", // Digunakan UTC karena tanggal sudah dinormalisasi ke 00:00:00 UTC
  }
): string {
  const d = parsePureDate(date);
  return new Intl.DateTimeFormat("id-ID", options).format(d);
}

/**
 * Format tanggal dan waktu untuk batas pembayaran / log
 * Contoh: "14 Feb 2026, 15:30 WIB"
 */
export function formatDateTimeWIB(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_WIB,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${formatted} WIB`;
}

/**
 * Mengecek apakah penerimaan barang seserahan dari pelanggan terlambat melewati batas H-15.
 * Sesuai PRD Bagian 3.5:
 * Mengembalikan true jika:
 * - (itemsReceivedAt kosong dan hari ini WIB sudah melewati eventDate dikurangi 15 hari) ATAU
 * - (itemsReceivedAt lebih lambat dari akhir hari eventDate dikurangi 15 hari, dalam WIB).
 */
export function isSeserahanLateHMinus15(
  eventDate: Date | string,
  itemsReceivedAt?: Date | null,
  now: Date = new Date()
): boolean {
  const hMinus15Date = addDaysWIB(eventDate, -15);
  const hMinus15Parts = getWIBDateParts(hMinus15Date);

  // Akhir hari H-15 pada pukul 23:59:59.999 WIB (di UTC adalah jam WIB - 7 jam)
  const endOfHMinus15WIB = new Date(
    Date.UTC(
      hMinus15Parts.year,
      hMinus15Parts.month - 1,
      hMinus15Parts.day,
      23 - 7,
      59,
      59,
      999
    )
  );

  if (!itemsReceivedAt) {
    const todayPure = parsePureDate(now);
    return todayPure.getTime() > hMinus15Date.getTime();
  }

  const receivedDate = typeof itemsReceivedAt === "string" ? new Date(itemsReceivedAt) : itemsReceivedAt;
  return receivedDate.getTime() > endOfHMinus15WIB.getTime();
}

