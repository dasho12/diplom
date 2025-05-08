import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Нэвтрээгүй байна" },
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

    if (!userId) {
      return NextResponse.json(
        { message: "Хэрэглэгчийн ID оруулаагүй байна" },
        { status: 400 }
      );
    }

    // Check if user is authorized to upload CV
    if (session.user.id !== userId) {
      return NextResponse.json(
        { message: "Энэ үйлдлийг хийх эрхгүй байна" },
        { status: 403 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(process.cwd(), "public", "uploads", "cvs", fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Create CV record in database
    const cv = await prisma.cV.create({
      data: {
        fileName: fileName,
        fileUrl: `/uploads/cvs/${fileName}`,
        status: "ACTIVE",
        userId: userId,
      },
    });

    return NextResponse.json({
      message: "CV амжилттай хадгалагдлаа",
      cv,
    });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json(
      { message: "CV оруулахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
