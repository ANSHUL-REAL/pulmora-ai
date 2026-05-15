"use client";

import { Sparkle } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

type Point = {
  x: number;
  y: number;
};

type MouseSparklesProps = {
  starAnimationDuration?: number;
  minimumTimeBetweenStars?: number;
  minimumDistanceBetweenStars?: number;
  glowDuration?: number;
  maximumGlowPointSpacing?: number;
  colors?: string[];
  sizes?: string[];
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]) {
  return items[rand(0, items.length - 1)];
}

function calcDistance(a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MouseSparkles({
  starAnimationDuration = 1400,
  minimumTimeBetweenStars = 220,
  minimumDistanceBetweenStars = 72,
  glowDuration = 100,
  maximumGlowPointSpacing = 12,
  colors = ["119 223 195", "230 222 200"],
  sizes = ["1rem", "0.82rem", "0.64rem"]
}: MouseSparklesProps) {
  const enabledRef = useRef(false);
  const lastRef = useRef({
    starTimestamp: 0,
    starPosition: { x: 0, y: 0 },
    mousePosition: { x: 0, y: 0 }
  });
  const counterRef = useRef(0);

  const createStar = useCallback(
    (position: Point) => {
      const wrapper = document.createElement("div");
      const color = pick(colors);
      const size = pick(sizes);
      const animationIndex = counterRef.current++ % 3;

      wrapper.className = "mouse-sparkles-star";
      wrapper.style.left = `${position.x}px`;
      wrapper.style.top = `${position.y}px`;
      wrapper.style.fontSize = size;
      wrapper.style.color = `rgb(${color})`;
      wrapper.style.textShadow = `0 0 18px rgb(${color} / 0.35)`;
      wrapper.style.animationName = `mouse-sparkle-fall-${animationIndex + 1}`;
      wrapper.style.animationDuration = `${starAnimationDuration}ms`;

      document.body.appendChild(wrapper);

      const root = createRoot(wrapper);
      root.render(<Sparkle className="h-full w-full" strokeWidth={1.8} />);

      window.setTimeout(() => {
        root.unmount();
        wrapper.remove();
      }, starAnimationDuration);
    },
    [colors, sizes, starAnimationDuration]
  );

  const createGlowPoint = useCallback(
    (position: Point) => {
      const glow = document.createElement("div");
      glow.className = "mouse-sparkles-glow-point";
      glow.style.left = `${position.x}px`;
      glow.style.top = `${position.y}px`;
      document.body.appendChild(glow);

      window.setTimeout(() => {
        glow.remove();
      }, glowDuration);
    },
    [glowDuration]
  );

  const createGlow = useCallback(
    (last: Point, current: Point) => {
      const distance = calcDistance(last, current);
      const quantity = Math.max(
        Math.floor(distance / maximumGlowPointSpacing),
        1
      );

      const dx = (current.x - last.x) / quantity;
      const dy = (current.y - last.y) / quantity;

      for (let index = 0; index < quantity; index += 1) {
        createGlowPoint({
          x: last.x + dx * index,
          y: last.y + dy * index
        });
      }
    },
    [createGlowPoint, maximumGlowPointSpacing]
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    enabledRef.current = finePointer.matches && !reduceMotion.matches;

    const syncEnabled = () => {
      enabledRef.current = finePointer.matches && !reduceMotion.matches;
    };

    const handleMove = (x: number, y: number) => {
      if (!enabledRef.current) {
        return;
      }

      const mousePosition = { x, y };

      if (
        lastRef.current.mousePosition.x === 0 &&
        lastRef.current.mousePosition.y === 0
      ) {
        lastRef.current.mousePosition = mousePosition;
      }

      const now = Date.now();
      const movedFarEnough =
        calcDistance(lastRef.current.starPosition, mousePosition) >=
        minimumDistanceBetweenStars;
      const waitedLongEnough =
        now - lastRef.current.starTimestamp >= minimumTimeBetweenStars;

      if (movedFarEnough || waitedLongEnough) {
        createStar(mousePosition);
        lastRef.current.starTimestamp = now;
        lastRef.current.starPosition = mousePosition;
      }

      createGlow(lastRef.current.mousePosition, mousePosition);
      lastRef.current.mousePosition = mousePosition;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }
      handleMove(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const resetMouse = () => {
      lastRef.current.mousePosition = { x: 0, y: 0 };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.body.addEventListener("mouseleave", resetMouse);
    finePointer.addEventListener("change", syncEnabled);
    reduceMotion.addEventListener("change", syncEnabled);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      document.body.removeEventListener("mouseleave", resetMouse);
      finePointer.removeEventListener("change", syncEnabled);
      reduceMotion.removeEventListener("change", syncEnabled);
    };
  }, [
    createGlow,
    createStar,
    maximumGlowPointSpacing,
    minimumDistanceBetweenStars,
    minimumTimeBetweenStars
  ]);

  return null;
}
