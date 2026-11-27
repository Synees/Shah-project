import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Proteksi autentikasi: user wajib login
        const user = await requireAuth();

        return {
          allowedContentTypes: ["image/webp", "image/jpeg", "image/png"],
          maximumSizeInBytes: 1000000, // 1 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: user.id,
            userRole: user.role,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Callback opsional saat upload selesai dari Vercel Blob
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
