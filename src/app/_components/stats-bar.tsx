"use client";

import { ImageIcon, Send, Clock } from "lucide-react";
import { api } from "~/trpc/react";

export function StatsBar() {
  const { data: stats } = api.media.getStats.useQuery();

  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5 text-gray-600">
        <ImageIcon className="h-4 w-4 text-violet-500" />
        <span className="font-medium">{stats.total}</span>
        <span className="hidden sm:inline">total</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-600">
        <Send className="h-4 w-4 text-green-500" />
        <span className="font-medium">{stats.sent}</span>
        <span className="hidden sm:inline">sent</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-600">
        <Clock className="h-4 w-4 text-amber-500" />
        <span className="font-medium">{stats.pending}</span>
        <span className="hidden sm:inline">pending</span>
      </div>
    </div>
  );
}
