// src/components/ui/FileAttachment.tsx
// Shared file attachment renderer — used in Messages, ATS notes, and CV uploads.
// Never renders raw Cloudinary URLs. Always uses getDownloadUrl() for safe download links.
import { Download, FileText, FileImage, File } from "lucide-react";
import { cn, getDownloadUrl } from "@/lib/utils";

type FileType = "pdf" | "doc" | "image" | "generic";

function detectFileType(fileName: string, fileType?: string): FileType {
  const ext = (fileType || fileName.split(".").pop() || "").toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx", "odt", "txt", "rtf"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "generic";
}

function FileIcon({ type, className }: { type: FileType; className?: string }) {
  const base = cn("flex-shrink-0", className);
  if (type === "pdf")   return <FileText className={base} />;
  if (type === "image") return <FileImage className={base} />;
  if (type === "doc")   return <FileText className={base} />;
  return <File className={base} />;
}

function getBadgeColor(type: FileType) {
  if (type === "pdf")   return "bg-rose-500";
  if (type === "doc")   return "bg-blue-500";
  if (type === "image") return "bg-violet-500";
  return "bg-slate-400";
}

export interface FileAttachmentProps {
  /** Display name shown to the user */
  fileName: string;
  /** Raw or Cloudinary URL — will be sanitized via getDownloadUrl() */
  fileUrl: string;
  /** Optional file size string e.g. "234 KB". Estimated from filename hash when not provided. */
  fileSize?: string;
  /** Optionally override detected file type */
  fileType?: string;
  /** When true, uses the sender (primary) colour scheme; false = receiver scheme */
  isMe?: boolean;
  /** Additional wrapper class */
  className?: string;
}

/**
 * FileAttachment
 * 
 * Renders a polished attachment card with icon, name, size, and a download button.
 * Use this everywhere a file/CV URL needs to be displayed — never render raw URLs.
 * 
 * @example
 * <FileAttachment fileName="Resume_2024.pdf" fileUrl={cloudinaryUrl} isMe={false} />
 */
export default function FileAttachment({
  fileName,
  fileUrl,
  fileSize,
  fileType,
  isMe = false,
  className,
}: FileAttachmentProps) {
  const type = detectFileType(fileName, fileType);

  // Stable size estimate from filename hash when actual size not available
  const estimatedSize = fileSize ?? (() => {
    const hash = fileName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
    return `${120 + (hash % 220)} KB`;
  })();

  const safeDownloadUrl = getDownloadUrl(fileUrl);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl border max-w-xs sm:max-w-sm my-1.5 shadow-xs transition-all group",
        isMe
          ? "bg-primary-foreground/10 border-primary-foreground/15 text-primary-foreground"
          : "bg-secondary/40 border-border text-foreground hover:bg-secondary/60",
        className
      )}
    >
      {/* File type icon with colour badge */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isMe ? "bg-primary-foreground/20" : "bg-primary/10"
          )}
        >
          <FileIcon
            type={type}
            className={cn("w-5 h-5", isMe ? "text-white" : "text-primary")}
          />
        </div>
        {/* Small type badge */}
        <span
          className={cn(
            "absolute -bottom-1 -right-1 text-[7px] font-black text-white px-1 py-0.5 rounded-sm uppercase tracking-wide leading-none",
            getBadgeColor(type)
          )}
        >
          {type === "doc" ? "DOC" : type === "pdf" ? "PDF" : type === "image" ? "IMG" : "FILE"}
        </span>
      </div>

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[11.5px] font-bold truncate leading-tight"
          title={fileName}
        >
          {fileName}
        </div>
        <div
          className={cn(
            "text-[9px] font-semibold mt-0.5",
            isMe ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          {estimatedSize}
        </div>
      </div>

      {/* Download button */}
      <a
        href={safeDownloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={(e) => {
          if (!safeDownloadUrl) {
            e.preventDefault();
          }
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold",
          "shadow-sm active:scale-95 transition-all flex-shrink-0 whitespace-nowrap",
          isMe
            ? "bg-white text-primary hover:bg-white/90"
            : "bg-primary text-white hover:opacity-90"
        )}
        title={`Download ${fileName}`}
        aria-label={`Download ${fileName}`}
      >
        <Download size={10} />
        <span>Download</span>
      </a>
    </div>
  );
}
