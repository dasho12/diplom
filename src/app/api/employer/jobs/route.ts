import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeApplications = searchParams.get("include") === "applications";

    // Get the company associated with the user
    const company = await prisma.company.findFirst({
      where: {
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const jobs = await prisma.job.findMany({
      where: {
        companyId: company.id,
      },
      include: includeApplications
        ? {
            applications: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                cv: {
                  select: {
                    fileName: true,
                    fileUrl: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { title, description, requirements, location, salary } = body;

    if (!title || !description || !location) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the company associated with the user
    const company = await prisma.company.findFirst({
      where: {
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        location,
        salary,
        companyId: company.id,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("[JOBS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
