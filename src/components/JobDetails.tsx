"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Job } from "@prisma/client";
import Link from "next/link";

interface JobDetailsProps {
  job: Job | null;
  userCVs?: any[];
}

export default function JobDetails({ job, userCVs = [] }: JobDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCV, setSelectedCV] = useState<string>("");

  useEffect(() => {
    if (userCVs.length > 0) {
      setSelectedCV(userCVs[0].id);
    }
  }, [userCVs]);

  const handleApply = async () => {
    if (!job) return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (!selectedCV) {
      setError("CV сонгоно уу");
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          cvId: selectedCV,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Анкет амжилттай илгээгдлээ");
        setTimeout(() => {
          router.push("/jobseeker/applications");
        }, 2000);
      } else {
        setError(data.error || "Анкет илгээхэд алдаа гарлаа");
      }
    } catch (error) {
      setError("Анкет илгээхэд алдаа гарлаа");
    } finally {
      setIsApplying(false);
    }
  };

  if (!job) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <p>Ажлын байрыг сонгоно уу</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">{job.title}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Тайлбар</h2>
          <p className="text-gray-600">{job.description}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Шаардлага</h2>
          <p className="text-gray-600">{job.requirements}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Цалин</h2>
          <p className="text-gray-600">{job.salary}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Байршил</h2>
          <p className="text-gray-600">{job.location}</p>
        </div>
      </div>

      {session?.user?.role === "USER" && (
        <div className="mt-6 space-y-4">
          {userCVs.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV сонгох
              </label>
              <select
                value={selectedCV}
                onChange={(e) => setSelectedCV(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {userCVs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.fileName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                CV оруулах шаардлагатай байна
              </p>
              <Link
                href="/jobseeker/profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                CV оруулах
              </Link>
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          {success && <div className="text-green-600 text-sm">{success}</div>}

          {userCVs.length > 0 && (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isApplying ? "Илгээж байна..." : "Анкет илгээх"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
