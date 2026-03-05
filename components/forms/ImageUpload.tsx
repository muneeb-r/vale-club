"use client";

import { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  storagePath: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  value,
  onUpload,
  storagePath,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("upload");

  async function handleFile(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(t("type_error"));
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t("size_error", { size: maxSizeMB }));
      return;
    }

    setError("");
    setUploading(true);

    const ext = file.name.split(".").pop();
    const fullPath = `${storagePath}-${Date.now()}.${ext}`;
    const storageRef = ref(storage, fullPath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        setProgress(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        );
      },
      (err) => {
        setError("Error al subir la imagen");
        setUploading(false);
        console.error(err);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onUpload(url);
        setUploading(false);
        setProgress(0);
      }
    );
  }

  return (
    <div className="space-y-3">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Vista previa"
          className="w-24 h-24 rounded-xl object-cover border border-border"
        />
      )}
      {!value && !uploading && (
        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border border-dashed border-border">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-full gap-2"
      >
        <Upload className="w-4 h-4" />
        {uploading
          ? t("uploading", { progress })
          : value
          ? t("change")
          : t("upload")}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
