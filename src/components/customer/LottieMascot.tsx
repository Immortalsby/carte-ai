"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";

export type MascotState = "idle" | "talking" | "thinking" | "happy" | "concerned";

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;

interface LottieMascotProps {
  state: MascotState;
  size?: number;
  onClick?: () => void;
  className?: string;
  animationData: object | null;
}

/**
 * Lottie mascot with drag + pinch-to-zoom.
 *
 * Markers: "idle", "talking", "thinking", "happy", "concerned"
 */
function LottieMascotInner({
  state,
  size = 110,
  onClick,
  className = "",
  animationData,
}: LottieMascotProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });

  // Pinch-to-zoom state
  const [scale, setScale] = useState(1);
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });

  // ─── Segment playback ───
  useEffect(() => {
    const instance = lottieRef.current;
    if (!instance || !animationData) return;

    const anim = instance.animationItem;
    if (!anim) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markers = (anim as any).markers as { cm: string; tm: number; dr: number }[] | undefined;
    if (markers && markers.length > 0) {
      const marker = markers.find((m) => m.cm === state);
      if (marker) {
        instance.playSegments([marker.tm, marker.tm + marker.dr], true);
        return;
      }
    }

    const total = anim.totalFrames ?? 150;
    const segLen = Math.floor(total / 5);
    const stateIdx = { idle: 0, talking: 1, thinking: 2, happy: 3, concerned: 4 }[state];
    instance.playSegments([stateIdx * segLen, (stateIdx + 1) * segLen], true);
  }, [state, animationData]);

  // ─── Drag (pointer events) ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" && e.isPrimary === false) return; // let pinch handle multi-touch
    const d = dragRef.current;
    d.dragging = true;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.origX = pos.x;
    d.origY = pos.y;
    d.moved = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setPos({ x: d.origX + dx, y: d.origY + dy });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    d.dragging = false;
    // Only fire onClick if we didn't drag
    if (!d.moved) onClick?.();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [onClick]);

  // ─── Pinch-to-zoom (touch events) ───
  const getTouchDist = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchRef.current = {
        active: true,
        startDist: getTouchDist(e.touches),
        startScale: scale,
      };
    }
  }, [scale]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const p = pinchRef.current;
    if (!p.active || e.touches.length < 2) return;
    e.preventDefault();
    const dist = getTouchDist(e.touches);
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, p.startScale * (dist / p.startDist)));
    setScale(newScale);
  }, []);

  const onTouchEnd = useCallback(() => {
    pinchRef.current.active = false;
  }, []);

  const currentSize = size * scale;

  if (!animationData) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-carte-surface border border-carte-border shadow-lg ${className}`}
        style={{ width: size, height: size }}
        aria-label="AI Assistant"
      >
        <span className="text-3xl" role="img" aria-hidden="true">
          🍽️
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`cursor-grab touch-none select-none active:cursor-grabbing ${className}`}
      style={{
        width: currentSize,
        height: currentSize,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        willChange: "transform",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="button"
      tabIndex={0}
      aria-label="AI Assistant"
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop
        autoplay
        style={{ width: currentSize, height: currentSize, pointerEvents: "none" }}
      />
    </div>
  );
}

export const LottieMascot = memo(LottieMascotInner);
