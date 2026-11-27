"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { ProductCategory } from "@prisma/client";
import { upload } from "@vercel/blob/client";
import { compressImage } from "@/lib/compress-image";
import {
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
  type ProductInputData,
} from "@/lib/actions/product";

export interface BoxTypeOption {
  id: string;
  name: string;
  totalQuota: number;
}

export interface ProductItem {
  id: string;
  name: string;
  category: ProductCategory;
  boxTypeId: string | null;
  boxType: {
    id: string;
    name: string;
  } | null;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

interface ProductClientProps {
  initialProducts: ProductItem[];
  boxTypes: BoxTypeOption[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductClient({
  initialProducts,
  boxTypes,
}: ProductClientProps) {
  const [products] = useState<ProductItem[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<"SEMUA" | ProductCategory>("SEMUA");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState<ProductCategory>(ProductCategory.MAHAR);
  const [formBoxTypeId, setFormBoxTypeId] = useState<string>("");
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Upload & action feedback
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "SEMUA") return true;
    return p.category === selectedCategory;
  });

  function openCreateForm() {
    setEditingProduct(null);
    setFormCategory(ProductCategory.MAHAR);
    setFormBoxTypeId("");
    setFormImageUrl("");
    setFormPrice(0);
    setFormIsActive(true);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(prod: ProductItem) {
    setEditingProduct(prod);
    setFormCategory(prod.category);
    setFormBoxTypeId(prod.boxTypeId ?? "");
    setFormImageUrl(prod.imageUrl);
    setFormPrice(prod.price);
    setFormIsActive(prod.isActive);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
    setError(null);
    setUploadStatus("");
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // 1. Kompresi gambar sesuai standar PRD (0.25 MB, 1280px, image/webp)
      setUploadStatus("Mengompresi gambar (WebP)...");
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1280,
        fileType: "image/webp",
      });

      // 2. Unggah ke Vercel Blob menggunakan client upload
      setUploadStatus("Mengunggah ke penyimpanan cloud...");
      const blob = await upload(compressedFile.name, compressedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      setFormImageUrl(blob.url);
      setUploadStatus("");
    } catch (err) {
      console.error("[handleImageUpload]", err);
      setError((err as Error).message || "Gagal mengunggah foto produk.");
      setUploadStatus("");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!description) {
      setError("Deskripsi produk wajib diisi.");
      return;
    }
    if (!formImageUrl) {
      setError("Foto produk wajib diunggah.");
      return;
    }
    if (formCategory === ProductCategory.SESERAHAN && !formBoxTypeId) {
      setError("Produk seserahan wajib memilih tipe boks.");
      return;
    }

    const payload: ProductInputData = {
      name,
      category: formCategory,
      boxTypeId: formCategory === ProductCategory.MAHAR ? null : formBoxTypeId,
      price: formPrice,
      description,
      imageUrl: formImageUrl,
      isActive: formIsActive,
    };

    startTransition(async () => {
      const res = editingProduct
        ? await updateProduct(editingProduct.id, payload)
        : await createProduct(payload);

      if (res.success) {
        setSuccessMessage(
          editingProduct
            ? "Produk berhasil diperbarui."
            : "Produk baru berhasil ditambahkan ke katalog."
        );
        closeForm();
      } else {
        setError(res.error ?? "Terjadi kesalahan saat menyimpan produk.");
      }
    });
  }

  function handleToggleActive(prod: ProductItem) {
    setError(null);
    startTransition(async () => {
      const res = await toggleProductActive(prod.id);
      if (res.success) {
        setSuccessMessage(
          `Status ${prod.name} diubah menjadi ${!prod.isActive ? "Aktif" : "Nonaktif"}.`
        );
      } else {
        setError(res.error ?? "Gagal mengubah status aktif produk.");
      }
    });
  }

