"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/image";

const MAX_FILE_SIZE_IN_BYTES = 10 * 1024 * 1024;

function getValidationError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Formato não suportado. Envie uma imagem JPG, PNG ou WEBP.";
  }
  if (file.size > MAX_FILE_SIZE_IN_BYTES) {
    return "A imagem deve ter no máximo 10MB.";
  }
  return null;
}

interface ImageUploaderProps {
  onFileChange: (file: File | null) => void;
}

export function ImageUploader({ onFileChange }: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(file: File | undefined) {
    if (!file) return;

    const validationError = getValidationError(file);
    setErrorMessage(validationError);
    if (validationError) return;

    setPreviewUrl(URL.createObjectURL(file));
    onFileChange(file);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  function removeImage() {
    setPreviewUrl(null);
    setErrorMessage(null);
    onFileChange(null);
  }

  const dropZoneClassName = isDragging
    ? "border-emerald-500 bg-emerald-50"
    : "border-zinc-300 hover:border-zinc-400";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleInputChange}
        className="peer sr-only"
      />

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative h-80 overflow-hidden rounded-lg bg-zinc-100">
            <Image
              src={previewUrl}
              alt="Pré-visualização do recibo"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              Trocar imagem
            </button>
            <button
              type="button"
              onClick={removeImage}
              className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex h-48 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 ${dropZoneClassName}`}
        >
          <span className="pointer-events-none text-sm font-medium">
            Arraste a imagem aqui ou clique para selecionar
          </span>
          <span className="pointer-events-none text-xs text-zinc-500">
            JPG, PNG ou WEBP até 10MB
          </span>
        </label>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
