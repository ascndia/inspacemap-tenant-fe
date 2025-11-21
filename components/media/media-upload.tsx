"use client";

import type React from "react";

import { Upload, FileImage, X, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { uploadMedia } from "@/lib/api";
import type { MediaItem } from "@/types/media";

interface MediaUploadProps {
  onUploadSuccess?: (media: MediaItem) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function MediaUpload({
  onUploadSuccess,
  accept = "image/*,video/*",
  maxSize = 50,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    const allowedTypes = accept.split(",").map((type) => type.trim());
    const isValidType = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
    if (!isValidType) {
      return `File type not supported. Allowed: ${accept}`;
    }
    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploadingFile(file);
    setUploadProgress(0);

    try {
      const media = await uploadMedia(file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadedMedia(media);
      setUploadingFile(null);
      onUploadSuccess?.(media);
    } catch (err) {
      setError("Upload failed. Please try again.");
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setUploadedMedia(null);
    setError(null);
    setUploadProgress(0);
    setUploadingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!uploadedMedia && !uploadingFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
          onClick={handleBrowseClick}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag & drop files or{" "}
                <span className="text-primary cursor-pointer">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, MP4 (max {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadingFile && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileImage className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">{uploadingFile.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {(uploadingFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      {uploadedMedia && (
        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{uploadedMedia.name}</p>
              <p className="text-xs text-muted-foreground">
                {uploadedMedia.size}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20 mt-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={reset} className="mt-2">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
