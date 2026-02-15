"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Trash2,
  Calendar,
  Send,
  Check,
  ChevronLeft,
  FileVideo,
  FileText,
  Eye,
  X,
  FolderOpen,
} from "lucide-react";
import { api } from "~/trpc/react";
import { format } from "date-fns";

interface MediaGalleryProps {
  folderId: number | null;
  onFolderChange: (id: number | null) => void;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

export function MediaGallery({ folderId, onFolderChange }: MediaGalleryProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewItem, setPreviewItem] = useState<{
    s3Url: string;
    mimeType: string;
    originalName: string;
  } | null>(null);
  const [assignDate, setAssignDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const utils = api.useUtils();

  const { data: mediaData, isLoading } = api.media.getAll.useQuery({
    folderId: folderId,
    limit: 50,
  });

  const { data: currentFolder } = api.folder.getById.useQuery(
    { id: folderId! },
    { enabled: folderId !== null }
  );

  const { data: breadcrumbs } = api.folder.getBreadcrumbs.useQuery(
    { id: folderId! },
    { enabled: folderId !== null }
  );

  const { data: subfolders } = api.folder.getAll.useQuery(
    { parentId: folderId },
  );

  const deleteMedia = api.media.delete.useMutation({
    onSuccess: () => {
      void utils.media.getAll.invalidate();
      void utils.media.getStats.invalidate();
    },
  });

  const markSent = api.media.markSent.useMutation({
    onSuccess: () => {
      void utils.media.getAll.invalidate();
      void utils.media.getStats.invalidate();
      setSelectedIds(new Set());
    },
  });

  const assignToDate = api.media.assignToDate.useMutation({
    onSuccess: () => {
      void utils.media.getAll.invalidate();
      setSelectedIds(new Set());
      setShowDatePicker(false);
      setAssignDate("");
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const items = mediaData?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => onFolderChange(null)}
            className={`rounded-md px-2 py-1 transition-colors ${
              folderId === null
                ? "bg-violet-100 font-medium text-violet-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Files
          </button>
          {breadcrumbs?.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span className="text-gray-400">/</span>
              <button
                onClick={() => onFolderChange(crumb.id)}
                className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => {
                markSent.mutate({ ids: Array.from(selectedIds) });
              }}
              className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
            >
              <Send className="h-3.5 w-3.5" />
              Mark Sent
            </button>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Date Picker for scheduling */}
      {showDatePicker && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
          <input
            type="date"
            value={assignDate}
            onChange={(e) => setAssignDate(e.target.value)}
            className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => {
              if (assignDate) {
                assignToDate.mutate({
                  ids: Array.from(selectedIds),
                  sendDate: assignDate,
                });
              }
            }}
            disabled={!assignDate}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Assign Date
          </button>
          <button
            onClick={() => setShowDatePicker(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Subfolders */}
      {subfolders && subfolders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {folderId !== null && (
            <button
              onClick={() => onFolderChange(currentFolder?.parentId ?? null)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          {subfolders.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onFolderChange(sub.id)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-violet-300 hover:bg-violet-50"
            >
              <FolderOpen className="h-4 w-4 text-violet-500" />
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-20">
          <FolderOpen className="h-16 w-16 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">No media yet</p>
          <p className="text-sm text-gray-400">Upload some files to get started</p>
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 transition-all ${
                selectedIds.has(item.id)
                  ? "ring-2 ring-violet-500 shadow-violet-100"
                  : "ring-gray-200 hover:shadow-md"
              }`}
            >
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelect(item.id)}
                className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                  selectedIds.has(item.id)
                    ? "border-violet-500 bg-violet-500"
                    : "border-white/80 bg-white/60 opacity-0 group-hover:opacity-100"
                }`}
              >
                {selectedIds.has(item.id) && (
                  <Check className="h-3.5 w-3.5 text-white" />
                )}
              </button>

              {/* Sent badge */}
              {item.sent && (
                <div className="absolute right-2 top-2 z-10 rounded-full bg-green-500 p-1">
                  <Send className="h-3 w-3 text-white" />
                </div>
              )}

              {/* Thumbnail */}
              <div
                className="relative aspect-square cursor-pointer bg-gray-100"
                onClick={() =>
                  setPreviewItem({
                    s3Url: item.s3Url,
                    mimeType: item.mimeType,
                    originalName: item.originalName,
                  })
                }
              >
                {isImage(item.mimeType) ? (
                  <Image
                    src={item.s3Url}
                    alt={item.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    unoptimized
                  />
                ) : isVideo(item.mimeType) ? (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <FileVideo className="h-12 w-12 text-blue-400" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                    <FileText className="h-12 w-12 text-amber-400" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                  <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="truncate text-xs font-medium text-gray-700">
                  {item.originalName}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {item.sendDate
                      ? format(new Date(item.sendDate), "MMM d")
                      : "No date"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this file?")) {
                        deleteMedia.mutate({ id: item.id });
                      }
                    }}
                    className="rounded p-0.5 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
                {item.note && (
                  <p className="mt-1 truncate text-[10px] text-gray-400">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage(previewItem.mimeType) ? (
              <Image
                src={previewItem.s3Url}
                alt={previewItem.originalName}
                width={1200}
                height={800}
                className="rounded-lg object-contain"
                unoptimized
              />
            ) : isVideo(previewItem.mimeType) ? (
              <video
                src={previewItem.s3Url}
                controls
                className="max-h-[80vh] rounded-lg"
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8">
                <FileText className="h-20 w-20 text-amber-400" />
                <p className="text-lg font-medium">{previewItem.originalName}</p>
                <a
                  href={previewItem.s3Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-violet-600 px-6 py-2 text-white hover:bg-violet-700"
                >
                  Open File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
