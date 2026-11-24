Product Requirements Document (PRD) - Shah Project
1. Ringkasan & Tech Stack
Nama Aplikasi: Sistem Informasi Katalog & Pemesanan Shah Project (layanan pembuatan mahar pernikahan dan sewa/hias boks seserahan).
Target Hosting: Vercel (shahproject.vercel.app), mode pengembangan dan demonstrasi akademik MPPL. Jika kelak menerima transaksi komersial nyata, upgrade ke Vercel Pro atau pindah hosting (Hobby plan untuk penggunaan non-komersial).
Tech Stack: Next.js (App Router, TypeScript, src/), Tailwind CSS, shadcn/ui (Base UI, base color Stone), React Bits (khusus halaman publik, Fase 2), Prisma ORM, Neon Serverless PostgreSQL (DATABASE_URL pooled + DIRECT_URL untuk migrasi), Auth.js (next-auth@beta), Vercel Blob (@vercel/blob), browser-image-compression, Recharts.
Skema database: sumber kebenaran adalah prisma/schema.prisma. Jangan dibuat ulang atau ditimpa.
2. Design System (selaras dengan public/images/logo-shah.png)
Nuansa: Warm Editorial Luxury / Modern Botanical Wedding.
Palet warna:
--bg-primary: #FAF7F2 (Warm Ivory)
--bg-secondary: #F2EBE1 (Soft Champagne)
--brand-primary: #7B5841 (Earthy Bronze / Mocha)
--brand-dark: #4E3626 (Deep Espresso)
--brand-accent: #B8926A (Muted Gold)
--text-primary: #2B211A (Charcoal Espresso)
Tipografi (Google Fonts): Cormorant Garamond (heading), Pinyon Script (aksen subjudul), Plus Jakarta Sans (body & UI transaksi).
3. Aturan Bisnis & Validasi Server Wajib
3.1 Otorisasi
Registrasi 4 kolom: fullName, whatsapp, email, password. Role: CUSTOMER dan ADMIN.
Helper requireAuth() dan requireAdmin() wajib dipanggil di setiap Server Action dan Route Handler, tidak cukup hanya middleware.ts.
Akun admin dibuat lewat prisma/seed.ts; email dan password diambil dari environment variable (ADMIN_EMAIL, ADMIN_PASSWORD), tidak ditulis di repo.
3.2 Zona waktu
Semua perhitungan "hari ini", H+15, H+20, dan paymentDeadline memakai zona Asia/Jakarta (WIB), bukan UTC server Vercel.
eventDate diperlakukan sebagai tanggal murni (kolom @db.Date), diparse sebagai tanggal WIB tanpa komponen jam. Sediakan utilitas src/lib/time.ts dan pakai di semua tempat.
3.3 Validasi waktu layanan (server-side dan UI)
Jika pesanan memuat item MAHAR: eventDate minimal H+20 dari tanggal pengajuan.
Jika pesanan hanya memuat item SESERAHAN: eventDate minimal H+15 (barang seserahan wajib di-drop minimal H-15).
Validasi ini wajib di server; UI hanya membantu (kalender menonaktifkan tanggal tidak valid).
3.4 Kuota boks
3 tipe boks seserahan, masing-masing 10 unit per tanggal acara (total 30 unit per tanggal). Item MAHAR tidak memakai kuota (boxTypeId = null).
OrderItem.boxTypeId diturunkan dari Product di server, bukan dari input klien.
Jangan simpan kolom sisa kuota. Kuota terpakai dihitung agregat dari OrderItem.quantity per tipe boks dan eventDate untuk pesanan berstatus: MENUNGGU_PEMBAYARAN (dengan paymentDeadline > now), MENUNGGU_VERIFIKASI_PEMBAYARAN, DIPROSES, SELESAI.
Pesanan MENUNGGU_KONFIRMASI belum memotong kuota.
Anti race condition: proses "Setujui Pesanan" berjalan di dalam satu prisma.$transaction. Di awal transaksi, kunci baris BoxType terkait dengan SELECT ... FOR UPDATE (via $queryRaw, diurutkan berdasarkan id agar tidak deadlock), lalu hitung kuota dan setujui. Cara ini dipilih (bukan isolasi Serializable) agar perilakunya mudah diprediksi dan tidak memerlukan retry.
UI pelanggan menampilkan catatan bahwa kuota baru terkunci resmi setelah pesanan disetujui owner. UI admin menampilkan jumlah pesanan MENUNGGU_KONFIRMASI pada tanggal yang sama.
3.5 Alur pesanan
Pelanggan mengajukan pesanan -> MENUNGGU_KONFIRMASI.
Admin menolak: wajib mengisi rejectionReason -> DITOLAK.
Admin menyetujui: input shippingCost (wajib 0 jika AMBIL_SENDIRI); server menghitung totalAmount = subtotal + shippingCost, mengisi paymentDeadline = sekarang + 24 jam, status -> MENUNGGU_PEMBAYARAN.
Pelanggan membayar 100% dan mengunggah bukti -> baris Payment baru (MENUNGGU_VERIFIKASI), order -> MENUNGGU_VERIFIKASI_PEMBAYARAN.
Admin memverifikasi mutasi rekening:
Valid: Payment.status = TERVERIFIKASI, verifiedAt diisi, order -> DIPROSES.
Tidak valid: Payment.status = DITOLAK beserta rejectionNote; order kembali ke MENUNGGU_PEMBAYARAN dan paymentDeadline diperpanjang +24 jam dari saat penolakan, agar pelanggan sempat mengunggah ulang.
Selama status DIPROSES (tanpa status baru), admin mencatat dua tonggak lewat tombol di halaman detail pesanan:
"Tandai Barang Diterima" mengisi itemsReceivedAt (hanya untuk pesanan yang memuat item SESERAHAN; barang dari pelanggan).
"Tandai Sudah Diserahkan" mengisi handedOverAt (pesanan diambil atau diantar ke pelanggan).
Keduanya opsional dan tidak menjadi syarat SELESAI. Waktu dicatat dalam WIB. Admin hanya bisa mengisinya saat order DIPROSES, dan hanya bisa diisi sekali (kecuali dikoreksi admin).
Penanda "terlambat" di dashboard admin: pesanan seserahan yang itemsReceivedAt-nya kosong padahal sudah lewat H-15 dari eventDate, atau diterima setelah H-15.
Saat mengubah ke SELESAI, admin wajib mengunggah finalReportImageUrl; foto tampil di halaman Order Tracking pelanggan.
Order Tracking pelanggan menampilkan garis waktu: diajukan, disetujui, dibayar, diproses, barang diterima (jika ada seserahan), diserahkan, selesai. Tahap yang belum tercatat ditampilkan sebagai belum terjadi.
3.6 Validasi pembayaran
Payment.amount wajib sama persis dengan Order.totalAmount; dihitung dan divalidasi di server, tidak percaya angka dari form.
3.7 Lazy expiry (24 jam)
Setiap pengecekan kalender, katalog, atau daftar pesanan menjalankan satu updateMany: pesanan MENUNGGU_PEMBAYARAN dengan paymentDeadline < now -> KEDALUWARSA.
Halaman kalender dan katalog bersifat dinamis (tidak di-cache statis). Perhitungan kuota sudah memfilter paymentDeadline > now, sehingga sweep hanya merapikan data.
3.8 Pembatalan

