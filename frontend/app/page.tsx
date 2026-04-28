import AnimatedHero from "@/components/animated-hero";
import MetricsPanel from "@/components/metrics-panel";
import OrbitalNavigation from "@/components/orbital-navigation";
import ShaderBackground from "@/components/shader-background";
import ScrollStory from "@/components/scroll-story";
import StickyFooter from "@/components/sticky-footer";
import { orbitalNodes } from "@/lib/site-data";

export default function Home() {
  return (
    <main className="page-shell">
      <ShaderBackground />

      <header className="topbar">
        <div>
          <small>Explainable chest imaging demo</small>
        </div>
        <a href="#analysis" className="topbar-link">
          Open Analyzer
        </a>
      </header>

      <AnimatedHero />
      <ScrollStory />
      <OrbitalNavigation items={orbitalNodes} />
      <MetricsPanel />

      <section className="text-section" id="risks">
        <div className="section-heading">
          <span className="eyebrow">Risks &amp; Limitations</span>
          <h2>
            Pulmora AI should be used as a learning tool, not a source of
            medical decisions.
          </h2>
        </div>
        <div className="text-card-grid">
          <article className="panel-card">
            <h3>Model Limitations</h3>
            <p>
              Predictions may be incorrect, particularly on data outside the
              training distribution.
            </p>
          </article>
          <article className="panel-card">
            <h3>Dataset Bias</h3>
            <p>
              Imbalances in data sources, imaging conditions, or annotations can
              affect results.
            </p>
          </article>
          <article className="panel-card">
            <h3>Interpretation Risks</h3>
            <p>
              Heatmaps indicate model attention, not clinical proof.
            </p>
          </article>
        </div>
      </section>

      <section className="text-section" id="future">
        <div className="section-heading">
          <span className="eyebrow">Future Enhancements</span>
          <h2>Planned improvements to extend system capability.</h2>
        </div>
        <div className="text-card-grid">
          <article className="panel-card">
            <h3>Multi-Disease Detection</h3>
            <p>
              Expand beyond binary classification to support broader chest
              pathology exploration.
            </p>
          </article>
          <article className="panel-card">
            <h3>PDF Reporting</h3>
            <p>
              Generate exportable educational summaries that pair prediction,
              confidence, and explanation visuals.
            </p>
          </article>
          <article className="panel-card">
            <h3>Guided Interpretation</h3>
            <p>
              Add conversational guidance that explains the output in plain
              language for learners.
            </p>
          </article>
        </div>
      </section>

      <StickyFooter />
    </main>
  );
}
