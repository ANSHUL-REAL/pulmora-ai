"use client";

import { useEffect, useState } from "react";
import { Activity, Brain, ChartSpline } from "lucide-react";
import { fallbackMetrics } from "@/lib/site-data";
import { MetricsResponse } from "@/lib/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

function Curve({
  points,
  color
}: {
  points: number[];
  color: string;
}) {
  const width = 320;
  const height = 120;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * width;
      const y = height - ((point - min) / range) * (height - 12) - 6;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="curve-chart" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState<MetricsResponse>(fallbackMetrics);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiUrl}/metrics`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load metrics.");
        }

        const payload = (await response.json()) as MetricsResponse;
        setMetrics(payload);
      })
      .catch(() => {
        setMetrics(fallbackMetrics);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="metrics-section" id="metrics">
      <div className="section-heading">
        <span className="eyebrow">Model Insights</span>
        <h2>Performance metrics for learning and research.</h2>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <Activity size={18} />
          <span>Accuracy</span>
          <strong>{Math.round(metrics.accuracy * 100)}%</strong>
        </div>
        <div className="metric-card">
          <Brain size={18} />
          <span>Precision</span>
          <strong>{Math.round(metrics.precision * 100)}%</strong>
        </div>
        <div className="metric-card">
          <ChartSpline size={18} />
          <span>Recall</span>
          <strong>{Math.round(metrics.recall * 100)}%</strong>
        </div>
      </div>

      <div className="insight-panels">
        <div className="panel-card">
          <h3>Confusion Matrix</h3>
          <div className="confusion-grid">
            <div className="confusion-cell">
              <span>Normal {"->"} Correct</span>
              <strong>{metrics.confusion_matrix[0]?.[0] ?? 0}</strong>
            </div>
            <div className="confusion-cell">
              <span>Normal {"->"} Misclassified</span>
              <strong>{metrics.confusion_matrix[0]?.[1] ?? 0}</strong>
            </div>
            <div className="confusion-cell">
              <span>Pneumonia {"->"} Misclassified</span>
              <strong>{metrics.confusion_matrix[1]?.[0] ?? 0}</strong>
            </div>
            <div className="confusion-cell">
              <span>Pneumonia {"->"} Correct</span>
              <strong>{metrics.confusion_matrix[1]?.[1] ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Loss Curves</h3>
          <Curve points={metrics.training_curves.train_loss} color="#5be0bf" />
          <Curve points={metrics.training_curves.val_loss} color="#e7dcc5" />
        </div>

        <div className="panel-card">
          <h3>Accuracy Curves</h3>
          <Curve
            points={metrics.training_curves.train_accuracy}
            color="#84f1d2"
          />
          <Curve
            points={metrics.training_curves.val_accuracy}
            color="#9cbf6b"
          />
        </div>
      </div>
    </section>
  );
}
