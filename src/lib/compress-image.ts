/**
 * Shah Project - Client Image Compression Utility
 * Memanfaatkan browser-image-compression untuk mengecilkan foto bukti bayar
 * dan laporan akhir sebelum diunggah ke Vercel Blob.
 * 
 * Spesifikasi PRD Bagian 3.9:
 * - maxSizeMB: 0.25 (250 KB)
 * - maxWidthOrHeight: 1280
 * - output format: image/webp
 */

import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  fileType?: string;
  useWebWorker?: boolean;
  initialQuality?: number;
}

export const DEFAULT_IMAGE_COMPRESSION_CONFIG: CompressionOptions = {
  maxSizeMB: 0.25,
  maxWidthOrHeight: 1280,
  fileType: "image/webp",
  useWebWorker: true,
  initialQuality: 0.85,
};

/**
 * Mengompresi file gambar di sisi browser sesuai standar PRD
 */
export async function compressImage(
  file: File,
  customOptions?: Partial<CompressionOptions>
): Promise<File> {
  // Hanya jalankan di browser environment
  if (typeof window === "undefined") {
    return file;
  }

  // Jika bukan gambar (misal file aneh), kembalikan aslinya
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const options: CompressionOptions = {
    ...DEFAULT_IMAGE_COMPRESSION_CONFIG,
    ...customOptions,
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    // Ganti ekstensi file menjadi .webp
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const webpFileName = `${baseName}.webp`;

    return new File([compressedBlob], webpFileName, {
      type: options.fileType || "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Gagal melakukan kompresi gambar client-side:", error);
    throw new Error("Gagal mengompresi gambar. Pastikan file berupa format gambar yang valid.");
  }
}
