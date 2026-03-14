import { useRef, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

function EditableYear({
  value,
  min,
  max,
  onChange,
  align,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  align: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  function open() {
    setDraft(String(value));
    setEditing(true);
  }

  function commit() {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= min && n <= max) onChange(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`w-10 text-xs bg-transparent border-b border-primary outline-none tabular-nums text-foreground p-0 ${align === "right" ? "text-right" : "text-left"}`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") open(); }}
      title="Click to edit"
      className={`text-xs text-muted-foreground tabular-nums cursor-text hover:text-foreground transition-colors select-none w-10 shrink-0 border-b border-transparent ${align === "right" ? "text-right" : "text-left"}`}
    >
      {value}
    </span>
  );
}

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (v: [number, number]) => void;
}

export function YearRangeSlider({ min, max, value, onValueChange }: Props) {
  const [start, end] = value;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startS: number; startE: number } | null>(null);
  const [isDraggingRange, setIsDraggingRange] = useState(false);

  function yearToRatio(y: number) {
    return (y - min) / (max - min);
  }

  function onPointerDownCapture(e: React.PointerEvent<HTMLDivElement>) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const ratio = (e.clientX - rect.left) / rect.width;
    const leftRatio = yearToRatio(start);
    const rightRatio = yearToRatio(end);
    // Exclude ~10px around each thumb so they still drag independently
    const thumbFraction = 10 / rect.width;

    if (ratio > leftRatio + thumbFraction && ratio < rightRatio - thumbFraction) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = { startX: e.clientX, startS: start, startE: end };
      setIsDraggingRange(true);
      wrapperRef.current?.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pixelsPerYear = rect.width / (max - min);
    const delta = Math.round((e.clientX - dragState.current.startX) / pixelsPerYear);
    const range = dragState.current.startE - dragState.current.startS;

    let newS = dragState.current.startS + delta;
    let newE = dragState.current.startE + delta;

    if (newS < min) { newS = min; newE = min + range; }
    if (newE > max) { newE = max; newS = max - range; }

    onValueChange([newS, newE]);
  }

  function onPointerUp() {
    dragState.current = null;
    setIsDraggingRange(false);
  }

  return (
    <div className="flex items-center gap-3 px-1 w-full">
      <EditableYear
        value={start}
        min={min}
        max={end - 1}
        onChange={(v) => onValueChange([v, end])}
        align="right"
      />
      <div
        ref={wrapperRef}
        className={`flex-1 ${isDraggingRange ? "cursor-grabbing" : ""}`}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Slider
          min={min}
          max={max}
          step={1}
          value={[start, end]}
          onValueChange={onValueChange}
        />
      </div>
      <EditableYear
        value={end}
        min={start + 1}
        max={max}
        onChange={(v) => onValueChange([start, v])}
        align="left"
      />
    </div>
  );
}
