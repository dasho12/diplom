import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Нэвтрэх шаардлагатай" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json(
        { message: "Файл оруулаагүй байна" },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !file.type.includes("pdf") &&
      !file.type.includes("doc") &&
      !file.type.includes("docx")
    ) {
      return NextResponse.json(
        { message: "Зөвхөн PDF эсвэл Word файл оруулна уу" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Файлын хэмжээ 5MB-ээс хэтрэхгүй байх ёстой" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "cvs");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, uniqueFilename);

    // Save file
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Save CV information to database
    const cv = await prisma.cV.create({
      data: {
        fileName: file.name,
        fileUrl: `/uploads/cvs/${uniqueFilename}`,
        userId: userId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, cv });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json(
      { message: "Файл оруулахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
