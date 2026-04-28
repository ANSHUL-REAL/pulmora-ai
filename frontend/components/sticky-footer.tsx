"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail
} from "lucide-react";

type FooterLink = {
  title: string;
  href: string;
};

type FooterLinkGroup = {
  label: string;
  links: FooterLink[];
};

const socialLinks = [
  { title: "Website", href: "#", icon: Globe },
  { title: "GitHub", href: "https://github.com/ANSHUL-REAL", icon: Github },
  {
    title: "LinkedIn",
    href: "https://www.linkedin.com/in/anshul-nautiyal-42760236b/",
    icon: Linkedin
  },
  { title: "Instagram", href: "https://youtu.be/dQw4w9WgXcQ", icon: Instagram },
  { title: "Email", href: "mailto:anshulnautiyal0512@gmail.com", icon: Mail }
];

const footerLinkGroups: FooterLinkGroup[] = [
  {
    label: "Platform",
    links: [
      { title: "Interactive Analysis", href: "#analysis" },
      { title: "Explainability", href: "#analysis" },
      { title: "Model Insights", href: "#metrics" },
      { title: "Risks & Limitations", href: "#risks" },
      { title: "Future Enhancements", href: "#future" }
    ]
  },
  {
    label: "Workflow",
    links: [
      { title: "Upload Image", href: "#analysis" },
      { title: "Run Prediction", href: "#analysis" },
      { title: "Toggle Heatmap", href: "#analysis" },
      { title: "Review Metrics", href: "#metrics" },
      { title: "Interpret Responsibly", href: "#risks" }
    ]
  },
  {
    label: "Resources",
    links: [
      { title: "PRD", href: "#" },
      { title: "SRS", href: "#" },
      { title: "Model Metadata", href: "#metrics" },
      { title: "Grad-CAM Overview", href: "#analysis" },
      { title: "Educational Disclaimer", href: "#analysis" }
    ]
  },
  {
    label: "About",
    links: [
      { title: "Educational Use Only", href: "#analysis" },
      { title: "Portfolio Demo", href: "#" },
      { title: "Research Sandbox", href: "#" },
      { title: "Privacy Approach", href: "#analysis" },
      { title: "Contact", href: "mailto:anshulnautiyal0512@gmail.com" }
    ]
  }
];

function AnimatedContainer({
  children,
  className,
  delay = 0.1
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ filter: "blur(4px)", y: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

export default function StickyFooter() {
  return (
    <footer
      className="sticky-footer"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="sticky-footer-fixed">
        <div className="sticky-footer-inner">
          <div className="sticky-footer-surface">
            <div aria-hidden className="sticky-footer-glow">
              <div className="sticky-footer-blob blob-one" />
              <div className="sticky-footer-blob blob-two" />
              <div className="sticky-footer-blob blob-three" />
            </div>

            <div className="sticky-footer-grid">
              <AnimatedContainer className="sticky-footer-brand">
                <div className="sticky-footer-badge">Pulmora AI</div>
                <p>
                  Explainable chest imaging intelligence for educational demos, AI
                  learning, and responsible experimentation with chest X-ray
                  workflows.
                </p>
                <div className="sticky-footer-socials">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.title}
                        href={link.href}
                        className="sticky-footer-social"
                        aria-label={link.title}
                      >
                        <Icon size={16} />
                      </a>
                    );
                  })}
                </div>
              </AnimatedContainer>

              {footerLinkGroups.map((group, index) => (
                <AnimatedContainer
                  key={group.label}
                  delay={0.14 + index * 0.08}
                  className="sticky-footer-column"
                >
                  <h3>{group.label}</h3>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.title}>
                        <a href={link.href}>{link.title}</a>
                      </li>
                    ))}
                  </ul>
                </AnimatedContainer>
              ))}
            </div>

            <div className="sticky-footer-bottom">
              <p>&copy; 2026 Pulmora AI. Educational chest imaging experience.</p>
              <p>For learning and research only.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
