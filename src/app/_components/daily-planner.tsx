"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  FileVideo,
  FileText,
  Check,
} from "lucide-react";
import { api } from "~/trpc/react";
import { format, addDays, subDays } from "date-fns";

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

export function DailyPlanner() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const utils = api.useUtils();

  const { data: items, isLoading } = api.media.getByDate.useQuery({
    date: selectedDate,
  });

  const { data: unscheduled } = api.media.getAll.useQuery({
    sent: false,
    limit: 20,
  });

  const assignToDate = api.media.assignToDate.useMutation({
    onSuccess: () => {
      void utils.media.getByDate.invalidate();
      void utils.media.getAll.invalidate();
    },
  });

  const markSent = api.media.markSent.useMutation({
    onSuccess: () => {
      void utils.media.getByDate.invalidate();
      void utils.media.getAll.invalidate();
      void utils.media.getStats.invalidate();
    },
  });

  const goToPrevDay = () => {
    setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const scheduledItems = items ?? [];
  const unscheduledItems =
    unscheduled?.items.filter((item) => !item.sendDate) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Daily Planner</h2>
        <p className="mt-1 text-sm text-gray-500">
          Plan which media to send each day
        </p>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={goToPrevDay}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-violet-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-center font-medium focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={goToToday}
            className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-200"
          >
            Today
          </button>
        </div>
        <button
          onClick={goToNextDay}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scheduled for this day */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Scheduled for{" "}
              {format(new Date(selectedDate), "MMM d, yyyy")}
            </h3>
            {scheduledItems.length > 0 && (
              <button
                onClick={() => {
                  const unsent = scheduledItems
                    .filter((i) => !i.sent)
                    .map((i) => i.id);
                  if (unsent.length > 0) {
                    markSent.mutate({ ids: unsent });
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
              >
                <Send className="h-3.5 w-3.5" />
                Mark All Sent
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl bg-white py-12 shadow-sm ring-1 ring-gray-200">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            </div>
          ) : scheduledItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-white py-12 text-center shadow-sm ring-1 ring-gray-200">
              <Calendar className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                Nothing scheduled for this day
              </p>
              <p className="text-xs text-gray-400">
                Drag items from the right or use the gallery
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ${
                    item.sent ? "ring-green-200 bg-green-50/50" : "ring-gray-200"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {isImage(item.mimeType) ? (
                      <Image
                        src={item.s3Url}
                        alt={item.originalName}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                      />
                    ) : isVideo(item.mimeType) ? (
                      <div className="flex h-full items-center justify-center">
                        <FileVideo className="h-6 w-6 text-blue-400" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-6 w-6 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {item.originalName}
                    </p>
                    {item.note && (
                      <p className="truncate text-xs text-gray-400">
                        {item.note}
                      </p>
                    )}
                  </div>
                  {item.sent ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-medium">Sent</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markSent.mutate({ ids: [item.id] })}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unscheduled items */}
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">
            Unscheduled Items ({unscheduledItems.length})
          </h3>

          {unscheduledItems.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-white py-12 text-center shadow-sm ring-1 ring-gray-200">
              <Check className="h-10 w-10 text-green-300" />
              <p className="mt-3 text-sm text-gray-500">
                All items are scheduled!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unscheduledItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {isImage(item.mimeType) ? (
                      <Image
                        src={item.s3Url}
                        alt={item.originalName}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                      />
                    ) : isVideo(item.mimeType) ? (
                      <div className="flex h-full items-center justify-center">
                        <FileVideo className="h-6 w-6 text-blue-400" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-6 w-6 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {item.originalName}
                    </p>
                    {item.note && (
                      <p className="truncate text-xs text-gray-400">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      assignToDate.mutate({
                        ids: [item.id],
                        sendDate: selectedDate,
                      });
                    }}
                    className="shrink-0 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
