import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }

    // Verify that the employer owns the job
    const application = await prisma.jobApplication.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            company: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return new NextResponse("Application not found", { status: 404 });
    }

    // Check if the employer is associated with the company that posted the job
    const isCompanyOwner = application.job.company.users.some(
      (user) => user.id === session.user.id
    );

    if (!isCompanyOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update the application status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("[APPLICATION_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
