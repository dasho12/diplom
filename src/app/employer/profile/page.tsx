"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  description: string;
  location: string;
  website: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  status: string;
  createdAt: string;
  applications: JobApplication[];
}

interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  cvId: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  cv: {
    fileName: string;
    fileUrl: string;
  };
}

export default function EmployerProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchCompanyAndJobs();
    }
  }, [status]);

  const fetchCompanyAndJobs = async () => {
    try {
      // Fetch company data
      const companyRes = await fetch("/api/employer/company");
      const companyData = await companyRes.json();
      setCompany(companyData);

      // Fetch jobs data with applications
      const jobsRes = await fetch("/api/employer/jobs?include=applications");
      const jobsData = await jobsRes.json();
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm("Энэ ажлын байрыг устгахдаа итгэлтэй байна уу?")) {
      try {
        const response = await fetch(`/api/employer/jobs/${jobId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setJobs(jobs.filter((job) => job.id !== jobId));
        } else {
          alert("Ажлын байрыг устгахад алдаа гарлаа");
        }
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Ажлын байрыг устгахад алдаа гарлаа");
      }
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(
        `/api/employer/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // Update the local state
        setJobs(
          jobs.map((job) => ({
            ...job,
            applications: job.applications.map((app) =>
              app.id === applicationId ? { ...app, status: newStatus } : app
            ),
          }))
        );
      } else {
        alert("Төлөв шинэчлэхэд алдаа гарлаа");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Төлөв шинэчлэхэд алдаа гарлаа");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Ачаалж байна...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Company Info and Post Job Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Байгууллагын мэдээлэл
            </h2>
            <div className="space-y-3 text-black">
              <div>
                <span className="font-semibold">Байгууллагын нэр:</span>{" "}
                {company?.name}
              </div>
              <div>
                <span className="font-semibold">Байгууллагын Email:</span>{" "}
                {session?.user?.email}
              </div>
              <div>
                <span className="font-semibold">Холбоо барих:</span> 90099810
              </div>
              <div>
                <span className="font-semibold">Хаяг:</span> {company?.location}
              </div>
            </div>
            <Link
              href="/employer/post-job"
              className="mt-6 block w-full text-center bg-blue-900 text-white py-2 rounded-md font-medium hover:bg-blue-800 transition-colors"
            >
              Ажлын байр нийтлэх
            </Link>
          </div>

          {/* Posted Jobs and Applications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-black">
              Нийтэлсэн ажлын байрууд
            </h2>
            <div className="flex flex-col gap-6">
              {jobs.length === 0 ? (
                <p className="text-black">
                  Одоогоор ажлын байр нийтлээгүй байна.
                </p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets/04fcdb08a3cb484fba8d958382052e5c/23813725c8b2f39dd1d36d4e94e16d8ab78110aa?placeholderIfAbsent=true"
                        alt="logo"
                        className="w-14 h-14 object-contain rounded-lg bg-gray-100"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-black">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-green-700 bg-green-50 px-2 py-1 text-xs font-semibold rounded">
                            БҮТЭН ЦАГ
                          </span>
                          <span className="text-black text-sm">
                            Цалин: {job.salary}
                          </span>
                        </div>
                        <div className="text-black text-sm mt-1">
                          {company?.name}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          {job.location}
                        </div>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <Link
                          href={`/employer/jobs/${job.id}/edit`}
                          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                          title="Засах"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.789l-4 1 1-4 13.362-13.302z"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                          title="Устгах"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Applications List */}
                    {job.applications && job.applications.length > 0 ? (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Ирсэн анкетууд
                        </h4>
                        <div className="space-y-3">
                          {job.applications.map((application) => (
                            <div
                              key={application.id}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {application.user.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {application.user.email}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Илгээсэн:{" "}
                                    {new Date(
                                      application.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={application.cv.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    CV үзэх
                                  </a>
                                  <select
                                    value={application.status}
                                    onChange={(e) =>
                                      handleUpdateApplicationStatus(
                                        application.id,
                                        e.target.value
                                      )
                                    }
                                    className="rounded-md border-gray-300 text-sm"
                                  >
                                    <option value="PENDING">
                                      Хүлээгдэж буй
                                    </option>
                                    <option value="REVIEWING">
                                      Шалгаж буй
                                    </option>
                                    <option value="ACCEPTED">
                                      Зөвшөөрөгдсөн
                                    </option>
                                    <option value="REJECTED">Татгалзсан</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-gray-500 text-sm">
                          Одоогоор анкет ирээгүй байна.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
