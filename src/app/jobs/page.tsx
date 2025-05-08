"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import JobsList from "@/components/JobsList";
import JobDetails from "@/components/JobDetails";

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
  };
  description: string;
  requirements: string;
  location: string;
  salary?: string;
  createdAt: string;
}

interface CV {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export default function JobsPage() {
  const { data: session } = useSession();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [userCVs, setUserCVs] = useState<CV[]>([]);

  useEffect(() => {
    if (session?.user) {
      // Fetch user's CVs when logged in
      fetch("/api/user/cvs")
        .then((res) => res.json())
        .then((data) => setUserCVs(data))
        .catch((error) => console.error("Error fetching CVs:", error));
    }
  }, [session]);

  return (
    <div className="min-h-screen mt-16 bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Filters, Search, Job List */}
          <div>
            <JobsList onJobSelect={setSelectedJob} />
          </div>
          {/* Right: Job Details */}
          <div className="hidden lg:block">
            <JobDetails job={selectedJob} userCVs={userCVs} />
          </div>
        </div>
      </main>
    </div>
  );
}
