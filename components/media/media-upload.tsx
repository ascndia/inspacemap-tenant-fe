"use client";

import type React from "react";

import { Upload, FileImage, X, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { mediaService } from "@/lib/services/media-service";
import type { MediaItem } from "@/types/media";

interface MediaUploadProps {
  onUploadSuccess?: (media: MediaItem[]) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
}

export function MediaUpload({
  onUploadSuccess,
  accept = "image/*,video/*",
  maxSize = 50,
  multiple = true,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<
    Map<string, { file: File; progress: number }>
  >(new Map());
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const addFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    const uploadPromises = selectedFiles.map(async (file, index) => {
      const fileId = `${file.name}-${index}`;
      setUploadingFiles(
        (prev) => new Map(prev.set(fileId, { file, progress: 0 }))
      );

      try {
        // Determine category based on file type
        let category: "panorama" | "icon" | "floorplan" = "panorama";
        if (file.type.startsWith("image/")) {
          // For now, treat all images as panoramas. This could be enhanced with user selection
          category = "panorama";
        }

        const media = await mediaService.uploadFile(
          file,
          category,
          (progress) => {
            setUploadingFiles((prev) => {
              const newMap = new Map(prev);
              const current = newMap.get(fileId);
              if (current) {
                newMap.set(fileId, { ...current, progress });
              }
              return newMap;
            });
          }
        );

        setUploadedMedia((prev) => [...prev, media]);
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });

        return media;
      } catch (err) {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
        throw err;
      }
    });

    try {
      const uploadedItems = await Promise.all(uploadPromises);
      onUploadSuccess?.(uploadedItems);
      setSelectedFiles([]);
      setIsUploading(false);
    } catch (err) {
      setError("Some files failed to upload. Please try again.");
      setIsUploading(false);
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
      addFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setSelectedFiles([]);
    setUploadedMedia([]);
    setUploadingFiles(new Map());
    setError(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalProgress =
    uploadingFiles.size > 0
      ? Array.from(uploadingFiles.values()).reduce(
          (sum, { progress }) => sum + progress,
          0
        ) / uploadingFiles.size
      : 0;

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Area */}
      {selectedFiles.length === 0 && uploadedMedia.length === 0 && (
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
                Drag & drop {multiple ? "files" : "a file"} or{" "}
                <span className="text-primary cursor-pointer">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, MP4 (max {maxSize}MB each)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload All"}
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => {
              const fileId = `${file.name}-${index}`;
              const uploadStatus = uploadingFiles.get(fileId);

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20"
                >
                  <FileImage className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    {uploadStatus && (
                      <div className="mt-1">
                        <Progress
                          value={uploadStatus.progress}
                          className="h-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadStatus.progress}% uploaded
                        </p>
                      </div>
                    )}
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Progress */}
          {isUploading && uploadingFiles.size > 0 && (
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">
                  Uploading {uploadingFiles.size} of {selectedFiles.length}{" "}
                  files
                </span>
              </div>
              <Progress value={totalProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(totalProgress)}% complete
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedMedia.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Uploaded Files ({uploadedMedia.length})
          </h4>
          <div className="space-y-2">
            {uploadedMedia.map((media, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{media.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(media.file_size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={reset}>
              Upload More Files
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
