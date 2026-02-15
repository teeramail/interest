"use client";

import { useState } from "react";
import { Upload, FolderOpen, Calendar, BarChart3, Heart, BookOpen } from "lucide-react";
import { MediaGallery } from "./media-gallery";
import { UploadPanel } from "./upload-panel";
import { FolderBrowser } from "./folder-browser";
import { DailyPlanner } from "./daily-planner";
import { StatsBar } from "./stats-bar";
import { StudyCards } from "./study-cards";

type Tab = "gallery" | "upload" | "folders" | "planner" | "study-cards";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("gallery");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 shadow-lg shadow-violet-200">
                <Heart className="h-5 w-5 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Varit</h1>
                <p className="text-xs text-gray-500">Media for your kid</p>
              </div>
            </div>
            <StatsBar />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-gray-200/60 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            {[
              { id: "gallery" as Tab, label: "Gallery", icon: FolderOpen },
              { id: "upload" as Tab, label: "Upload", icon: Upload },
              { id: "folders" as Tab, label: "Folders", icon: FolderOpen },
              { id: "planner" as Tab, label: "Daily Planner", icon: Calendar },
              { id: "study-cards" as Tab, label: "Study Cards", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-100 text-violet-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === "gallery" && (
          <MediaGallery
            folderId={currentFolderId}
            onFolderChange={setCurrentFolderId}
          />
        )}
        {activeTab === "upload" && (
          <UploadPanel
            currentFolderId={currentFolderId}
            onUploadComplete={() => setActiveTab("gallery")}
          />
        )}
        {activeTab === "folders" && (
          <FolderBrowser
            onSelectFolder={(id) => {
              setCurrentFolderId(id);
              setActiveTab("gallery");
            }}
          />
        )}
        {activeTab === "planner" && <DailyPlanner />}
        {activeTab === "study-cards" && <StudyCards />}
      </main>
    </div>
  );
}
