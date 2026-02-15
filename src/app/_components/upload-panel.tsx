"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, FileImage, FileVideo, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";

interface UploadPanelProps {
  currentFolderId: number | null;
  onUploadComplete: () => void;
}

interface FileUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  return FileText;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadPanel({ currentFolderId, onUploadComplete }: UploadPanelProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [note, setNote] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const createMedia = api.media.create.useMutation();

  const { data: folder } = api.folder.getById.useQuery(
    { id: currentFolderId! },
    { enabled: currentFolderId !== null }
  );

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles).map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...fileArray]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const uploadAll = async () => {
    setIsUploading(true);
    const folderPath = folder?.s3Path ?? "";

    for (let i = 0; i < files.length; i++) {
      const fileUpload = files[i];
      if (!fileUpload || fileUpload.status === "done") continue;

      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" as const, progress: 30 } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", fileUpload.file);
        formData.append("folderPath", folderPath);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const result = (await response.json()) as {
          fileName: string;
          originalName: string;
          mimeType: string;
          fileSize: number;
          s3Key: string;
          s3Url: string;
        };

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 70 } : f))
        );

        await createMedia.mutateAsync({
          fileName: result.fileName,
          originalName: result.originalName,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          s3Key: result.s3Key,
          s3Url: result.s3Url,
          folderId: currentFolderId,
          note: note || undefined,
          sendDate: sendDate || undefined,
        });

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "done" as const, progress: 100 } : f))
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error" as const, error: err instanceof Error ? err.message : "Failed" }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    await utils.media.getAll.invalidate();
    await utils.media.getStats.invalidate();

    const allDone = files.every((f) => f.status === "done");
    if (allDone && files.length > 0) {
      setTimeout(() => {
        setFiles([]);
        setNote("");
        setSendDate("");
        onUploadComplete();
      }, 1500);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Media</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload images, videos, or PDFs to{" "}
          {folder ? (
            <span className="font-medium text-violet-600">{folder.name}</span>
          ) : (
            "root folder"
          )}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          isDragging
            ? "border-violet-400 bg-violet-50 scale-[1.02]"
            : "border-gray-300 bg-white hover:border-violet-300 hover:bg-violet-50/50"
        }`}
      >
        <Upload
          className={`mx-auto h-12 w-12 ${isDragging ? "text-violet-500" : "text-gray-400"}`}
        />
        <p className="mt-4 text-lg font-medium text-gray-700">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Images, Videos, PDFs — any file type
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,*/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </h3>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200">
            {files.map((fileUpload, index) => {
              const Icon = getFileIcon(fileUpload.file.type);
              return (
                <div
                  key={`${fileUpload.file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <Icon className="h-8 w-8 shrink-0 text-violet-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {fileUpload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatSize(fileUpload.file.size)}
                    </p>
                    {fileUpload.status === "uploading" && (
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${fileUpload.progress}%` }}
                        />
                      </div>
                    )}
                    {fileUpload.status === "error" && (
                      <p className="text-xs text-red-500">{fileUpload.error}</p>
                    )}
                  </div>
                  {fileUpload.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  ) : fileUpload.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-500" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="shrink-0 rounded-full p-1 hover:bg-gray-200"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Options */}
      {files.length > 0 && (
        <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for these files..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Schedule send date (optional)
            </label>
            <input
              type="date"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={uploadAll}
          disabled={isUploading || files.every((f) => f.status === "done")}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </span>
          ) : files.every((f) => f.status === "done") ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              All uploaded!
            </span>
          ) : (
            `Upload ${files.filter((f) => f.status !== "done").length} file${files.filter((f) => f.status !== "done").length > 1 ? "s" : ""}`
          )}
        </button>
      )}
    </div>
  );
}
