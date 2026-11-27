"use client";

import { useState, useTransition } from "react";
import { createBoxType, updateBoxType } from "@/lib/actions/box-type";

interface BoxTypeItem {
  id: string;
  name: string;
  description: string | null;
  totalQuota: number;
  _count: {
    products: number;
  };
}

interface BoxClientProps {
  initialBoxes: BoxTypeItem[];
}

export function BoxClient({ initialBoxes }: BoxClientProps) {
  const [boxes] = useState<BoxTypeItem[]>(initialBoxes);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<BoxTypeItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreateForm() {
    setEditingBox(null);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function openEditForm(box: BoxTypeItem) {
    setEditingBox(box);
    setError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingBox(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editingBox
        ? await updateBoxType(editingBox.id, formData)
        : await createBoxType(formData);

      if (result.success) {
        setSuccessMessage(
          editingBox
            ? "Tipe boks berhasil diperbarui."
            : "Tipe boks baru berhasil ditambahkan."
        );
        closeForm();
      } else {
        setError(result.error ?? "Terjadi kesalahan saat menyimpan data.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#B8926A]/30 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#B8926A] mb-1 font-sans">
            Inventaris Studio
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl text-[#4E3626] tracking-wide">
            Tipe Boks Seserahan
          </h1>
          <p className="text-sm text-[#7B5841] mt-1 font-sans">
            Kelola varian boks fisik dan batas kapasitas unit per tanggal acara.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center self-start sm:self-auto h-11 px-5 bg-[#4E3626] hover:bg-[#2B211A] text-white text-[11px] uppercase tracking-[0.14em] font-sans rounded-[2px] transition-colors cursor-pointer"
        >
          + Tambah Tipe Boks
        </button>
      </div>

      {/* Pesan Sukses */}
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

      {/* Form Drawer / Panel Inline */}
      {isFormOpen && (
        <div className="border border-[#B8926A]/40 bg-[#F2EBE1]/60 p-6 sm:p-8 rounded-[2px] space-y-6">
          <div className="flex items-center justify-between border-b border-[#B8926A]/25 pb-4">
            <h2 className="font-heading text-2xl text-[#4E3626]">
              {editingBox ? `Edit ${editingBox.name}` : "Tambah Tipe Boks Baru"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-xs uppercase tracking-wider text-[#7B5841] hover:text-[#2B211A] font-sans"
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Boks */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
                >
                  Nama Tipe Boks <span className="text-red-700">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingBox?.name ?? ""}
                  placeholder="Contoh: Hexagonal Glass Box"
                  className="w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] px-3.5 py-2.5 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] font-sans transition-colors"
                />
              </div>

              {/* Kuota Total */}
              <div className="space-y-1.5">
                <label
                  htmlFor="totalQuota"
                  className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
                >
                  Kapasitas Fisik Per Hari <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    id="totalQuota"
                    name="totalQuota"
                    type="number"
                    min="1"
                    required
                    defaultValue={editingBox?.totalQuota ?? 10}
                    className="w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] px-3.5 py-2.5 pr-16 text-sm text-[#2B211A] tabular-nums outline-none focus:border-[#4E3626] font-sans transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#7B5841] font-sans pointer-events-none">
                    unit
                  </span>
                </div>
                <p className="text-[11px] text-[#7B5841] font-sans">
                  Batas unit maksimal yang dapat disewa pelanggan pada tanggal acara yang sama.
                </p>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="block text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans"
              >
                Karakteristik & Detail Boks (Opsional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={editingBox?.description ?? ""}
                placeholder="Spesifikasi dimensi, material kaca, aksen kuningan, dsb."
                className="w-full bg-[#FAF7F2] border border-[#B8926A]/45 rounded-[2px] p-3 text-sm text-[#2B211A] placeholder:text-[#B8926A]/50 outline-none focus:border-[#4E3626] font-sans transition-colors resize-y"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="h-10 px-6 bg-[#4E3626] hover:bg-[#2B211A] disabled:bg-[#B8926A] text-white text-[11px] uppercase tracking-[0.14em] font-sans rounded-[2px] transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isPending ? "Menyimpan..." : editingBox ? "Perbarui Boks" : "Simpan Tipe Boks"}
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

      {/* Tabel Atelier Ledger */}
      <div className="border border-[#B8926A]/35 bg-[#FAF7F2] overflow-x-auto rounded-[2px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#B8926A]/35 bg-[#F2EBE1]/70">
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium">
                Nama Tipe Boks
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium">
                Karakteristik
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium text-right">
                Kuota Harian
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium text-right">
                Produk Terkait
              </th>
              <th className="py-3.5 px-4 text-[11px] uppercase tracking-[0.16em] text-[#6E5A4B] font-sans font-medium text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B8926A]/25 font-sans text-sm">
            {boxes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#7B5841]">
                  Belum ada tipe boks seserahan yang terdaftar di studio.
                </td>
              </tr>
            ) : (
              boxes.map((box) => (
                <tr
                  key={box.id}
                  className="hover:bg-[#F2EBE1]/40 transition-colors"
                >
                  <td className="py-4 px-4 font-medium text-[#2B211A]">
                    {box.name}
                  </td>
                  <td className="py-4 px-4 text-[#6E5A4B] text-xs max-w-xs truncate">
                    {box.description || "—"}
                  </td>
                  <td className="py-4 px-4 text-right text-[#2B211A] tabular-nums font-medium">
                    {box.totalQuota} <span className="text-xs text-[#7B5841] font-normal">unit</span>
                  </td>
                  <td className="py-4 px-4 text-right tabular-nums text-[#6E5A4B]">
                    {box._count.products}{" "}
                    <span className="text-xs text-[#7B5841]">item</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEditForm(box)}
                      className="text-[11px] uppercase tracking-[0.14em] text-[#4E3626] hover:text-[#2B211A] border-b border-[#4E3626]/40 hover:border-[#4E3626] pb-0.5 transition-colors cursor-pointer"
                    >
                      Sunting
                    </button>
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
