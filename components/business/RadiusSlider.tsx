"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface RadiusSliderProps {
  initialValue: number;
  onCommit: (km: number) => void;
}

export default function RadiusSlider({ initialValue, onCommit }: RadiusSliderProps) {
  const [display, setDisplay] = useState(initialValue);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">1 km</span>
        <span className="text-xs font-semibold text-foreground tabular-nums">
          {display} km
        </span>
        <span className="text-xs text-muted-foreground">100 km</span>
      </div>
      <Slider
        key={initialValue}
        min={1}
        max={100}
        step={1}
        defaultValue={[initialValue || 10]}
        onValueChange={(v) => setDisplay(v[0])}
        onValueCommit={(v) => onCommit(v[0])}
      />
    </div>
  );
}
