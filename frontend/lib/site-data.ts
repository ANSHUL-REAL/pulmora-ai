import { MetricsResponse, OrbitalNode } from "@/lib/types";

export const fallbackMetrics: MetricsResponse = {
  accuracy: 0.912,
  precision: 0.896,
  recall: 0.934,
  confusion_matrix: [
    [186, 14],
    [11, 189]
  ],
  training_curves: {
    epochs: [1, 2, 3, 4, 5, 6, 7, 8],
    train_loss: [0.69, 0.52, 0.39, 0.31, 0.25, 0.21, 0.19, 0.17],
    val_loss: [0.71, 0.57, 0.43, 0.35, 0.31, 0.28, 0.27, 0.26],
    train_accuracy: [0.58, 0.69, 0.78, 0.83, 0.87, 0.9, 0.92, 0.94],
    val_accuracy: [0.56, 0.67, 0.76, 0.82, 0.85, 0.88, 0.9, 0.91]
  }
};

export const orbitalNodes: OrbitalNode[] = [
  {
    id: "analyze",
    title: "Analyze",
    category: "Inference",
    detail: "Run inference on uploaded images and review the model's prediction confidence.",
    energy: 94,
    sectionId: "analysis",
    icon: "scan",
    links: ["explainability", "metrics"]
  },
  {
    id: "explainability",
    title: "Explainability",
    category: "Grad-CAM",
    detail: "Visualize model attention using Grad-CAM to inspect which regions influenced the output.",
    energy: 88,
    sectionId: "analysis",
    icon: "sparkles",
    links: ["analyze", "metrics"]
  },
  {
    id: "metrics",
    title: "Model Insights",
    category: "Evaluation",
    detail: "Evaluate performance metrics, confusion balance, and training behavior from model metadata.",
    energy: 81,
    sectionId: "metrics",
    icon: "activity",
    links: ["analyze", "risks"]
  },
  {
    id: "risks",
    title: "Risks",
    category: "Limitations",
    detail: "Understand the model's limitations, dataset bias, and interpretation risks before trusting outputs.",
    energy: 67,
    sectionId: "risks",
    icon: "shield",
    links: ["metrics", "future"]
  },
  {
    id: "future",
    title: "Future Enhancements",
    category: "Roadmap",
    detail: "Explore upcoming capabilities such as multi-disease detection, PDF reporting, and guided interpretation.",
    energy: 72,
    sectionId: "future",
    icon: "layers",
    links: ["risks", "analyze"]
  }
];
