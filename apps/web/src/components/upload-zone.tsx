"use client";

import { useRef, useState, useCallback } from "react";
import { gsap } from "gsap";

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  const handleMouseEnter = useCallback(() => {
    if (zoneRef.current) {
      gsap.to(zoneRef.current, {
        scale: 1.01,
        duration: 0.2,
        ease: "power1.out",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (zoneRef.current) {
      gsap.to(zoneRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power1.out",
      });
    }
  }, []);

  return (
    <div
      ref={zoneRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={[
        "border-2 border-dashed rounded-lg py-12 px-6",
        "flex flex-col items-center gap-3 cursor-pointer",
        "transition-colors duration-200",
        dragging
          ? "border-foreground bg-muted"
          : "border-border hover:border-foreground/40",
      ].join(" ")}
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="text-sm font-medium">
        {dragging ? "Drop image here" : "Upload an image"}
      </div>
      <p className="text-xs text-muted-foreground">
        JPG, PNG, WEBP &middot; Max 10MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
