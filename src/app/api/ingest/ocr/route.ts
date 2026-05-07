import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { extractMenuOcr } from "@/lib/llm";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  if (!isImage && !isPdf) {
    return NextResponse.json({ error: "Only images and PDFs are supported for OCR" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ocrText = await extractMenuOcr({
      fileName: file.name,
      mimeType: file.type,
      base64: buffer.toString("base64"),
    });

    if (!ocrText) {
      return NextResponse.json({ error: "OCR failed — could not read menu" }, { status: 422 });
    }

    return NextResponse.json({ ocrText, fileName: file.name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OCR failed" },
      { status: 500 },
    );
  }
}
