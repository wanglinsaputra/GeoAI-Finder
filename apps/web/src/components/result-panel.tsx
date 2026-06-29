"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import type { AnalyzeDetailResponse } from "@geoai/shared";

interface ResultPanelProps {
  result: AnalyzeDetailResponse;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current.children,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }
  }, [result]);

  if (!result.location) return null;

  const confidencePct = Math.round((result.confidence ?? 0) * 100);

  return (
    <div ref={panelRef} className="space-y-4">
      {/* Location */}
      <div className="rounded-lg border border-border p-4">
        <div className="text-xs text-muted-foreground mb-1">Location</div>
        <div className="text-lg font-medium tracking-tight">
          {result.location.city}, {result.location.country}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {result.location.region}
        </div>
      </div>

      {/* Coordinates + Confidence */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Coordinates
          </div>
          <div className="text-sm font-mono">
            {result.location.latitude.toFixed(4)},{" "}
            {result.location.longitude.toFixed(4)}
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Confidence
          </div>
          <div className="text-sm font-mono">{confidencePct}%</div>
        </div>
      </div>

      {/* Clues */}
      {result.clues && result.clues.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground mb-2">
            Visual Clues
          </div>
          <div className="space-y-1.5">
            {result.clues.map((clue, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-muted-foreground mt-0.5 shrink-0">
                  &bull;
                </span>
                <div>
                  <span className="font-medium">{clue.category}:</span>{" "}
                  <span className="text-muted-foreground">
                    {clue.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {result.explanation && (
        <div className="rounded-lg border border-border p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Analysis
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
