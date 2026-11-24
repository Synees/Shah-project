/**
 * Shah Project - Quota & Order Management Engine
 * Menangani lazy expiry 24 jam, perhitungan kuota terpakai & sisa per boks per tanggal,
 * serta transaksi persetujuan pesanan anti-race condition dengan row lock `SELECT ... FOR UPDATE`.
 * 
 * Sesuai PRD Bagian 3.4, 3.5, dan 3.7.
 */

import { prisma } from "@/lib/prisma";
import { parsePureDate, createPaymentDeadline } from "@/lib/time";
import { OrderStatus, DeliveryMethod, Prisma, BoxType } from "@prisma/client";

export interface BoxQuotaSummary {
  boxTypeId: string;
  name: string;
  description: string | null;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  isAvailable: boolean;
}

export interface DayQuotaReport {
  date: string; // YYYY-MM-DD
  boxes: BoxQuotaSummary[];
  pendingConfirmationCount: number;
}

type DatabaseClient = Prisma.TransactionClient | typeof prisma;

/**
 * 3.7 Lazy Expiry (24 Jam)
 * Membersihkan dan memperbarui pesanan MENUNGGU_PEMBAYARAN yang telah melewati batas paymentDeadline
 * menjadi status KEDALUWARSA. Dijalankan setiap kali pengecekan kalender, katalog, atau daftar pesanan.
 */
export async function sweepExpiredOrders(client: DatabaseClient = prisma): Promise<number> {
  const now = new Date();
  const result = await client.order.updateMany({
    where: {
      status: OrderStatus.MENUNGGU_PEMBAYARAN,
      paymentDeadline: {
        lt: now,
      },
    },
    data: {
      status: OrderStatus.KEDALUWARSA,
    },
  });

  return result.count;
}

/**
 * 3.4 Menghitung Kuota Boks Terpakai & Sisa per Tipe Boks per Tanggal Acara
 * Status yang memotong kuota:
 * - MENUNGGU_PEMBAYARAN (hanya jika paymentDeadline > now)
 * - MENUNGGU_VERIFIKASI_PEMBAYARAN
 * - DIPROSES
 * - SELESAI
 * Pesanan MENUNGGU_KONFIRMASI belum memotong kuota resmi.
 */
export async function getBoxQuotaByDate(
  eventDateInput: Date | string,
  client: DatabaseClient = prisma
): Promise<DayQuotaReport> {
  const eventDate = parsePureDate(eventDateInput);

  // 1. Jalankan sweep lazy expiry terlebih dahulu
  await sweepExpiredOrders(client);

  const now = new Date();

  // 2. Ambil semua tipe boks yang terdaftar
  const boxTypes = await client.boxType.findMany({
    orderBy: { name: "asc" },
  });

  // 3. Ambil seluruh item pesanan aktif pada tanggal acara tersebut
  const activeOrderItems = await client.orderItem.findMany({
    where: {
      boxTypeId: { not: null },
      order: {
        eventDate,
        OR: [
          {
            status: {
              in: [
                OrderStatus.MENUNGGU_VERIFIKASI_PEMBAYARAN,
                OrderStatus.DIPROSES,
                OrderStatus.SELESAI,
              ],
            },
          },
          {
            status: OrderStatus.MENUNGGU_PEMBAYARAN,
            paymentDeadline: { gt: now },
          },
        ],
      },
    },
    select: {
      boxTypeId: true,
      quantity: true,
    },
  });

  // Hitung akumulasi kuota terpakai per boxTypeId
  const usedMap = new Map<string, number>();
  for (const item of activeOrderItems) {
    if (item.boxTypeId) {
      usedMap.set(item.boxTypeId, (usedMap.get(item.boxTypeId) || 0) + item.quantity);
    }
  }

  // 4. Hitung jumlah pesanan MENUNGGU_KONFIRMASI pada tanggal tersebut untuk visibilitas admin
  const pendingConfirmationCount = await client.order.count({
    where: {
      eventDate,
      status: OrderStatus.MENUNGGU_KONFIRMASI,
    },
  });

  const boxes: BoxQuotaSummary[] = boxTypes.map((box: BoxType) => {
    const usedQuota = usedMap.get(box.id) || 0;
    const remainingQuota = Math.max(0, box.totalQuota - usedQuota);
    return {
      boxTypeId: box.id,
      name: box.name,
      description: box.description,
      totalQuota: box.totalQuota,
      usedQuota,
      remainingQuota,
      isAvailable: remainingQuota > 0,
    };
  });

  const dateStr = eventDate.toISOString().split("T")[0];

  return {
    date: dateStr,
    boxes,
    pendingConfirmationCount,
  };
}

