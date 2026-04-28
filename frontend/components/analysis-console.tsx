"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUpload } from "@ark-ui/react/file-upload";
import { AlertCircle, LoaderCircle, Sparkles, User } from "lucide-react";
import { PredictionResponse } from "@/lib/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const supportedTypes = ["image/jpeg", "image/png"];
const maxFileSize = 6 * 1024 * 1024;

export default function AnalysisConsole() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const heatmapSource = useMemo(() => {
    if (!result) {
      return "";
    }

    if (result.heatmap_base64) {
      return `data:image/png;base64,${result.heatmap_base64}`;
    }

    if (result.heatmap_url) {
      return result.heatmap_url.startsWith("http")
        ? result.heatmap_url
        : `${apiUrl}${result.heatmap_url}`;
    }

    return "";
  }, [result]);

  const currentImage = showHeatmap && heatmapSource ? heatmapSource : previewUrl;

  const handleFileChange = (nextFile: File | null) => {
    setError("");
    setResult(null);
    setShowHeatmap(false);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!supportedTypes.includes(nextFile.type)) {
      setError("Please upload a JPG or PNG chest X-ray image.");
      return;
    }

    if (nextFile.size > maxFileSize) {
      setError("Please keep the upload below 6 MB for a smoother demo.");
      return;
    }

    setFile(nextFile);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setShowHeatmap(false);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Choose a chest X-ray image before running analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(payload?.detail ?? "Prediction failed.");
      }

      const payload = (await response.json()) as PredictionResponse;
      setResult(payload);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to contact the inference service.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-console" id="analysis">
      <div className="console-header">
        <span className="eyebrow">Interactive Analysis</span>
        <h2>Upload a chest X-ray image and explore how the model interprets it.</h2>
        <p>
          Disclaimer: Pulmora AI is intended for educational purposes only and
          is not a medical diagnostic tool.
        </p>
      </div>

      <FileUpload.Root
        accept="image/png,image/jpeg"
        maxFiles={1}
        className="upload-root"
        onFileAccept={(details) =>
          handleFileChange(details.files[0] ?? null)
        }
        onFileReject={() =>
          setError("Please upload a JPG or PNG chest X-ray image.")
        }
      >
        <FileUpload.Context>
          {({ acceptedFiles }) => (
            <div className="upload-dropzone">
              <div className="upload-head">
                <div className="upload-preview-frame">
                  {acceptedFiles.length > 0 && previewUrl ? (
                    <img
                      alt="Selected chest X-ray preview"
                      className="upload-preview-image"
                      src={previewUrl}
                    />
                  ) : (
                    <User size={18} />
                  )}
                </div>

                <div className="upload-copy">
                  <span>
                    {acceptedFiles.length > 0
                      ? acceptedFiles[0].name
                      : "Select a chest X-ray image (JPG/PNG)"}
                  </span>
                  <small>Images are processed temporarily and not stored.</small>
                </div>

                <FileUpload.Trigger className="upload-trigger">
                  {acceptedFiles.length > 0 ? "Change image" : "Upload image"}
                </FileUpload.Trigger>
              </div>

              {acceptedFiles.length > 0 ? (
                <FileUpload.ItemGroup className="upload-item-group">
                  <FileUpload.Item
                    file={acceptedFiles[0]}
                    className="upload-item-row"
                  >
                    <FileUpload.ItemName className="upload-item-name" />
                    <FileUpload.ItemDeleteTrigger asChild>
                      <button
                        className="upload-remove"
                        type="button"
                        onClick={clearFile}
                      >
                        Remove
                      </button>
                    </FileUpload.ItemDeleteTrigger>
                  </FileUpload.Item>
                </FileUpload.ItemGroup>
              ) : null}
            </div>
          )}
        </FileUpload.Context>
        <FileUpload.HiddenInput />
      </FileUpload.Root>

      <div className="console-actions">
        <button
          className="primary-button"
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Analyzing
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Analyze Image
            </>
          )}
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={() => setShowHeatmap((current) => !current)}
          disabled={!result || !heatmapSource}
        >
          {showHeatmap ? "Show Original" : "Show Heatmap"}
        </button>
      </div>

      {error ? (
        <div className="notice error-notice" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="analysis-grid">
        <div className="image-stage">
          {currentImage ? (
            <img
              alt={showHeatmap ? "Grad-CAM heatmap overlay" : "Uploaded chest X-ray"}
              src={currentImage}
            />
          ) : (
            <div className="image-placeholder">
              <span>Analysis Preview</span>
            </div>
          )}
        </div>

        <div className="results-card">
          <div className="result-row">
            <span>Prediction</span>
            <strong>{result?.prediction ?? "Awaiting analysis"}</strong>
          </div>
          <div className="result-row">
            <span>Confidence</span>
            <strong>
              {result ? `${Math.round(result.confidence * 100)}%` : "--"}
            </strong>
          </div>
          <div className="result-row">
            <span>Overlay</span>
            <strong>{heatmapSource ? "Available" : "Pending"}</strong>
          </div>
          <p className="result-footnote">
            The heatmap highlights regions influencing the model's prediction.
            It is an interpretability aid and does not guarantee correctness.
          </p>
        </div>
      </div>
    </div>
  );
}
