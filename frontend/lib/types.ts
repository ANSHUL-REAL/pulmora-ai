export type PredictionResponse = {
  prediction: "Normal" | "Pneumonia";
  confidence: number;
  heatmap_url?: string | null;
  heatmap_base64?: string | null;
};

export type MetricsResponse = {
  accuracy: number;
  precision: number;
  recall: number;
  confusion_matrix: number[][];
  training_curves: {
    epochs: number[];
    train_loss: number[];
    val_loss: number[];
    train_accuracy: number[];
    val_accuracy: number[];
  };
};

export type OrbitalNode = {
  id: string;
  title: string;
  category: string;
  detail: string;
  energy: number;
  sectionId: string;
  icon: "scan" | "sparkles" | "activity" | "shield" | "layers";
  links: string[];
};