Pelanggan hanya bisa membatalkan pesanan. Tidak ada fitur edit apa pun oleh pelanggan (isi pesanan, tanggal, alamat, maupun catatan); jika ingin berubah, pelanggan membatalkan lalu membuat pesanan baru.

Status pesanan	Pembatalan oleh pelanggan
MENUNGGU_KONFIRMASI	Langsung -> DIBATALKAN
MENUNGGU_PEMBAYARAN	Langsung -> DIBATALKAN (kuota bebas)
MENUNGGU_VERIFIKASI_PEMBAYARAN	Langsung -> DIBATALKAN; jika ada pembayaran, refund manual oleh admin
DIPROSES	Hanya lewat permintaan (cancelRequestedAt, cancelRequestReason); status tetap DIPROSES sampai admin memutuskan
SELESAI, DITOLAK, KEDALUWARSA, DIBATALKAN	Tidak bisa
Admin dapat menyetujui permintaan (-> DIBATALKAN, cancelledBy = ADMIN) atau menolak (cancelRequestedAt dikosongkan, cancelRequestRejectionNote diisi). Admin juga dapat membatalkan langsung kapan pun.
Refund penuh 100%. Refund manual: admin transfer lewat m-banking, lalu menekan "Tandai Sudah Dikembalikan" (refundedAt, refundNote opsional untuk nomor referensi).
Pesanan DIBATALKAN yang punya pembayaran terverifikasi atau menunggu verifikasi dan refundedAt masih kosong ditampilkan sebagai penanda "refund belum dilakukan" di dashboard admin.
3.9 Penyimpanan & keamanan media
Kompresi di sisi client: maxSizeMB: 0.25, maxWidthOrHeight: 1280, image/webp, sebelum diunggah ke Vercel Blob. Dilarang menyimpan upload ke public/ (filesystem Vercel read-only).
Unggah lewat client upload dengan token dari server. Token hanya dibuat untuk pengguna yang login, dengan allowedContentTypes gambar dan maximumSizeInBytes terbatas.
Bukti pembayaran hanya boleh dilihat pemilik pesanan dan admin. Jika versi @vercel/blob mendukung akses privat, layani lewat route handler yang memeriksa sesi. Jika tidak, gunakan nama file acak dan jangan tampilkan proofUrl di halaman atau API publik.
3.10 Notifikasi
Tanpa gateway berbayar. Di halaman detail pesanan admin tersedia tombol "Kirim Update via WhatsApp" yang membuka https://wa.me/62... dengan template pesan sesuai status (disetujui + nominal total, bukti bayar ditolak, pesanan selesai, pembatalan disetujui/refund).
3.11 Konsistensi status
Perubahan status order dan payment hanya lewat fungsi service terpusat (mis. approveOrder(), verifyPayment(), cancelOrder()), bukan di banyak tempat.
4. Roadmap Pengerjaan Bertahap
Fase 1 - MVP Inti (prioritas utama)
Design system, autentikasi multi-role, manajemen katalog dan 3 tipe boks.
Keranjang multi-item (OrderItem), kalender ketersediaan boks, validasi server H+20/H+15, pengajuan pesanan.
Dashboard pesanan admin: persetujuan + input ongkir (transaksi kuota), verifikasi bukti bayar, pembatalan dan refund, tombol WhatsApp, Order Tracking pelanggan.
Fase 2 - Enhancement & Visual
Upload foto laporan akhir saat SELESAI (jika belum masuk Fase 1).
Grafik pendapatan dan tren pesanan di dashboard admin (Recharts).
Komponen React Bits di halaman publik: Silk hanya di Hero desktop (dimuat via next/dynamic dengan ssr: false dan kondisi viewport, fallback gradien CSS di layar < 768px dan saat prefers-reduced-motion), TiltedCard di katalog, SpotlightCard dan ScrollReveal di alur pemesanan, Magnet/StarBorder di navbar dan CTA, CountUp di Why Choose Us. Semua diawali 'use client' dan hanya di halaman publik.