"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface DirectCVUploadProps {
  userId: string;
  onUploadSuccess?: () => void;
}

export default function DirectCVUpload({
  userId,
  onUploadSuccess,
}: DirectCVUploadProps) {
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
    formData.append("userId", userId);

    try {
      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "CV оруулахад алдаа гарлаа");
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        router.refresh();
      }
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
    <div>
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
  );
}