  function handleDelete(prod: ProductItem) {
    if (!confirm(`Hapus produk "${prod.name}" dari katalog?`)) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteProduct(prod.id);
      if (res.success) {
        setSuccessMessage(`Produk ${prod.name} berhasil dihapus.`);
      } else {
        setError(res.error ?? "Gagal menghapus produk.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#B8926A]/30 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#B8926A] mb-1 font-sans">
            Koleksi Studio
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl text-[#4E3626] tracking-wide">
            Katalog Produk
          </h1>
          <p className="text-sm text-[#7B5841] mt-1 font-sans">
            Atur portofolio mahar dan pilihan rangkaian boks seserahan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center self-start sm:self-auto h-11 px-5 bg-[#4E3626] hover:bg-[#2B211A] text-white text-[11px] uppercase tracking-[0.14em] font-sans rounded-[2px] transition-colors cursor-pointer"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Notifikasi Global */}
      {successMessage && (
        <div className="p-4 bg-[#F2EBE1] border-l-2 border-[#7B5841] text-xs text-[#2B211A] font-sans flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[#6E5A4B] hover:text-[#2B211A] ml-4 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {error && !isFormOpen && (
        <div className="p-4 bg-red-50 border-l-2 border-red-500 text-xs text-red-800 font-sans flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-900 ml-4 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter Kategori */}
      <div className="flex items-center gap-2 border-b border-[#B8926A]/25 pb-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans mr-2">
          Kategori:
        </span>
        {(["SEMUA", ProductCategory.MAHAR, ProductCategory.SESERAHAN] as const).map(
          (cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[11px] uppercase tracking-[0.14em] font-sans rounded-[2px] transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#4E3626] text-white font-medium"
                    : "text-[#7B5841] hover:text-[#2B211A] hover:bg-[#B8926A]/15"
                }`}
              >
                {cat === "SEMUA" ? "Semua Koleksi" : cat}
              </button>
            );
          }
        )}
      </div>

      {/* Form Panel Tambah / Sunting (Atelier Ledger) */}
      {isFormOpen && (
        <div className="border border-[#B8926A]/40 bg-[#F2EBE1]/60 p-6 sm:p-8 rounded-[2px] space-y-6">
          <div className="flex items-center justify-between border-b border-[#B8926A]/25 pb-4">
            <h2 className="font-heading text-2xl text-[#4E3626]">
              {editingProduct ? `Sunting: ${editingProduct.name}` : "Tambah Produk Baru"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-xs uppercase tracking-wider text-[#7B5841] hover:text-[#2B211A] font-sans cursor-pointer"
            >
              Tutup [x]
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs text-red-700 border-l-2 border-red-400 pl-3 py-1 font-sans"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kategori Radio Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans">
                Kategori Layanan <span className="text-red-700">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[#2B211A]">
                  <input
                    type="radio"
                    name="category"
                    value={ProductCategory.MAHAR}
                    checked={formCategory === ProductCategory.MAHAR}
                    onChange={() => {
                      setFormCategory(ProductCategory.MAHAR);
                      setFormBoxTypeId("");
                    }}
                    className="accent-[#4E3626]"
                  />
                  <span>Mahar Pernikahan (Tanpa Boks)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-[#2B211A]">
                  <input
                    type="radio"
                    name="category"
                    value={ProductCategory.SESERAHAN}
                    checked={formCategory === ProductCategory.SESERAHAN}
                    onChange={() => setFormCategory(ProductCategory.SESERAHAN)}
                    className="accent-[#4E3626]"
                  />
                  <span>Seserahan (Wajib Tipe Boks)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Produk */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
                >
                  Nama Koleksi / Produk <span className="text-red-700">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingProduct?.name ?? ""}
                  placeholder="Contoh: Kaelen Terrarium Frame Mahar"
                  className="w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] px-3.5 py-2.5 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] font-sans transition-colors"
                />
              </div>

              {/* Tipe Boks (Kondisional: Nonaktif jika MAHAR, Wajib jika SESERAHAN) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="boxTypeId"
                  className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
                >
                  Tipe Boks Seserahan{" "}
                  {formCategory === ProductCategory.SESERAHAN && (
                    <span className="text-red-700">*</span>
                  )}
                </label>
                <select
                  id="boxTypeId"
                  name="boxTypeId"
                  disabled={formCategory === ProductCategory.MAHAR}
                  value={formCategory === ProductCategory.MAHAR ? "" : formBoxTypeId}
                  onChange={(e) => setFormBoxTypeId(e.target.value)}
                  className={`w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] px-3.5 py-2.5 text-sm text-[#2B211A] outline-none focus:border-[#4E3626] font-sans transition-colors ${
                    formCategory === ProductCategory.MAHAR
                      ? "opacity-50 cursor-not-allowed bg-[#FAF7F2]/60"
                      : "cursor-pointer"
                  }`}
                >
                  <option value="">
                    {formCategory === ProductCategory.MAHAR
                      ? "— Tanpa Tipe Boks (Khusus Mahar) —"
                      : "— Pilih Tipe Boks Seserahan —"}
                  </option>
                  {boxTypes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Kapasitas: {b.totalQuota} unit/hari)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#7B5841] font-sans">
                  {formCategory === ProductCategory.MAHAR
                    ? "Produk Mahar tidak memerlukan boks dan tidak memotong kuota tanggal."
                    : "Wajib dipilih untuk penghitungan kuota pesanan di kalender klien."}
                </p>
              </div>

              {/* Harga */}
              <div className="space-y-1.5">
                <label
                  htmlFor="price"
                  className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
                >
                  Harga (Rupiah) <span className="text-red-700">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  placeholder="350000"
                  className="w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] px-3.5 py-2.5 text-sm text-[#2B211A] tabular-nums outline-none focus:border-[#4E3626] font-sans transition-colors"
                />
                <p className="text-xs text-[#7B5841] font-sans tabular-nums">
                  Format: {formatRupiah(formPrice || 0)}
                </p>
              </div>

              {/* Status Publikasi */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#4E3626] rounded-[2px]"
                  />
                  <span className="text-xs font-sans text-[#2B211A]">
                    Tampilkan di Katalog Publik (Status Aktif)
                  </span>
                </label>
                <p className="text-[11px] text-[#7B5841] font-sans">
                  Jika dinonaktifkan, klien tidak dapat memilih produk ini.
                </p>
              </div>
            </div>

            {/* Unggah Foto dengan Kompresi WebP */}
            <div className="space-y-2 border-t border-[#B8926A]/25 pt-4">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans">
                Foto Karya / Produk <span className="text-red-700">*</span>
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Preview Thumbnail */}
                <div className="w-28 h-28 border border-[#B8926A]/40 bg-[#FAF7F2] relative overflow-hidden rounded-[2px] flex items-center justify-center flex-shrink-0">
                  {formImageUrl ? (
                    <Image
                      src={formImageUrl}
                      alt="Preview Foto Produk"
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <span className="text-[11px] text-[#B8926A] text-center px-2">
                      Belum ada foto
                    </span>
                  )}
                </div>

                {/* Uploader controls */}
                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 px-4 bg-[#FAF7F2] border border-[#B8926A]/50 hover:border-[#4E3626] text-[11px] uppercase tracking-[0.14em] text-[#4E3626] font-sans rounded-[2px] transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isUploading
                        ? uploadStatus || "Memproses..."
                        : formImageUrl
                        ? "Ganti Foto Karya"
                        : "Pilih & Unggah Foto"}
                    </button>

                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl("")}
                        className="text-xs text-red-700 hover:text-red-900 underline underline-offset-4 font-sans"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#7B5841] font-sans leading-relaxed">
                    Foto otomatis dikompresi di browser ke format <strong>WebP</strong> (maks. 0.25 MB, dimensi 1280px) sebelum diunggah ke Vercel Blob sesuai ketentuan PRD 3.9.
                  </p>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
              >
                Deskripsi Naratif Produk <span className="text-red-700">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                required
                defaultValue={editingProduct?.description ?? ""}
                placeholder="Rincian bunga artificial, palet warna, hiasan akrilik, dan dimensi fisik karya."
                className="w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] p-3 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] font-sans transition-colors resize-y"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="h-10 px-6 bg-[#4E3626] hover:bg-[#2B211A] disabled:bg-[#B8926A] text-white text-[11px] uppercase tracking-[0.14em] font-sans rounded-[2px] transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isPending ? "Menyimpan..." : editingProduct ? "Perbarui Produk" : "Simpan ke Katalog"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isPending}
                className="h-10 px-4 text-[11px] uppercase tracking-[0.14em] text-[#6E5A4B] hover:text-[#2B211A] font-sans rounded-[2px] transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Produk (Atelier Ledger) */}
      <div className="border border-[#B8926A]/35 bg-[#FAF7F2] overflow-x-auto rounded-[2px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#B8926A]/35 bg-[#F2EBE1]/70">
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium w-16">
                Foto
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium">
                Nama Karya
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium">
                Kategori
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium">
                Tipe Boks
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium text-right">
                Harga Sewa/Beli
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium text-center">
                Status
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B8926A]/25 font-sans text-sm">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#7B5841]">
                  Tidak ada koleksi produk pada kategori ini.
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  className={`hover:bg-[#F2EBE1]/40 transition-colors ${
                    !prod.isActive ? "opacity-60 bg-[#F2EBE1]/20" : ""
                  }`}
                >
                  {/* Foto */}
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 relative overflow-hidden border border-[#B8926A]/30 rounded-[2px] bg-[#F2EBE1]">
                      {prod.imageUrl ? (
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-[#B8926A]">
                          N/A
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Nama & Deskripsi */}
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#2B211A] leading-snug">
                      {prod.name}
                    </p>
                    <p className="text-xs text-[#6E5A4B] line-clamp-1 max-w-xs mt-0.5">
                      {prod.description}
                    </p>
                  </td>

                  {/* Kategori Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] font-sans rounded-[2px] ${
                        prod.category === ProductCategory.MAHAR
                          ? "bg-[#7B5841]/15 text-[#4E3626] font-medium"
                          : "bg-[#B8926A]/25 text-[#2B211A] font-medium"
                      }`}
                    >
                      {prod.category}
                    </span>
                  </td>

                  {/* Tipe Boks */}
                  <td className="py-3 px-4 text-xs text-[#6E5A4B]">
                    {prod.boxType ? (
                      <span className="font-medium text-[#2B211A]">
                        {prod.boxType.name}
                      </span>
                    ) : (
                      <span className="text-[#B8926A] italic">
                        Tanpa Boks (Mahar)
                      </span>
                    )}
                  </td>

                  {/* Harga Rupiah Tabular */}
                  <td className="py-3 px-4 text-right tabular-nums font-medium text-[#2B211A]">
                    {formatRupiah(prod.price)}
                  </td>

                  {/* Status Toggle Cepat */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleActive(prod)}
                      className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-sans rounded-[2px] border transition-colors cursor-pointer ${
                        prod.isActive
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                          : "bg-stone-100 border-stone-300 text-stone-600 hover:bg-stone-200"
                      }`}
                      title="Klik untuk ubah status aktif/nonaktif"
                    >
                      {prod.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>

                  {/* Aksi */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(prod)}
                        className="text-[11px] uppercase tracking-[0.14em] text-[#4E3626] hover:text-[#2B211A] border-b border-[#4E3626]/40 hover:border-[#4E3626] pb-0.5 transition-colors cursor-pointer"
                      >
                        Sunting
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod)}
                        className="text-[11px] uppercase tracking-[0.14em] text-red-700 hover:text-red-950 border-b border-red-300 hover:border-red-700 pb-0.5 transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
