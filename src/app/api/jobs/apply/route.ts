import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { jobId, cvId } = body;

    if (!jobId || !cvId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    // Check if CV exists and belongs to user
    const cv = await prisma.cV.findFirst({
      where: {
        id: cvId,
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    if (!cv) {
      return new NextResponse("CV not found or not active", { status: 404 });
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId,
        userId: session.user.id,
      },
    });

    if (existingApplication) {
      return new NextResponse("You have already applied for this job", {
        status: 400,
      });
    }

    // Create job application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId: session.user.id,
        cvId,
        status: ApplicationStatus.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Анкет амжилттай илгээгдлээ",
      application,
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
