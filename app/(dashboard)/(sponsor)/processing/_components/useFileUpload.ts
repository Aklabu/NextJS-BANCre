import { useState, useCallback } from "react";
import { toast } from "sonner";

export type FileItem = {
  id: string;
  name: string;
  file: File;
  size: number;
};

export type ImageItem =
  | {
      id: string;
      name: string;
      source: "place";
      url: string;
    }
  | {
      id: string;
      name: string;
      source: "upload";
      file: File;
    };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".xlsx",
  ".xls",
  ".csv",
  ".pptx",
  ".ppt",
  ".docx",
  ".doc",
];

export const useFileUpload = (maxFiles: number = 20) => {
  const [files, setFiles] = useState<FileItem[]>([]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > MAX_FILE_SIZE) {
        return `'${file.name}' exceeds 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
      }

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `'${file.name}' has unsupported type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
      }

      return null;
    },
    []
  );

  const addFiles = useCallback(
    (newFiles: File[], currentImageCount: number = 0) => {
      const validFiles: FileItem[] = [];
      const errors: string[] = [];

      newFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
          return;
        }

        validFiles.push({
          id: `file-${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          file,
          size: file.size,
        });
      });

      if (errors.length > 0) {
        toast.error(errors.join("\n"), { duration: 5000 });
      }

      if (validFiles.length > 0) {
        setFiles((prev) => {
          const merged = [...prev, ...validFiles];
          const unique = merged.filter(
            (doc, index, arr) => index === arr.findIndex((d) => d.id === doc.id)
          );

          const totalFiles = currentImageCount + unique.length;
          if (totalFiles > maxFiles) {
            toast.error(`Maximum ${maxFiles} total files allowed`);
            return prev;
          }

          return unique;
        });
      }
    },
    [validateFile, maxFiles]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
  };
};

export const useImageUpload = (maxImages: number = 6, placePhotos?: string[]) => {
  const getInitialImages = (): ImageItem[] => {
    if (!placePhotos) return [];
    return placePhotos.slice(0, maxImages).map((photo, index) => ({
      id: `place-${index}-${photo}`,
      name: `Fetched image ${index + 1}`,
      source: "place" as const,
      url: photo,
    }));
  };

  const [images, setImages] = useState<ImageItem[]>(getInitialImages);

  const addImages = useCallback(
    (newFiles: File[]) => {
      const imageFiles = newFiles.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please upload image files only.");
        return;
      }

      setImages((prev) => {
        const uploadItems: ImageItem[] = imageFiles.map((file) => ({
          id: `upload-${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          source: "upload" as const,
          file,
        }));

        const merged = [...prev, ...uploadItems];
        const unique = merged.filter(
          (image, index, arr) => index === arr.findIndex((item) => item.id === image.id)
        );

        if (unique.length > maxImages) {
          toast.error(`You can upload up to ${maxImages} images.`);
        }

        return unique.slice(0, maxImages);
      });
    },
    [maxImages]
  );

  const removeImage = useCallback((imageId: string) => {
    setImages((prev) => prev.filter((image) => image.id !== imageId));
  }, []);

  const getPlacePhotoUrls = useCallback((): string[] => {
    return images
      .filter((img): img is Extract<ImageItem, { source: "place" }> => img.source === "place")
      .map((img) => img.url);
  }, [images]);

  const getUploadedFiles = useCallback((): File[] => {
    return images
      .filter((img): img is Extract<ImageItem, { source: "upload" }> => img.source === "upload")
      .map((img) => img.file);
  }, [images]);

  return {
    images,
    addImages,
    removeImage,
    getPlacePhotoUrls,
    getUploadedFiles,
  };
};
