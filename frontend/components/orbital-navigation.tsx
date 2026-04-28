"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Layers3,
  ScanSearch,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { OrbitalNode } from "@/lib/types";

type Props = {
  items: OrbitalNode[];
};

const iconMap = {
  scan: ScanSearch,
  sparkles: Sparkles,
  activity: Activity,
  shield: ShieldAlert,
  layers: Layers3
};

export default function OrbitalNavigation({ items }: Props) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [viewportWidth, setViewportWidth] = useState<number>(1280);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    if (viewportWidth <= 720) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRotationAngle((current) => (current + 0.2) % 360);
    }, 40);

    return () => window.clearInterval(timer);
  }, [viewportWidth]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [activeId, items]
  );

  const radius = useMemo(() => {
    if (viewportWidth <= 720) {
      return 102;
    }
    if (viewportWidth <= 1024) {
      return 132;
    }
    return 160;
  }, [viewportWidth]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <section className="orbital-section">
      <div className="section-heading">
        <span className="eyebrow">Feature Map</span>
        <h2>Navigate the system as a structured pipeline of decisions.</h2>
      </div>

      <div className="orbital-layout">
        <div className="orbital-stage" aria-label="Pulmora AI interactive feature map">
          <div className="orbital-core">
            <div className="orbital-core-ring" />
            <div className="orbital-core-ring delayed" />
            <div className="orbital-core-pulse" />
          </div>
          <div className="orbital-track" />

          {items.map((item, index) => {
            const angle = ((index / items.length) * 360 + rotationAngle) % 360;
            const radians = (angle * Math.PI) / 180;
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;
            const Icon = iconMap[item.icon];
            const isActive = item.id === activeId;

            return (
              <button
                key={item.id}
                type="button"
                className={`orbital-node ${isActive ? "active" : ""}`}
                style={{
                  transform: `translate(${x}px, ${y}px)`
                }}
                onClick={() => {
                  setActiveId(item.id);
                  scrollToSection(item.sectionId);
                }}
              >
                <span className="orbital-node-glow" />
                <span className="orbital-node-icon">
                  <Icon size={18} />
                </span>
                <span className="orbital-node-label">{item.title}</span>
              </button>
            );
          })}
        </div>

        {activeItem ? (
          <article className="orbital-card">
            <span className="orbital-category">{activeItem.category}</span>
            <h3>{activeItem.title}</h3>
            <p>{activeItem.detail}</p>

            <div className="energy-row">
              <span>Energy</span>
              <strong>{activeItem.energy}%</strong>
            </div>
            <div className="energy-bar">
              <span style={{ width: `${activeItem.energy}%` }} />
            </div>

            <div className="link-row">
              {activeItem.links.map((linkedId) => {
                const linked = items.find((item) => item.id === linkedId);
                if (!linked) {
                  return null;
                }

                return (
                  <button
                    key={linked.id}
                    type="button"
                    className="link-chip"
                    onClick={() => {
                      setActiveId(linked.id);
                      scrollToSection(linked.sectionId);
                    }}
                  >
                    {linked.title}
                  </button>
                );
              })}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
