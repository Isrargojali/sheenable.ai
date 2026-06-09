import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropAvatarProps {
  avatarUrl: string;
  firstName: string;
  lastName: string;
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  error?: string;
}

export function DragDropAvatar({
  avatarUrl,
  firstName,
  lastName,
  onFileSelect,
  isUploading,
  error,
}: DragDropAvatarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      onFileSelect(files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer",
          isDragging
            ? "border-rose-400 bg-rose-50"
            : "border-[#E8E1F0] hover:border-rose-300 hover:bg-rose-50/50"
        )}
      >
        <div className="text-center py-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
              {firstName[0]}
              {lastName[0]}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#3D3656]">
              {isDragging ? "Drop photo here" : "Drag photo here"}
            </p>
            <p className="text-xs text-[#A89EC0]">or click to select</p>
            <p className="text-[10px] text-[#C4BEDD] mt-2">
              Professional photo • Max 3MB • JPG or PNG
            </p>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#E8E1F0] text-xs font-semibold text-[#6B6480]">
            <Upload size={12} />
            {isUploading ? "Uploading…" : "Select Photo"}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            onClick={e => e.stopPropagation()}
          />
        </div>

        {/* Click handler for the whole area */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 rounded-2xl"
          aria-label="Upload photo"
        />
      </div>

      {/* AI Tip */}
      <div className="flex gap-2 p-3 bg-purple-50 border border-purple-100 rounded-lg">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-xs font-semibold text-purple-900">Pro Tip</p>
          <p className="text-[11px] text-purple-700 mt-0.5">
            Profiles with professional photos get 3x more employer views
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
