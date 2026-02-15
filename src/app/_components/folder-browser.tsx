"use client";

import { useState } from "react";
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { api } from "~/trpc/react";

interface FolderBrowserProps {
  onSelectFolder: (id: number) => void;
}

export function FolderBrowser({ onSelectFolder }: FolderBrowserProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingIn, setCreatingIn] = useState<number | null | "root">(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const utils = api.useUtils();

  const { data: allFolders, isLoading } = api.folder.getTree.useQuery();

  const createFolder = api.folder.create.useMutation({
    onSuccess: () => {
      void utils.folder.getTree.invalidate();
      void utils.folder.getAll.invalidate();
      setNewFolderName("");
      setCreatingIn(null);
    },
  });

  const renameFolder = api.folder.rename.useMutation({
    onSuccess: () => {
      void utils.folder.getTree.invalidate();
      void utils.folder.getAll.invalidate();
      setRenamingId(null);
      setRenameValue("");
    },
  });

  const deleteFolder = api.folder.delete.useMutation({
    onSuccess: () => {
      void utils.folder.getTree.invalidate();
      void utils.folder.getAll.invalidate();
    },
  });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const rootFolders = allFolders?.filter((f) => f.parentId === null) ?? [];

  const getChildren = (parentId: number) =>
    allFolders?.filter((f) => f.parentId === parentId) ?? [];

  const renderFolder = (folder: { id: number; name: string; parentId: number | null }, depth: number) => {
    const children = getChildren(folder.id);
    const isExpanded = expandedIds.has(folder.id);
    const isRenaming = renamingId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {children.length > 0 ? (
            <button
              onClick={() => toggleExpand(folder.id)}
              className="shrink-0"
            >
              <ChevronRight
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
          ) : (
            <span className="w-4" />
          )}

          <FolderOpen className="h-5 w-5 shrink-0 text-violet-500" />

          {isRenaming ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 rounded border border-violet-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameValue.trim()) {
                    renameFolder.mutate({ id: folder.id, name: renameValue.trim() });
                  }
                  if (e.key === "Escape") {
                    setRenamingId(null);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (renameValue.trim()) {
                    renameFolder.mutate({ id: folder.id, name: renameValue.trim() });
                  }
                }}
                className="rounded p-1 hover:bg-green-100"
              >
                <Check className="h-3.5 w-3.5 text-green-600" />
              </button>
              <button
                onClick={() => setRenamingId(null)}
                className="rounded p-1 hover:bg-gray-200"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onSelectFolder(folder.id)}
                className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-violet-600"
              >
                {folder.name}
              </button>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    setCreatingIn(folder.id);
                    setNewFolderName("");
                  }}
                  className="rounded p-1 hover:bg-violet-100"
                  title="New subfolder"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-violet-500" />
                </button>
                <button
                  onClick={() => {
                    setRenamingId(folder.id);
                    setRenameValue(folder.name);
                  }}
                  className="rounded p-1 hover:bg-blue-100"
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5 text-blue-500" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete folder "${folder.name}"?`)) {
                      deleteFolder.mutate({ id: folder.id });
                    }
                  }}
                  className="rounded p-1 hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Create subfolder input */}
        {creatingIn === folder.id && (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ paddingLeft: `${(depth + 1) * 24 + 12}px` }}
          >
            <FolderPlus className="h-4 w-4 text-violet-400" />
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 rounded border border-violet-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolder.mutate({
                    name: newFolderName.trim(),
                    parentId: folder.id,
                  });
                }
                if (e.key === "Escape") {
                  setCreatingIn(null);
                }
              }}
            />
            <button
              onClick={() => {
                if (newFolderName.trim()) {
                  createFolder.mutate({
                    name: newFolderName.trim(),
                    parentId: folder.id,
                  });
                }
              }}
              className="rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
            >
              Create
            </button>
            <button
              onClick={() => setCreatingIn(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Children */}
        {isExpanded &&
          children.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Folders</h2>
          <p className="mt-1 text-sm text-gray-500">
            Organize your media into folders
          </p>
        </div>
        <button
          onClick={() => {
            setCreatingIn("root");
            setNewFolderName("");
          }}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {/* Create root folder input */}
        {creatingIn === "root" && (
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <FolderPlus className="h-5 w-5 text-violet-400" />
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 rounded border border-violet-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolder.mutate({ name: newFolderName.trim() });
                }
                if (e.key === "Escape") {
                  setCreatingIn(null);
                }
              }}
            />
            <button
              onClick={() => {
                if (newFolderName.trim()) {
                  createFolder.mutate({ name: newFolderName.trim() });
                }
              }}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              Create
            </button>
            <button
              onClick={() => setCreatingIn(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          </div>
        )}

        {!isLoading && rootFolders.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No folders yet</p>
            <p className="text-xs text-gray-400">
              Create a folder to organize your media
            </p>
          </div>
        )}

        <div className="py-2">
          {rootFolders.map((folder) => renderFolder(folder, 0))}
        </div>
      </div>
    </div>
  );
}
