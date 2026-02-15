"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  BookOpen,
  Star,
  CheckCircle2,
  Play,
  X,
  Edit,
  Trash2,
  Save,
  Upload,
  ImageIcon,
  Paperclip,
  FileText,
  FileVideo,
  Download,
  Loader2,
  Grid3x3,
  List,
  Folder,
  ClipboardPaste,
} from "lucide-react";
import { api } from "~/trpc/react";
import { format } from "date-fns";

export function StudyCards() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showCompleted, setShowCompleted] = useState<boolean | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);

  const utils = api.useUtils();

  const { data: cardsData, isLoading } = api.studyCards.getAll.useQuery({
    search: search || undefined,
    category: selectedCategory || undefined,
    difficulty: selectedDifficulty || undefined,
    isCompleted: showCompleted,
    limit: 50,
  });

  const { data: categories } = api.studyCards.getCategories.useQuery();
  const { data: stats } = api.studyCards.getStats.useQuery();

  const createCard = api.studyCards.create.useMutation({
    onSuccess: () => {
      void utils.studyCards.getAll.invalidate();
      void utils.studyCards.getStats.invalidate();
      setShowCreateForm(false);
    },
  });

  const updateCard = api.studyCards.update.useMutation({
    onSuccess: () => {
      void utils.studyCards.getAll.invalidate();
      void utils.studyCards.getStats.invalidate();
      setEditingCard(null);
    },
  });

  const deleteCard = api.studyCards.delete.useMutation({
    onSuccess: () => {
      void utils.studyCards.getAll.invalidate();
      void utils.studyCards.getStats.invalidate();
    },
  });

  const uploadImage = api.studyCards.uploadImage.useMutation();

  const setImage = api.studyCards.setImage.useMutation();

  const items = cardsData?.items ?? [];

  const handleImageUpload = async (cardId: number, file: File) => {
    const result = await uploadImage.mutateAsync({
      fileName: file.name,
      contentType: file.type,
    });

    const response = await fetch(result.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (response.ok) {
      await setImage.mutateAsync({
        id: cardId,
        s3Key: result.s3Key,
        imageUrl: result.publicUrl,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Cards</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create educational cards with videos and images
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <BookOpen className="h-4 w-4 text-violet-500" />
              <span className="font-medium">{stats?.total ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">{stats?.completed ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{stats?.avgRating ?? "0.0"}</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            New Card
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          onClick={() => {
            if (showCompleted === undefined) setShowCompleted(false);
            else if (showCompleted === false) setShowCompleted(true);
            else setShowCompleted(undefined);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showCompleted === undefined
              ? "bg-gray-100 text-gray-700"
              : showCompleted
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {showCompleted === undefined
            ? "All Status"
            : showCompleted
            ? "Completed"
            : "Pending"}
        </button>
        <div className="flex items-center rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-violet-100 text-violet-700" : "text-gray-500"}`}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-violet-100 text-violet-700" : "text-gray-500"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateCardForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={(data) => createCard.mutate(data)}
          isSubmitting={createCard.isPending}
        />
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
          <BookOpen className="h-16 w-16 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">No study cards yet</p>
          <p className="text-sm text-gray-400">Create your first educational card</p>
        </div>
      )}

      {/* Cards Grid/List */}
      {items.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {items.map((card) => (
            <StudyCard
              key={card.id}
              card={card}
              viewMode={viewMode}
              isEditing={editingCard === card.id}
              onEdit={() => setEditingCard(card.id)}
              onSave={(data) => updateCard.mutate({ id: card.id, ...data })}
              onDelete={() => {
                if (confirm("Delete this study card?")) {
                  deleteCard.mutate({ id: card.id });
                }
              }}
              onCancel={() => setEditingCard(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StudyCardProps {
  card: any;
  viewMode: "grid" | "list";
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
  onCancel: () => void;
}

function StudyCard({
  card,
  viewMode,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}: StudyCardProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [youtubeUrl, setYoutubeUrl] = useState(card.youtubeUrl ?? "");
  const [category, setCategory] = useState(card.category ?? "");
  const [difficulty, setDifficulty] = useState(card.difficulty ?? "medium");
  const [tags, setTags] = useState(card.tags ?? "");
  const [notes, setNotes] = useState(card.notes ?? "");
  const [isCompleted, setIsCompleted] = useState(card.isCompleted);
  const [rating, setRating] = useState(card.rating ?? 0);

  // Parse attachments
  const attachments: Attachment[] = card.attachments ? JSON.parse(card.attachments) : [];

  const handleSave = () => {
    onSave({
      title,
      description,
      youtubeUrl: youtubeUrl || undefined,
      category: category || undefined,
      difficulty,
      tags: tags || undefined,
      notes: notes || undefined,
      isCompleted,
      rating: rating || undefined,
    });
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const embedUrl = card.youtubeUrl ? getYoutubeEmbedUrl(card.youtubeUrl) : null;

  if (isEditing) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-2 ring-violet-500">
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-medium focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="YouTube URL (optional)..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category..."
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal notes..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-gray-700">Completed</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-amber-400 hover:text-amber-500"
                >
                  {star <= rating ? (
                    <Star className="h-4 w-4 fill-current" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        {card.imageUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={card.imageUrl}
              alt={card.title}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-gray-900">{card.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {card.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                {card.category && <span>{card.category}</span>}
                <span className="capitalize">{card.difficulty}</span>
                {card.tags && <span>{card.tags}</span>}
                <span>{format(new Date(card.createdAt), "MMM d")}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {card.isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {card.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-gray-600">
                    {card.rating}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {card.youtubeUrl && (
            <a
              href={card.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            >
              <Play className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
      {/* Header with actions */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white"
        >
          <Edit className="h-3.5 w-3.5 text-gray-600" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      </div>

      {/* Status badges */}
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
        {card.isCompleted && (
          <div className="rounded-full bg-green-500 p-1">
            <CheckCircle2 className="h-3 w-3 text-white" />
          </div>
        )}
        {card.rating > 0 && (
          <div className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-amber-700">
              {card.rating}
            </span>
          </div>
        )}
      </div>

      {/* Image or Video */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gray-100">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={card.title}
            className="h-full w-full"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-rose-50">
            <BookOpen className="h-12 w-12 text-violet-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{card.title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{card.description}</p>

        {/* Tags and metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {card.category && (
            <span className="rounded-full bg-violet-100 px-2 py-1 font-medium text-violet-700">
              {card.category}
            </span>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600 capitalize">
            {card.difficulty}
          </span>
          {card.youtubeUrl && (
            <a
              href={card.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 font-medium text-red-700 hover:bg-red-200"
            >
              <Play className="h-3 w-3" />
              Video
            </a>
          )}
        </div>

        {/* Tags */}
        {card.tags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {card.tags.split(",").map((tag: string, idx: number) => (
              <span
                key={idx}
                className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2">
            <p className="mb-1 text-xs font-medium text-gray-500">Attachments:</p>
            <div className="space-y-1">
              {attachments.map((att: Attachment) => {
                const Icon = getAttachmentIcon(att.mimeType);
                return (
                  <a
                    key={att.s3Key}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded bg-white px-2 py-1 text-xs hover:bg-violet-50"
                  >
                    <Icon className="h-3 w-3 text-violet-500" />
                    <span className="flex-1 truncate text-gray-700">{att.originalName}</span>
                    <span className="text-gray-400">{formatFileSize(att.fileSize)}</span>
                    <Download className="h-3 w-3 text-gray-400" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {card.notes && (
          <div className="mt-3 rounded-lg bg-amber-50 p-2">
            <p className="text-xs text-amber-800 italic">{card.notes}</p>
          </div>
        )}

        {/* Date */}
        <p className="mt-3 text-xs text-gray-400">
          {format(new Date(card.createdAt), "MMM d, yyyy")}
        </p>
      </div>
    </div>
  );
}

interface Attachment {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  url: string;
  subfolder?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideo;
  return FileText;
}

interface CreateCardFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

function CreateCardForm({ onClose, onSubmit, isSubmitting }: CreateCardFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [subfolder, setSubfolder] = useState("study-cards/images");

  const [cardImage, setCardImage] = useState<{ s3Key: string; imageUrl: string; subfolder: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentSubfolder, setAttachmentSubfolder] = useState("study-cards/attachments");

  // Handle clipboard paste
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!pasteMode) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          await uploadImageFile(file);
        }
      }
    }
    setPasteMode(false);
  }, [pasteMode]);

  useEffect(() => {
    if (pasteMode) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [handlePaste, pasteMode]);

  const uploadImageFile = async (file: File) => {
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subfolder", subfolder);

      const res = await fetch("/api/upload-card-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = (await res.json()) as { s3Key: string; imageUrl: string; subfolder: string; originalSize: number; compressedSize: number };
      setCardImage({ s3Key: data.s3Key, imageUrl: data.imageUrl, subfolder: data.subfolder });
    } catch {
      setImagePreview(null);
      alert("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImageFile(file);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAttachmentUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subfolder", attachmentSubfolder);

        const res = await fetch("/api/upload-attachment", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = (await res.json()) as Attachment;
        setAttachments((prev) => [...prev, data]);
      }
    } catch {
      alert("Attachment upload failed");
    } finally {
      setAttachmentUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim() || undefined,
      imageUrl: cardImage?.imageUrl,
      imageS3Key: cardImage?.s3Key,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
      category: category.trim() || undefined,
      difficulty,
      tags: tags.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Create Study Card</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
          </div>

          {/* Card Image Upload with Subfolder & Clipboard Paste */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Image
              <span className="ml-1 text-xs font-normal text-gray-400">(auto-compressed to WebP &lt; 100KB)</span>
            </label>
            
            {/* Subfolder Input */}
            <div className="mb-2 flex items-center gap-2">
              <Folder className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={subfolder}
                onChange={(e) => setSubfolder(e.target.value)}
                placeholder="Folder path (e.g., study-cards/math)"
                className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            {imagePreview ?? cardImage ? (
              <div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
                <div className="relative aspect-video bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardImage?.imageUrl ?? imagePreview ?? ""}
                    alt="Card preview"
                    className="h-full w-full object-cover"
                  />
                  {imageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCardImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 transition-colors hover:border-violet-400 hover:bg-violet-50/50">
                  <ImageIcon className="h-5 w-5" />
                  Click to upload card image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPasteMode(true)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-colors ${
                    pasteMode 
                      ? "border-violet-500 bg-violet-50 text-violet-700" 
                      : "border-gray-300 text-gray-500 hover:border-violet-400 hover:bg-violet-50/50"
                  }`}
                >
                  <ClipboardPaste className="h-5 w-5" />
                  {pasteMode ? "Press Ctrl+V to paste image" : "Click then paste image (Ctrl+V)"}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube URL
            </label>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              type="url"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Attachments Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
              <span className="ml-1 text-xs font-normal text-gray-400">(PDF, Word, images, videos — original quality)</span>
            </label>
            
            {/* Attachment Subfolder Input */}
            <div className="mb-2 flex items-center gap-2">
              <Folder className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={attachmentSubfolder}
                onChange={(e) => setAttachmentSubfolder(e.target.value)}
                placeholder="Folder path for attachments"
                className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            {attachments.length > 0 && (
              <div className="mb-2 space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
                {attachments.map((att, idx) => {
                  const Icon = getAttachmentIcon(att.mimeType);
                  return (
                    <div
                      key={att.s3Key}
                      className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-violet-500" />
                      <span className="min-w-0 flex-1 truncate text-gray-700">
                        {att.originalName}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {formatFileSize(att.fileSize)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="shrink-0 rounded p-0.5 hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm text-gray-500 transition-colors hover:border-violet-400 hover:bg-violet-50/50">
              {attachmentUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Paperclip className="h-5 w-5" />
                  Click to attach files
                </>
              )}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentUpload}
                disabled={attachmentUploading}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Science, Math, History"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your personal notes or teaching points..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || imageUploading || attachmentUploading || !title.trim() || !description.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