/**
 * 3.4 & 3.5 Persetujuan Pesanan Anti Race Condition
 * Menyetujui pesanan MENUNGGU_KONFIRMASI di dalam satu prisma.$transaction.
 * Mengunci baris BoxType terkait dengan `SELECT ... FOR UPDATE` (diurutkan berdasarkan id agar tidak deadlock),
 * memvalidasi sisa kuota, menetapkan shippingCost, totalAmount, dan paymentDeadline (sekarang + 24 jam).
 */
export async function approveOrderWithQuotaLock({
  orderId,
  shippingCost = 0,
}: {
  orderId: string;
  shippingCost?: number;
}) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Ambil data pesanan beserta item dan produknya
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            boxType: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Pesanan tidak ditemukan.");
    }

    if (order.status !== OrderStatus.MENUNGGU_KONFIRMASI) {
      throw new Error(`Pesanan tidak dapat disetujui karena statusnya adalah '${order.status}'.`);
    }

    // Validasi ongkos kirim: Wajib 0 jika AMBIL_SENDIRI
    let effectiveShippingCost = shippingCost;
    if (order.deliveryMethod === DeliveryMethod.AMBIL_SENDIRI) {
      effectiveShippingCost = 0;
    } else if (effectiveShippingCost < 0) {
      throw new Error("Ongkos kirim tidak boleh bernilai negatif.");
    }

    // 2. Kumpulkan boxTypeId yang digunakan dalam pesanan ini (abaikan MAHAR yang tidak memakai boks)
    const neededBoxCounts = new Map<string, number>();
    for (const item of order.items) {
      if (item.boxTypeId) {
        neededBoxCounts.set(
          item.boxTypeId,
          (neededBoxCounts.get(item.boxTypeId) || 0) + item.quantity
        );
      }
    }

    const uniqueBoxTypeIds = Array.from(neededBoxCounts.keys()).sort();

    // 3. Jika ada item seserahan yang memakai boks, kunci baris BoxType terkait dengan FOR UPDATE
    if (uniqueBoxTypeIds.length > 0) {
      // Jalankan raw query untuk row-level locking berurutan berdasarkan id untuk mencegah PostgreSQL deadlock
      await tx.$queryRawUnsafe(
        `SELECT id FROM "BoxType" WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE`,
        uniqueBoxTypeIds
      );

      // Jalankan lazy expiry di dalam transaksi
      await sweepExpiredOrders(tx);

      const now = new Date();

      // Periksa kuota untuk setiap boxType yang dibutuhkan
      for (const [boxTypeId, requestedQty] of neededBoxCounts.entries()) {
        const box = await tx.boxType.findUnique({
          where: { id: boxTypeId },
        });

        if (!box) {
          throw new Error(`Tipe boks dengan ID '${boxTypeId}' tidak ditemukan.`);
        }

        // Hitung kuota yang saat ini sudah terkunci
        const activeItems = await tx.orderItem.findMany({
          where: {
            boxTypeId,
            order: {
              eventDate: order.eventDate,
              id: { not: order.id }, // Kecualikan pesanan saat ini
              OR: [
                {
                  status: {
                    in: [
                      OrderStatus.MENUNGGU_VERIFIKASI_PEMBAYARAN,
                      OrderStatus.DIPROSES,
                      OrderStatus.SELESAI,
                    ],
                  },
                },
                {
                  status: OrderStatus.MENUNGGU_PEMBAYARAN,
                  paymentDeadline: { gt: now },
                },
              ],
            },
          },
          select: { quantity: true },
        });

        const currentUsed = activeItems.reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0
        );
        const availableQuota = box.totalQuota - currentUsed;

        if (requestedQty > availableQuota) {
          throw new Error(
            `Gagal menyetujui pesanan: Kuota untuk boks '${box.name}' pada tanggal acara ini tersisa ${availableQuota} unit (dibutuhkan ${requestedQty} unit).`
          );
        }
      }
    }

    // 4. Hitung totalAmount dan set paymentDeadline (24 jam dari sekarang)
    const totalAmount = order.subtotal + effectiveShippingCost;
    const paymentDeadline = createPaymentDeadline(new Date(), 24);

    // 5. Update status pesanan ke MENUNGGU_PEMBAYARAN
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        shippingCost: effectiveShippingCost,
        totalAmount,
        paymentDeadline,
        status: OrderStatus.MENUNGGU_PEMBAYARAN,
        rejectionReason: null, // Bersihkan jika pernah ada alasan penolakan sebelumnya
      },
    });

    return updatedOrder;
  });
}
