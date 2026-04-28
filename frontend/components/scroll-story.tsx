"use client";

import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  Brain,
  Microscope,
  ScanSearch,
  Shield,
  Sparkles
} from "lucide-react";
import { useRef } from "react";

type WordProps = {
  word: string;
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
};

type TokenProps = {
  label: string;
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
};

const headlineLines = [
  ["Scroll", "to", "follow"],
  ["the", "model"],
  ["reasoning", "pipeline"]
];

const headlineWords = headlineLines.flat();

const featureTokens = [
  { label: "Upload", icon: ScanSearch },
  { label: "Predict", icon: Brain },
  { label: "Explain", icon: Sparkles },
  { label: "Measure", icon: Activity },
  { label: "Interpret", icon: Microscope },
  { label: "Review", icon: Shield }
];

function AnimatedWord({
  word,
  index,
  centerIndex,
  scrollYProgress
}: WordProps) {
  const distance = index - centerIndex;
  const x = useTransform(scrollYProgress, [0, 0.55], [distance * 66, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.55], [distance * 18, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.55], [0.15, 0.55, 1]);

  return (
    <motion.span className="story-word" style={{ x, rotateX, opacity }}>
      {word}
    </motion.span>
  );
}

function AnimatedToken({
  label,
  index,
  centerIndex,
  scrollYProgress
}: TokenProps) {
  const distance = index - centerIndex;
  const x = useTransform(scrollYProgress, [0, 0.55], [distance * 72, 0]);
  const y = useTransform(
    scrollYProgress,
    [0, 0.55],
    [Math.abs(distance) * 34 + 22, 0]
  );
  const rotate = useTransform(scrollYProgress, [0, 0.55], [distance * 12, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.55], [0.82, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.55], [0.12, 0.5, 1]);

  const Icon = featureTokens[index].icon;

  return (
    <motion.div className="story-token" style={{ x, y, rotate, scale, opacity }}>
      <Icon size={16} />
      <span>{label}</span>
    </motion.div>
  );
}

export default function ScrollStory() {
  const textRef = useRef<HTMLDivElement | null>(null);
  const tokensRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress: textProgress } = useScroll({
    target: textRef,
    offset: ["start 75%", "end 30%"]
  });
  const { scrollYProgress: tokenProgress } = useScroll({
    target: tokensRef,
    offset: ["start 75%", "end 35%"]
  });
  const { scrollYProgress: summaryProgress } = useScroll({
    target: summaryRef,
    offset: ["start 78%", "end 38%"]
  });

  const centerIndex = Math.floor(headlineWords.length / 2);
  const tokenCenterIndex = Math.floor(featureTokens.length / 2);
  const panelY = useTransform(summaryProgress, [0, 0.55], [80, 0]);
  const panelOpacity = useTransform(
    summaryProgress,
    [0, 0.25, 0.55],
    [0.15, 0.55, 1]
  );

  let wordIndex = 0;

  return (
    <section className="story-shell" aria-label="Pulmora AI scrolling narrative">
      <div className="story-hint">
        <span>Interpretability Flow</span>
      </div>

      <div ref={textRef} className="story-panel story-panel-text">
        <div className="story-stage" style={{ perspective: "560px" }}>
          {headlineLines.map((line, lineIndex) => (
            <div key={`line-${lineIndex}`} className="story-line">
              {line.map((word) => {
                const currentIndex = wordIndex++;
                return (
                  <AnimatedWord
                    key={`${word}-${currentIndex}`}
                    word={word}
                    index={currentIndex}
                    centerIndex={centerIndex}
                    scrollYProgress={textProgress}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div ref={tokensRef} className="story-panel story-panel-tokens">
        <div className="story-subhead">
          <span className="story-bracket">[</span>
          <p>Process Overview</p>
          <span className="story-bracket">]</span>
        </div>
        <div className="story-token-grid">
          {featureTokens.map((token, index) => (
            <AnimatedToken
              key={token.label}
              label={token.label}
              index={index}
              centerIndex={tokenCenterIndex}
              scrollYProgress={tokenProgress}
            />
          ))}
        </div>
      </div>

      <div ref={summaryRef} className="story-panel story-panel-summary">
        <motion.article
          className="story-summary-card"
          style={{ y: panelY, opacity: panelOpacity }}
        >
          <span className="eyebrow">Interpretability Flow</span>
          <h2>
            Scroll to follow the model&apos;s reasoning pipeline, from input
            image to final prediction.
          </h2>
          <p>
            This sequence reflects how Pulmora AI processes data in practice:
            image ingestion, inference, Grad-CAM visualization, evaluation, and
            responsible interpretation.
          </p>
        </motion.article>
      </div>
    </section>
  );
}
