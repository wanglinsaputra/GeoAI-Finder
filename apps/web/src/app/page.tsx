"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { UploadZone } from "@/components/upload-zone";
import { ResultPanel } from "@/components/result-panel";
import { gsap } from "gsap";
import type { AnalyzeDetailResponse } from "@geoai/shared";

const MapView = dynamic(() => import("@/components/map-view").then((m) => ({ default: m.MapView })), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type PageState = "idle" | "uploading" | "processing" | "result" | "error";

export default function Home() {
  const [state, setState] = useState<PageState>("idle");
  const [result, setResult] = useState<AnalyzeDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const pollResult = useCallback(async (id: string) => {
    const maxAttempts = 30;
    const interval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, interval));

      try {
        const res = await fetch(`${API_URL}/api/analyze/${id}`);
        if (!res.ok) continue;

        const data: AnalyzeDetailResponse = await res.json();

        if (data.status === "completed") {
          setResult(data);
          setState("result");
          return;
        }

        if (data.status === "failed") {
          setError(data.error || "Analysis failed");
          setState("error");
          return;
        }
      } catch {
        // retry
      }
    }

    setError("Analysis timed out. Try again.");
    setState("error");
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      setState("uploading");
      setError(null);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/api/analyze`, {
          method: "POST",
          body: formData,
        });

        if (res.status === 429) {
          setError("Too many requests. Wait a moment.");
          setState("error");
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Upload failed");
          setState("error");
          return;
        }

        const { id } = await res.json();
        setState("processing");

        pollResult(id);
      } catch {
        setError("Connection error. Check server.");
        setState("error");
      }
    },
    [pollResult]
  );

  const handleReset = useCallback(() => {
    setState("idle");
    setResult(null);
    setAnalysisId(null);
    setError(null);
  }, []);

  return (
    <div
      ref={mainRef}
      className="min-h-screen flex flex-col"
    >
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-foreground" />
            <span className="text-sm font-medium tracking-tight">
              GeoAI Finder
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            AI Photo Geolocation
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-12 md:py-20">
        <div className="max-w-2xl w-full text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Find where a photo was taken
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Upload an image and GeoAI will analyze visual clues, landmarks,
            and metadata to determine its location.
          </p>
        </div>

        <div className="w-full max-w-md mx-auto">
          {state === "idle" && <UploadZone onUpload={handleUpload} />}

          {state === "uploading" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          )}

          {state === "processing" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Analyzing image...
              </p>
              <p className="text-xs text-muted-foreground/60">
                Checking EXIF, visual clues, landmarks
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg">!</span>
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={handleReset}
                className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {state === "result" && result && (
            <div ref={resultRef} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium tracking-tight">
                  Location found
                </h2>
                <button
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analyze another
                </button>
              </div>
              <ResultPanel result={result} />
              {result?.location && (
                <div className="h-64 md:h-80 -mx-2">
                  <MapView
                    latitude={result.location.latitude}
                    longitude={result.location.longitude}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            GeoAI Finder &mdash; Images are never stored permanently
          </span>
          <span className="text-xs text-muted-foreground">
            Powered by Wanglin
          </span>
        </div>
      </footer>
    </div>
  );
}
