"use client";

import Link from "next/link";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface CV {
  id: string;
  fileName: string;
  createdAt: Date;
  status: string | null;
  fileUrl: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImageUrl: string | null;
  phoneNumber: string | null;
  facebookUrl: string | null;
  cvs: CV[];
}

interface ProfileContentProps {
  user: User;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);

    try {
      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "CV оруулахад алдаа гарлаа");
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "CV оруулахад алдаа гарлаа"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-white py-8 md:py-12 mt-12">
      <div className="container mx-auto max-w-4xl px-4 space-y-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Ажил хайгчийн профайл
        </h1>

        <div className="bg-gray-200 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
              <div className="relative flex-shrink-0 text-center">
                <div className="w-32 h-32 mx-auto relative">
                  {user.profileImageUrl ? (
                    <Image
                      src={user.profileImageUrl}
                      alt="Profile Picture"
                      width={128}
                      height={128}
                      className="rounded-full object-cover w-full h-full border-4 border-gray-100 shadow-sm"
                    />
                  ) : (
                    <UserCircleIcon className="h-32 w-32 text-gray-500" />
                  )}
                  <ProfileImageUpload
                    userId={user.id}
                    currentImageUrl={user.profileImageUrl ?? null}
                  />
                </div>
              </div>

              <div className="flex-grow text-center sm:text-left pt-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                  {user.name || "Нэр"}
                </h2>
                <p className="text-gray-700 text-lg mb-2">{user.email}</p>
                {user.phoneNumber && (
                  <p className="text-gray-600 text-md mb-1">
                    <span className="font-medium">Утас:</span>{" "}
                    {user.phoneNumber}
                  </p>
                )}
                {user.facebookUrl && (
                  <p className="text-gray-600 text-md mb-1">
                    <span className="font-medium">Facebook:</span>{" "}
                    <a
                      href={user.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline break-all"
                    >
                      {user.facebookUrl}
                    </a>
                  </p>
                )}
                <Link
                  href="/jobseeker/profile/edit"
                  className="mt-4 inline-block text-sm text-indigo-700 hover:text-indigo-900 font-medium"
                >
                  Профайл засах
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-200 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-700">
                Миний CV-нүүд
              </h2>
              <div className="flex-shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={isUploading}
                />
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isUploading ? "Оруулж байна..." : "CV оруулах"}
                </button>
              </div>
            </div>
            {user.cvs && user.cvs.length > 0 ? (
              <ul className="space-y-4">
                {user.cvs.map((cv) => (
                  <li
                    key={cv.id}
                    className="p-5 border border-gray-400 rounded-lg bg-gray-200 hover:shadow-md transition duration-200 ease-in-out flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                  >
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {cv.fileName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Оруулсан: {new Date(cv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {cv.fileUrl && (
                        <a
                          href={cv.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Татах
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Одоогоор CV оруулаагүй байна
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
