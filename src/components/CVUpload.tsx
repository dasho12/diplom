"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useChat } from "@/providers/ChatProvider";

interface JobMatch {
  job: {
    id: string;
    title: string;
    company: {
      name: string;
    };
    location: string;
    salary?: string;
    requirements: string;
  };
  matchScore: number;
  matchDetails: {
    experience: number;
    skills: number;
    education: number;
    overall: number;
  };
}

interface CVUploadProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (analysis: string, matches: JobMatch[] | null) => void;
}

export default function CVUpload({
  onAnalysisStart,
  onAnalysisComplete,
}: CVUploadProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "application/msword"
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF or Word document");
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    onAnalysisStart();

    // Show initial loading message
    await sendMessage("CV-г боловсруулж байна. Түр хүлээнэ үү...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload CV and get analysis
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload CV");
      }

      if (!data.success || !data.analysis) {
        throw new Error("CV analysis failed");
      }

      // Send the analysis to chat
      await sendMessage(`CV Шинжилгээ:\n\n${data.analysis}`);

      // Show loading message for job matches
      await sendMessage("Ажлын байруудыг хайж байна...");

      if (data.matches && data.matches.length > 0) {
        // Send job matches to chat
        const matchesMessage = data.matches
          .map(
            (match: JobMatch) =>
              `Ажлын байр: ${match.job.title}\nКомпани: ${
                match.job.company.name
              }\nТохиролт: ${Math.round(
                match.matchScore
              )}%\n\nТохиролтын дэлгэрэнгүй:\n- Туршлага: ${Math.round(
                match.matchDetails.experience
              )}%\n- Ур чадвар: ${Math.round(
                match.matchDetails.skills
              )}%\n- Боловсрол: ${Math.round(match.matchDetails.education)}%`
          )
          .join("\n\n");
        await sendMessage(
          `Таны CV-тэй тохирох ажлын байрууд:\n\n${matchesMessage}`
        );
        onAnalysisComplete(data.analysis, data.matches);
      } else {
        await sendMessage(
          "Уучлаарай, таны CV-тэй тохирох ажлын байр олдсонгүй. Дараах зүйлсийг хийж болно:\n\n1. CV-гээ сайжруулах\n2. Илүү олон ур чадвар нэмэх\n3. Дараа дахин оролдох"
        );
        onAnalysisComplete(data.analysis, null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload CV";
      setError(errorMessage);
      await sendMessage(
        `Уучлаарай, CV-г боловсруулахад алдаа гарлаа:\n\n${errorMessage}\n\nДараах зүйлсийг хийж болно:\n1. CV-гээ шалгаад дахин оролдох\n2. Хэдэн минут хүлээгээд дахин оролдох\n3. Чат функцээр CV-гээ дэлгэрэнгүй шинжилгээ хийх`
      );
      onAnalysisComplete("", null);
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
        CV байршуулахын тулд нэвтрэх шаардлагатай
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <label className="text-base font-medium text-slate-900">
          CV-гээ байршуулах (PDF эсвэл Word)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm text-slate-600
            file:mr-4 file:py-3 file:px-6
            file:rounded-xl file:border-0
            file:text-sm file:font-semibold
            file:bg-slate-900 file:text-white
            hover:file:bg-slate-800
            transition-colors duration-200"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full py-3 px-6 rounded-xl text-white font-medium transition-colors duration-200
            ${
              uploading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
        >
          {uploading ? "Байршуулж байна..." : "CV байршуулах"}
        </button>
      )}
    </div>
  );
}
