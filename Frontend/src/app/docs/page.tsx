"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  Database,
  FileCode,
  FileText,
  FolderTree,
  Gauge,
  Layers,
  LayoutDashboard,
  Lock,
  Network,
  Radio,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import raamImg from "@/assets/Raam Prathap.png";
import kavineshImg from "@/assets/Kavinesh.png";
import santhoshImg from "@/assets/Santhosh.png";

// Table of Contents Section Items
const TOC_ITEMS = [
  { id: "hero", label: "Documentation Hero", icon: Sparkles },
  { id: "overview", label: "Project Overview", icon: BookOpen },
  { id: "features", label: "Key Features", icon: Layers },
  { id: "system-architecture", label: "System Architecture", icon: Cpu },
  { id: "deep-learning-architectures", label: "Deep Learning Architectures", icon: Network },
  { id: "data-flow", label: "Data & Analytics Flow", icon: TrendingUp },
  { id: "tech-stack", label: "Technology Stack", icon: Database },
  { id: "project-structure", label: "Project Structure", icon: FolderTree },
  { id: "getting-started", label: "Getting Started", icon: Terminal },
  { id: "meet-the-team", label: "Meet the Team", icon: Users },
  { id: "footer", label: "Glossia Reference", icon: FileText },
];

// Helper Component for Copyable Code Blocks
function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="docs-code-card">
      <div className="docs-code-header">
        <span className="docs-code-filename">
          {filename ? (
            <>
              <FileCode size={13} style={{ display: "inline", marginRight: 5, verticalAlign: -1 }} />
              {filename}
            </>
          ) : (
            "terminal"
          )}
        </span>
        <button className="docs-copy-btn" onClick={handleCopy} aria-label="Copy code">
          {copied ? (
            <>
              <Check size={12} color="#5eead4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="docs-code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [expandedArch, setExpandedArch] = useState<string | null>("transformer");

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const item = TOC_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="docs-page">
      {/* Top Header Navigation */}
      <header className="docs-topbar">
        <div className="docs-topbar-left">
          <Link href="/" className="docs-brand">
            <span className="brand-dot" />
            <span>Glossia</span>
            <span className="docs-badge">DOCUMENTATION v1.0</span>
          </Link>
        </div>
        <div className="docs-topbar-right">
          <Link href="/" className="docs-btn-back">
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </Link>
          <a href="#deep-learning-architectures" className="docs-btn-cta">
            <Cpu size={15} />
            <span>Architectures</span>
          </a>
        </div>
      </header>

      {/* Mobile Table of Contents Bar */}
      <div className="docs-mobile-toc-bar">
        <button
          className="docs-mobile-toc-btn"
          onClick={() => setMobileTocOpen(!mobileTocOpen)}
          aria-expanded={mobileTocOpen}
        >
          <BookOpen size={14} />
          <span>Table of Contents ({TOC_ITEMS.length} sections)</span>
          <ChevronDown size={14} style={{ transform: mobileTocOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
        </button>
        <span className="docs-badge">
          {TOC_ITEMS.find((item) => item.id === activeSection)?.label || "Overview"}
        </span>

        {mobileTocOpen && (
          <nav className="docs-mobile-toc-dropdown" aria-label="Mobile table of contents">
            {TOC_ITEMS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`docs-toc-link ${activeSection === id ? "active" : ""}`}
                onClick={() => setMobileTocOpen(false)}
              >
                <Icon size={14} className="docs-toc-icon" />
                <span>{label}</span>
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="docs-container">
        {/* Sticky Desktop Sidebar Table of Contents */}
        <aside className="docs-sidebar" aria-label="Documentation table of contents">
          <div className="docs-toc-title">
            <BookOpen size={13} />
            <span>Documentation Index</span>
          </div>
          <ul className="docs-toc-list">
            {TOC_ITEMS.map(({ id, label, icon: Icon }) => (
              <li key={id} className="docs-toc-item">
                <a
                  href={`#${id}`}
                  className={`docs-toc-link ${activeSection === id ? "active" : ""}`}
                >
                  <Icon size={15} className="docs-toc-icon" />
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 28, padding: "16px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--teal)" }}>
              Interactive Telemetry
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
              Glossia captures live caption streams, runs multi-tier deep learning fallbacks, and streams session telemetry to PostgreSQL.
            </p>
          </div>
        </aside>

        {/* Documentation Content Column */}
        <main className="docs-content">
          {/* ===================================================================
              1. HERO SECTION
              =================================================================== */}
          <section id="hero" className="docs-section">
            <div className="docs-hero">
              <div className="docs-hero-header">
                <span className="docs-section-tag">
                  <Sparkles size={12} />
                  <span>Accessibility Intelligence System</span>
                </span>
                <h1 className="docs-hero-title">
                  Glossia: Real-Time Sign Language Overlay & Analytics Platform
                </h1>
                <p className="docs-hero-subtitle">
                  An end-to-end accessibility platform combining client-side video & caption DOM detection,
                  a cascading sequence-to-sequence deep learning translation engine, 3D avatar gesture synthesis,
                  and a telemetry analytics dashboard for enterprise meetings and streaming media.
                </p>

                <div className="docs-hero-problem">
                  <strong>The Problem Glossia Solves</strong>
                  <p>
                    Over 430 million people worldwide experience disabling hearing loss. While video platforms offer
                    basic closed captions, reading continuous rolling subtitles creates severe cognitive fatigue. Text captions
                    lack the spatial grammar, directional verbs, and visual prosody inherent to sign language. Glossia detects
                    video streams across Google Meet, Microsoft Teams, and YouTube, seamlessly translating live dialogue into
                    ASL, BSL, ISL, and Auslan gestures through an animated 3D avatar—backed by a resilient multi-tier deep
                    learning fallback chain and comprehensive observability dashboard.
                  </p>
                </div>

                <div className="docs-hero-actions">
                  <a href="#deep-learning-architectures" className="docs-btn-primary">
                    <Cpu size={16} />
                    <span>Explore the architectures</span>
                  </a>
                  <a href="#meet-the-team" className="docs-btn-secondary">
                    <Users size={16} />
                    <span>Meet the team</span>
                  </a>
                  <Link href="/" className="docs-btn-secondary">
                    <LayoutDashboard size={16} />
                    <span>View Analytics Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* Visual Representation of Analytics, ML, & Data Flow */}
              <div className="docs-hero-visual">
                <div className="docs-terminal-bar">
                  <div className="docs-terminal-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="docs-terminal-title">glossia-runtime-telemetry :: session_active</span>
                  <span className="docs-badge" style={{ background: "#163a35", color: "#5eead4", borderColor: "#2dd4bf" }}>
                    LIVE INFERENCE
                  </span>
                </div>

                <div className="docs-terminal-body">
                  <div className="docs-terminal-col">
                    <h4>
                      <Radio size={13} />
                      <span>Live Caption & Model Fallback Stream</span>
                    </h4>

                    <div className="docs-stream-step">
                      <span className="docs-stream-num">1</span>
                      <div className="docs-stream-info">
                        <strong>DOM MutationObserver Ingestion</strong>
                        <span>Captured text: &quot;Quarterly sprint metrics exceeded internal target&quot;</span>
                        <div className="docs-stream-pill">Platform: Google Meet (WebRTC)</div>
                      </div>
                    </div>

                    <div className="docs-stream-step">
                      <span className="docs-stream-num">2</span>
                      <div className="docs-stream-info">
                        <strong>Sign Dictionary Check &amp; Fallback Trigger</strong>
                        <span>Lookup in sigmlData.json &rarr; 3 consecutive OOV misses detected</span>
                        <div className="docs-stream-pill" style={{ background: "#382319", color: "#fca5a5" }}>
                          Triggering POST /api/text-to-sign
                        </div>
                      </div>
                    </div>

                    <div className="docs-stream-step">
                      <span className="docs-stream-num">3</span>
                      <div className="docs-stream-info">
                        <strong>Model Cascade: TransformerSeq2Seq Evaluated</strong>
                        <span>Self-Attention over English tokens &rarr; emitted gloss sequence</span>
                        <div className="docs-stream-pill">
                          Glosses: [&quot;QUARTER&quot;, &quot;SPRINT&quot;, &quot;METRIC&quot;, &quot;GROWTH&quot;]
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="docs-terminal-col">
                    <h4>
                      <Activity size={13} />
                      <span>Real-Time Telemetry &amp; System Health</span>
                    </h4>

                    <div className="docs-terminal-metrics">
                      <div className="docs-terminal-kpi">
                        <span>Signs Rendered</span>
                        <strong>1,842</strong>
                      </div>
                      <div className="docs-terminal-kpi">
                        <span>Seq Accuracy</span>
                        <strong>84.0%</strong>
                      </div>
                      <div className="docs-terminal-kpi">
                        <span>Median Latency</span>
                        <strong>1,740 ms</strong>
                      </div>
                      <div className="docs-terminal-kpi">
                        <span>Database Pool</span>
                        <strong>Healthy (0 err)</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, padding: "12px 14px", background: "#17262c", borderRadius: 8, border: "1px solid #233740" }}>
                      <p style={{ margin: "0 0 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9cb5bd" }}>
                        Active Fallback Priority
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, background: "#1e3a3a", color: "#5eead4", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                          1. TransformerSeq2Seq
                        </span>
                        <span style={{ fontSize: 11, background: "#252f38", color: "#9cb5bd", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                          2. LSTMAttentionSeq2Seq
                        </span>
                        <span style={{ fontSize: 11, background: "#252f38", color: "#9cb5bd", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                          3. RNNSeq2Seq
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              2. PROJECT OVERVIEW
              =================================================================== */}
          <section id="overview" className="docs-section">
            <span className="docs-section-tag">
              <BookOpen size={12} />
              <span>Foundation &amp; Objectives</span>
            </span>
            <h2>Project Overview</h2>
            <p className="docs-section-lead">
              Glossia is a full-stack sign language translation and telemetry analytics suite designed to make video
              conferencing and digital media genuinely accessible. It couples client-side video stream interception with a
              deep learning model cascade, presenting animated sign language avatars and logging granular usage telemetry.
            </p>

            <div className="docs-cards-grid">
              <div className="docs-card">
                <div className="docs-card-icon">
                  <Video size={20} />
                </div>
                <h3>What Glossia Is</h3>
                <p>
                  A real-time assistive ecosystem consisting of a Chrome Manifest V3 extension, a CWASA WebGL avatar host,
                  a Flask REST backend with PyTorch neural sequence-to-sequence translation models, and a Next.js 15 analytics dashboard.
                </p>
                <div className="docs-card-value">
                  <Check size={14} /> Full-stack accessibility pipeline
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Sparkles size={20} />
                </div>
                <h3>The Core Motivation</h3>
                <p>
                  To eliminate the cognitive fatigue of text-only closed captions for the deaf and hard-of-hearing (DHH)
                  community by providing visual, syntactically correct sign language animation directly on live meeting interfaces.
                </p>
                <div className="docs-card-value">
                  <Check size={14} /> Cognitive fatigue reduction
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Users size={20} />
                </div>
                <h3>Target Users</h3>
                <p>
                  Deaf and hard-of-hearing students and professionals in meetings (Google Meet, Microsoft Teams),
                  enterprise diversity &amp; compliance administrators, and NLP / accessibility researchers benchmarking seq2seq gloss generation.
                </p>
                <div className="docs-card-value">
                  <Check size={14} /> Enterprise &amp; education focus
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <TrendingUp size={20} />
                </div>
                <h3>Usage &amp; Conversion Analytics</h3>
                <p>
                  Tracks how spoken dialogue translates into avatar signing, measuring caption capture rates, dictionary hit ratios,
                  model fallback invocation counts, and active session engagement across platforms.
                </p>
                <div className="docs-card-value">
                  <Check size={14} /> Actionable telemetry &amp; KPIs
                </div>
              </div>
            </div>

            {/* Workflow Diagram */}
            <div className="docs-arch-box">
              <h3 style={{ fontFamily: "Space Grotesk", fontSize: 18, margin: "0 0 16px", color: "var(--text)" }}>
                High-Level Workflow: Data Collection to Analytics &amp; Insights
              </h3>
              <div className="docs-flow-steps">
                <div className="docs-flow-node">
                  1. Video &amp; Subtitle Ingestion
                  <span>DOM MutationObserver extracts live transcript</span>
                </div>
                <span className="docs-flow-arrow">&rarr;</span>
                <div className="docs-flow-node">
                  2. Hybrid Translation Engine
                  <span>Dictionary lookup with ML Seq2Seq fallback</span>
                </div>
                <span className="docs-flow-arrow">&rarr;</span>
                <div className="docs-flow-node">
                  3. 3D Avatar Rendering
                  <span>CWASA signs SiGML gestures in floating widget</span>
                </div>
                <span className="docs-flow-arrow">&rarr;</span>
                <div className="docs-flow-node">
                  4. Enterprise Telemetry
                  <span>PostgreSQL persistence &amp; Next.js dashboard</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              3. KEY FEATURES
              =================================================================== */}
          <section id="features" className="docs-section">
            <span className="docs-section-tag">
              <Layers size={12} />
              <span>Core Capabilities</span>
            </span>
            <h2>Key Features</h2>
            <p className="docs-section-lead">
              Glossia provides enterprise-grade analytics, user management, and system observability alongside its
              adaptive sign language translation engine.
            </p>

            <div className="docs-cards-grid">
              <div className="docs-card">
                <div className="docs-card-icon">
                  <Activity size={20} />
                </div>
                <h3>Session Tracking</h3>
                <p>
                  Captures detailed video conferencing and streaming sessions with platform metadata (Google Meet, Teams, YouTube),
                  active duration, sign counts, and caption synchronization accuracy.
                </p>
                <div className="docs-card-value">
                  Provides granular operational visibility into user engagement.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <BarChart3 size={20} />
                </div>
                <h3>Usage Analytics</h3>
                <p>
                  Aggregates total active signing time, sign volume trends, platform utilization splits, and peak usage periods
                  across daily, weekly, and monthly time horizons.
                </p>
                <div className="docs-card-value">
                  Informs capacity planning and platform adoption trends.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <TrendingUp size={20} />
                </div>
                <h3>Conversion Analytics</h3>
                <p>
                  Measures the conversion funnel from raw ingested subtitles to successful avatar gestures, highlighting dictionary
                  hit ratios versus deep learning fallback transitions.
                </p>
                <div className="docs-card-value">
                  Identifies vocabulary gaps and machine learning accuracy.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Sparkles size={20} />
                </div>
                <h3>Explainable AI</h3>
                <p>
                  Explains model-generated glosses with decoder attention over caption spans and uses Grad-CAM to highlight
                  the frames that influenced fingerspelling decisions.
                </p>
                <div className="docs-card-value">
                  On-demand diagnostic evidence for more transparent signing.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Users size={20} />
                </div>
                <h3>User Management</h3>
                <p>
                  Provides role-based access control (Administrator, Researcher, Analyst) with secure user provisioning,
                  status controls, and credential management.
                </p>
                <div className="docs-card-value">
                  Ensures secure enterprise administration and governance.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <ShieldCheck size={20} />
                </div>
                <h3>Audit Logging</h3>
                <p>
                  Maintains an immutable record of administrative actions, authentication attempts, model fallback triggers,
                  and configuration modifications for governance compliance.
                </p>
                <div className="docs-card-value">
                  Ensures full security traceability and compliance readiness.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Gauge size={20} />
                </div>
                <h3>System Health Monitoring</h3>
                <p>
                  Monitors backend API response latency, PostgreSQL connection pool health, ML inference throughput, and
                  error rates with live status indicators.
                </p>
                <div className="docs-card-value">
                  Minimizes downtime and accelerates incident resolution.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Sliders size={20} />
                </div>
                <h3>Settings &amp; Configuration</h3>
                <p>
                  Customizes sign language locales (ASL, BSL, ISL, Auslan), widget dimensions, fallback trigger thresholds
                  (default: 3 misses), and remote API endpoints.
                </p>
                <div className="docs-card-value">
                  Allows flexible localization tailored to each user&apos;s needs.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Lock size={20} />
                </div>
                <h3>Secure Authentication</h3>
                <p>
                  Protects analytics data through JWT token verification, bcrypt password encryption, stateless Bearer headers,
                  and automatic session expiration handling.
                </p>
                <div className="docs-card-value">
                  Prevents unauthorized telemetry tampering and leaks.
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-icon">
                  <Network size={20} />
                </div>
                <h3>API-Driven Dashboard Data</h3>
                <p>
                  Fetches live PostgreSQL records through Flask endpoints with an intelligent client-side fallback system that
                  gracefully displays baseline metrics when offline.
                </p>
                <div className="docs-card-value">
                  Guarantees unbroken dashboard availability and robust UX.
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              4. SYSTEM ARCHITECTURE
              =================================================================== */}
          <section id="system-architecture" className="docs-section">
            <span className="docs-section-tag">
              <Cpu size={12} />
              <span>Full-Stack Topology</span>
            </span>
            <h2>System Architecture</h2>
            <p className="docs-section-lead">
              Glossia is architected across four decoupled tiers: a Chrome Extension client running in the user&apos;s browser,
              a Next.js 15 analytics frontend, a Python Flask REST API with PyTorch model inferencing, and a PostgreSQL database.
            </p>

            {/* Clean Inline SVG Architecture Diagram */}
            <div className="docs-arch-box">
              <h3 style={{ fontFamily: "Space Grotesk", fontSize: 17, margin: "0 0 16px", color: "var(--text)" }}>
                Glossia End-to-End System Architecture Diagram
              </h3>
              <div className="docs-arch-diagram-wrap">
                <svg
                  className="docs-arch-svg"
                  viewBox="0 0 920 440"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Glossia Architecture Diagram"
                >
                  {/* Background Layers */}
                  <rect x="20" y="20" width="260" height="400" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
                  <rect x="330" y="20" width="260" height="400" rx="12" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1.5" />
                  <rect x="640" y="20" width="260" height="400" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />

                  {/* Layer Titles */}
                  <text x="40" y="50" fill="#0F172A" fontSize="13" fontWeight="700" fontFamily="Space Grotesk">1. CLIENT &amp; INGESTION TIER</text>
                  <text x="350" y="50" fill="#0F766E" fontSize="13" fontWeight="700" fontFamily="Space Grotesk">2. API &amp; INFERENCE TIER</text>
                  <text x="660" y="50" fill="#0F172A" fontSize="13" fontWeight="700" fontFamily="Space Grotesk">3. DATA &amp; ANALYTICS TIER</text>

                  {/* Client Boxes */}
                  <rect x="40" y="75" width="220" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
                  <text x="55" y="100" fill="#1E293B" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">Video Meeting / Stream</text>
                  <text x="55" y="122" fill="#64748B" fontSize="11" fontFamily="DM Sans">Google Meet, Teams, YouTube</text>

                  <rect x="40" y="165" width="220" height="90" rx="8" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" />
                  <text x="55" y="190" fill="#0F766E" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">Chrome Extension (MV3)</text>
                  <text x="55" y="210" fill="#475569" fontSize="11" fontFamily="DM Sans">• content.js (MutationObserver)</text>
                  <text x="55" y="228" fill="#475569" fontSize="11" fontFamily="DM Sans">• Floating widget &amp; ticker</text>
                  <text x="55" y="244" fill="#475569" fontSize="11" fontFamily="DM Sans">• CWASA 3D Avatar (SiGML)</text>

                  <rect x="40" y="275" width="220" height="120" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
                  <text x="55" y="300" fill="#1E293B" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">Client Fallback Logic</text>
                  <text x="55" y="322" fill="#475569" fontSize="11" fontFamily="DM Sans">1. sigmlData.json Lookup</text>
                  <text x="55" y="340" fill="#475569" fontSize="11" fontFamily="DM Sans">2. Track consecutive misses</text>
                  <text x="55" y="358" fill="#475569" fontSize="11" fontFamily="DM Sans">3. If misses &gt;= 3 &rarr; POST API</text>
                  <text x="55" y="376" fill="#475569" fontSize="11" fontFamily="DM Sans">4. Graceful fingerspelling</text>

                  {/* Backend Boxes */}
                  <rect x="350" y="75" width="220" height="110" rx="8" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" />
                  <text x="365" y="100" fill="#0F766E" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">Flask REST API (Python)</text>
                  <text x="365" y="122" fill="#475569" fontSize="11" fontFamily="DM Sans">• Blueprint Architecture</text>
                  <text x="365" y="140" fill="#475569" fontSize="11" fontFamily="DM Sans">• routes/text_to_sign.py</text>
                  <text x="365" y="158" fill="#475569" fontSize="11" fontFamily="DM Sans">• routes/analytics.py &amp; auth</text>

                  <rect x="350" y="205" width="220" height="190" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
                  <text x="365" y="230" fill="#1E293B" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">Deep Learning Fallback Chain</text>
                  <text x="365" y="252" fill="#6366F1" fontSize="11" fontWeight="600" fontFamily="DM Sans">1. TransformerSeq2Seq</text>
                  <text x="375" y="268" fill="#64748B" fontSize="10.5" fontFamily="DM Sans">Self-attention, Positional Enc</text>
                  <text x="365" y="292" fill="#0284C7" fontSize="11" fontWeight="600" fontFamily="DM Sans">2. LSTMAttentionSeq2Seq</text>
                  <text x="375" y="308" fill="#64748B" fontSize="10.5" fontFamily="DM Sans">Bi-LSTM + Bahdanau Attn</text>
                  <text x="365" y="332" fill="#D97706" fontSize="11" fontWeight="600" fontFamily="DM Sans">3. RNNSeq2Seq</text>
                  <text x="375" y="348" fill="#64748B" fontSize="10.5" fontFamily="DM Sans">Lightweight 2-layer RNN</text>
                  <text x="365" y="375" fill="#475569" fontSize="10.5" fontFamily="DM Sans">Checkpoints &amp; PyTorch 2.6+</text>

                  {/* Database & Frontend Boxes */}
                  <rect x="660" y="75" width="220" height="150" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
                  <text x="675" y="100" fill="#1E293B" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">PostgreSQL Database</text>
                  <text x="675" y="122" fill="#475569" fontSize="11" fontFamily="DM Sans">• SQLAlchemy 2.0 ORM</text>
                  <text x="675" y="140" fill="#475569" fontSize="11" fontFamily="DM Sans">• extension_sessions</text>
                  <text x="675" y="158" fill="#475569" fontSize="11" fontFamily="DM Sans">• extension_events</text>
                  <text x="675" y="176" fill="#475569" fontSize="11" fontFamily="DM Sans">• users &amp; audit_logs</text>
                  <text x="675" y="196" fill="#64748B" fontSize="10.5" fontFamily="DM Sans">Connection Pool &amp; Indices</text>

                  <rect x="660" y="245" width="220" height="150" rx="8" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" />
                  <text x="675" y="270" fill="#0F766E" fontSize="12" fontWeight="700" fontFamily="Space Grotesk">Next.js 15 Frontend</text>
                  <text x="675" y="292" fill="#475569" fontSize="11" fontFamily="DM Sans">• React 19 + TypeScript</text>
                  <text x="675" y="310" fill="#475569" fontSize="11" fontFamily="DM Sans">• App Router (/docs, /usage)</text>
                  <text x="675" y="328" fill="#475569" fontSize="11" fontFamily="DM Sans">• JWT Auth State in lib/api</text>
                  <text x="675" y="346" fill="#475569" fontSize="11" fontFamily="DM Sans">• Responsive DM Sans layout</text>
                  <text x="675" y="366" fill="#0D9488" fontSize="10.5" fontWeight="600" fontFamily="DM Sans">Interactive Telemetry Dash</text>

                  {/* Flow Connecting Arrows */}
                  <path d="M260 210 L350 130" stroke="#0D9488" strokeWidth="1.8" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                  <path d="M570 130 L660 130" stroke="#0D9488" strokeWidth="1.8" markerEnd="url(#arrow)" />
                  <path d="M660 320 L570 160" stroke="#64748B" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />

                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0D9488" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="docs-cards-grid">
              <div className="docs-card">
                <h3>Frontend Layer</h3>
                <p>
                  Built with Next.js 15 App Router, React 19, and TypeScript. Uses custom CSS design tokens for high-contrast
                  accessibility, Lucide icons, and an API client (<code>src/lib/api.ts</code>) that connects seamlessly to Flask.
                </p>
              </div>
              <div className="docs-card">
                <h3>Backend / API Layer</h3>
                <p>
                  A lightweight Python Flask service organized around modular blueprints (<code>analytics</code>, <code>auth</code>,
                  and <code>text_to_sign</code>). Handles JSON Web Token (JWT) validation and manages PyTorch model inference on CPU or GPU.
                </p>
              </div>
              <div className="docs-card">
                <h3>Database Layer</h3>
                <p>
                  PostgreSQL 15+ managed via SQLAlchemy 2.0 ORM and Psycopg 3. Stores session time-series, telemetry events,
                  vocabulary miss logs, user accounts, and immutable security audit records.
                </p>
              </div>
              <div className="docs-card">
                <h3>Authentication Flow</h3>
                <p>
                  Stateless JWT authentication. Upon logging in via <code>POST /api/auth/login</code>, the backend issues an HMAC-SHA256
                  signed JWT. The frontend stores this token and sends it in the <code>Authorization: Bearer &lt;token&gt;</code> header.
                </p>
              </div>
            </div>
          </section>

          {/* ===================================================================
              5. DEEP LEARNING ARCHITECTURES
              =================================================================== */}
          <section id="deep-learning-architectures" className="docs-section">
            <span className="docs-section-tag">
              <Network size={12} />
              <span>Neural Sequence-to-Sequence Models</span>
            </span>
            <h2>Deep Learning Architectures</h2>
            <p className="docs-section-lead">
              Glossia integrates three sequence-to-sequence deep learning architectures designed for English-to-sign-gloss
              translation. These models operate in an automated cascading fallback chain (<code>ModelFallbackChain</code>)
              when words cannot be matched against the primary dictionary.
            </p>

            {/* Model Cascade Overview Banner */}
            <div className="docs-cascade-container">
              <h3 style={{ fontFamily: "Space Grotesk", fontSize: 17, margin: "0 0 8px", color: "var(--text)" }}>
                The Cascading Fallback Mechanism (ModelFallbackChain)
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.55 }}>
                When the CWASA dictionary misses words for <code>MODEL_FALLBACK_AFTER_FAILURES</code> (3) consecutive attempts,
                missed tokens are sent to <code>POST /api/text-to-sign</code>. The backend queries models in strict capability order:
              </p>

              <div className="docs-cascade-flow">
                <div className="docs-cascade-step">
                  <span className="docs-cascade-rank">1</span>
                  <div className="docs-cascade-content">
                    <strong>Primary: TransformerSeq2Seq (transformer.py)</strong>
                    <span>Vaswani et al. (2017) encoder-decoder with multi-head self-attention and sinusoidal positional encodings.</span>
                  </div>
                  <span className="docs-model-badge docs-badge-transformer">Tier 1</span>
                </div>

                <div className="docs-cascade-step">
                  <span className="docs-cascade-rank">2</span>
                  <div className="docs-cascade-content">
                    <strong>Secondary: LSTMAttentionSeq2Seq (lstm_attention.py)</strong>
                    <span>Bidirectional LSTM encoder + LSTM decoder with Bahdanau (additive) attention alignment mechanism.</span>
                  </div>
                  <span className="docs-model-badge docs-badge-lstm">Tier 2</span>
                </div>

                <div className="docs-cascade-step">
                  <span className="docs-cascade-rank">3</span>
                  <div className="docs-cascade-content">
                    <strong>Tertiary: RNNSeq2Seq (rnn_seq2seq.py)</strong>
                    <span>Sutskever et al. (2014) style vanilla 2-layer Recurrent Neural Network encoder-decoder.</span>
                  </div>
                  <span className="docs-model-badge docs-badge-rnn">Tier 3</span>
                </div>

                <div className="docs-cascade-step" style={{ background: "var(--surface-muted)" }}>
                  <span className="docs-cascade-rank" style={{ background: "#e2e8f0", color: "#475569" }}>4</span>
                  <div className="docs-cascade-content">
                    <strong>Final Fallback: CWASA Letter-by-Letter Fingerspelling</strong>
                    <span>If no model produces glosses in the dictionary, the avatar gracefully fingerspells the token without interruption.</span>
                  </div>
                  <span className="docs-model-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>Safety Net</span>
                </div>
              </div>
            </div>

            {/* Architecture 1: Transformer */}
            <div className="docs-model-card">
              <div className="docs-model-header">
                <div>
                  <span className="docs-model-badge docs-badge-transformer">Architecture 1</span>
                  <h3 style={{ fontFamily: "Space Grotesk", fontSize: 22, margin: "6px 0 4px", color: "var(--text)" }}>
                    TransformerSeq2Seq (Transformer Encoder-Decoder)
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", fontFamily: "monospace" }}>
                    Source: signsec_backend/text_to_sign/models/transformer.py
                  </p>
                </div>
                <button
                  className="docs-btn-back"
                  onClick={() => setExpandedArch(expandedArch === "transformer" ? null : "transformer")}
                  aria-expanded={expandedArch === "transformer"}
                >
                  <span>{expandedArch === "transformer" ? "Hide Technical Details" : "Inspect Layer Details"}</span>
                  <ChevronDown size={14} style={{ transform: expandedArch === "transformer" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              </div>

              {/* Visual Flow Diagram */}
              <div className="docs-model-flow-diagram">
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  Data Flow Pipeline
                </div>
                <div className="docs-flow-steps">
                  <div className="docs-flow-node">
                    English Tokens (src)
                    <span>PAD_IDX masked (B, S)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    PositionalEncoding
                    <span>Sinusoidal (1, 512, 256)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    TransformerEncoder
                    <span>3 layers, 4 heads (B, S, 256)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    TransformerDecoder
                    <span>Causal mask + Cross-Attn</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    fc_out &rarr; Greedy Decode
                    <span>Target Sign Gloss IDs (B, T)</span>
                  </div>
                </div>
              </div>

              <div className="docs-model-details-grid">
                <div className="docs-detail-item">
                  <h4>Why Selected &amp; Problem Solved</h4>
                  <p>
                    Selected as the primary text-to-sign translator due to its ability to model global contextual relationships
                    and long-range grammatical dependencies across spoken sentences without suffering from recurrent memory bottlenecks.
                  </p>
                </div>

                <div className="docs-detail-item">
                  <h4>Core Idea &amp; Layer Architecture</h4>
                  <p>
                    Based on Vaswani et al. (2017). Features <code>PositionalEncoding</code> with fixed sinusoidal frequencies,
                    <code>nn.TransformerEncoder</code> (3 layers, 4 attention heads, <code>d_model=256</code>, <code>dim_feedforward=512</code>,
                    <code>dropout=0.1</code>), and <code>nn.TransformerDecoder</code> with upper-triangular causal self-attention masking and cross-attention.
                  </p>
                </div>

                <div className="docs-detail-item">
                  <h4>Key Strengths</h4>
                  <ul>
                    <li>Superior syntactic reordering between English SVO and sign language topic-comment structures.</li>
                    <li>Full parallel training across sequence lengths without recurrence.</li>
                    <li>Rich self-attention representations over complex meeting vocabulary.</li>
                  </ul>
                </div>

                <div className="docs-detail-item">
                  <h4>Limitations &amp; Trade-offs</h4>
                  <ul>
                    <li>Quadratic memory complexity with token length $O(n^2)$.</li>
                    <li>Requires more training data to converge effectively without overfitting.</li>
                    <li>Higher latency per greedy autoregressive decode step on low-end CPUs.</li>
                  </ul>
                </div>
              </div>

              {expandedArch === "transformer" && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ fontFamily: "Space Grotesk", fontSize: 13, marginBottom: 8, color: "var(--text)" }}>
                    Codebase Implementation Snippet
                  </h4>
                  <CodeBlock
                    filename="signsec_backend/text_to_sign/models/transformer.py"
                    code={`class TransformerSeq2Seq(Seq2SeqModel):
    def __init__(
        self,
        src_vocab_size: int,
        tgt_vocab_size: int,
        d_model: int = 256,
        nhead: int = 4,
        num_encoder_layers: int = 3,
        num_decoder_layers: int = 3,
        dim_feedforward: int = 512,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.d_model = d_model
        self.src_embedding = nn.Embedding(src_vocab_size, d_model, padding_idx=PAD_IDX)
        self.tgt_embedding = nn.Embedding(tgt_vocab_size, d_model, padding_idx=PAD_IDX)
        self.positional_encoding = PositionalEncoding(d_model, dropout)
        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward, dropout, batch_first=True)
        self.encoder = nn.TransformerEncoder(encoder_layer, num_encoder_layers, norm=nn.LayerNorm(d_model))
        decoder_layer = nn.TransformerDecoderLayer(d_model, nhead, dim_feedforward, dropout, batch_first=True)
        self.decoder = nn.TransformerDecoder(decoder_layer, num_decoder_layers, norm=nn.LayerNorm(d_model))
        self.fc_out = nn.Linear(d_model, tgt_vocab_size)`}
                  />
                </div>
              )}
            </div>

            {/* Architecture 2: LSTM + Attention */}
            <div className="docs-model-card">
              <div className="docs-model-header">
                <div>
                  <span className="docs-model-badge docs-badge-lstm">Architecture 2</span>
                  <h3 style={{ fontFamily: "Space Grotesk", fontSize: 22, margin: "6px 0 4px", color: "var(--text)" }}>
                    LSTMAttentionSeq2Seq (Bidirectional LSTM + Bahdanau Attention)
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", fontFamily: "monospace" }}>
                    Source: signsec_backend/text_to_sign/models/lstm_attention.py
                  </p>
                </div>
                <button
                  className="docs-btn-back"
                  onClick={() => setExpandedArch(expandedArch === "lstm" ? null : "lstm")}
                  aria-expanded={expandedArch === "lstm"}
                >
                  <span>{expandedArch === "lstm" ? "Hide Technical Details" : "Inspect Layer Details"}</span>
                  <ChevronDown size={14} style={{ transform: expandedArch === "lstm" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              </div>

              {/* Visual Flow Diagram */}
              <div className="docs-model-flow-diagram">
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  Data Flow Pipeline
                </div>
                <div className="docs-flow-steps">
                  <div className="docs-flow-node">
                    English Tokens (src)
                    <span>(B, S) vocabulary IDs</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    Bi-LSTM Encoder
                    <span>Forward + Backward (B, S, 512)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    Bahdanau Attention
                    <span>score = v^T tanh(W_dec*s + W_enc*h)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    Context Vector (c_t)
                    <span>Dynamic weighted sum (B, 512)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    AttentionDecoder &rarr; fc_out
                    <span>Logits over target glosses (B, V)</span>
                  </div>
                </div>
              </div>

              <div className="docs-model-details-grid">
                <div className="docs-detail-item">
                  <h4>Why Selected &amp; Problem Solved</h4>
                  <p>
                    Selected to overcome the fixed-context vector bottleneck of traditional RNNs. Allows the decoder to dynamically
                    align and attend to specific words in the spoken caption while synthesizing each sign gesture. Validated with
                    84% sequence accuracy and BLEU-4 of 15.2 to 17.9 on the Glossia evaluation suite.
                  </p>
                </div>

                <div className="docs-detail-item">
                  <h4>Core Idea &amp; Layer Architecture</h4>
                  <p>
                    Implements an <code>LSTMEncoder</code> with bidirectional LSTM (<code>embed_dim=128</code>, <code>hidden_dim=256</code>,
                    yielding <code>2H=512</code> states with linear state bridges), a <code>BahdanauAttention</code> module calculating additive
                    alignment scores, and an <code>AttentionDecoder</code> whose input concatenates previous token embeddings and context vectors.
                  </p>
                </div>

                <div className="docs-detail-item">
                  <h4>Key Strengths</h4>
                  <ul>
                    <li>Dynamic alignment prevents information loss on medium-length sentences.</li>
                    <li>Highly interpretable: attention maps explicitly show which transcript words drive each sign.</li>
                    <li>Robust convergence on moderate-sized datasets without requiring excessive parameters.</li>
                  </ul>
                </div>

                <div className="docs-detail-item">
                  <h4>Limitations &amp; Trade-offs</h4>
                  <ul>
                    <li>Recurrent state dependencies prevent parallel token decoding.</li>
                    <li>Slightly higher compute cost than vanilla RNN due to attention matrix operations.</li>
                  </ul>
                </div>
              </div>

              {expandedArch === "lstm" && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ fontFamily: "Space Grotesk", fontSize: 13, marginBottom: 8, color: "var(--text)" }}>
                    Bahdanau Attention Scoring &amp; Decoder
                  </h4>
                  <CodeBlock
                    filename="signsec_backend/text_to_sign/models/lstm_attention.py"
                    code={`class BahdanauAttention(nn.Module):
    """score(s, h_i) = v^T tanh(W_dec s + W_enc h_i), softmaxed over source positions."""
    def __init__(self, enc_dim: int, dec_dim: int, attn_dim: int):
        super().__init__()
        self.W_enc = nn.Linear(enc_dim, attn_dim, bias=False)
        self.W_dec = nn.Linear(dec_dim, attn_dim, bias=False)
        self.v = nn.Linear(attn_dim, 1, bias=False)

    def forward(self, dec_hidden: torch.Tensor, enc_outputs: torch.Tensor, src_mask: torch.Tensor):
        scores = self.v(torch.tanh(self.W_enc(enc_outputs) + self.W_dec(dec_hidden).unsqueeze(1))).squeeze(-1)
        weights = torch.softmax(scores.masked_fill(~src_mask, float("-inf")), dim=-1)
        context = torch.bmm(weights.unsqueeze(1), enc_outputs).squeeze(1)
        return context, weights`}
                  />
                </div>
              )}
            </div>

            {/* Architecture 3: Vanilla RNN */}
            <div className="docs-model-card">
              <div className="docs-model-header">
                <div>
                  <span className="docs-model-badge docs-badge-rnn">Architecture 3</span>
                  <h3 style={{ fontFamily: "Space Grotesk", fontSize: 22, margin: "6px 0 4px", color: "var(--text)" }}>
                    RNNSeq2Seq (Vanilla Recurrent Neural Network Seq2Seq)
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", fontFamily: "monospace" }}>
                    Source: signsec_backend/text_to_sign/models/rnn_seq2seq.py
                  </p>
                </div>
                <button
                  className="docs-btn-back"
                  onClick={() => setExpandedArch(expandedArch === "rnn" ? null : "rnn")}
                  aria-expanded={expandedArch === "rnn"}
                >
                  <span>{expandedArch === "rnn" ? "Hide Technical Details" : "Inspect Layer Details"}</span>
                  <ChevronDown size={14} style={{ transform: expandedArch === "rnn" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              </div>

              {/* Visual Flow Diagram */}
              <div className="docs-model-flow-diagram">
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  Data Flow Pipeline
                </div>
                <div className="docs-flow-steps">
                  <div className="docs-flow-node">
                    English Tokens (src)
                    <span>Input sequence (B, S)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    RNNEncoder
                    <span>2-layer nn.RNN (embed: 128, hid: 256)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    Context Hidden State
                    <span>Final sentence summary (2, B, 256)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    RNNDecoder &rarr; fc_out
                    <span>Stepwise generation (B, 1, V)</span>
                  </div>
                  <span className="docs-flow-arrow">&rarr;</span>
                  <div className="docs-flow-node">
                    Greedy Token Argmax
                    <span>Sign Gloss Output</span>
                  </div>
                </div>
              </div>

              <div className="docs-model-details-grid">
                <div className="docs-detail-item">
                  <h4>Why Selected &amp; Problem Solved</h4>
                  <p>
                    Selected as a lightweight, fast-inference fallback model. Establishes the foundational baseline architecture
                    for sequence learning and ensures translation remains operational even in low-resource CPU execution environments.
                  </p>
                </div>

                <div className="docs-detail-item">
                  <h4>Core Idea &amp; Layer Architecture</h4>
                  <p>
                    Follows the classical Sutskever et al. (2014) sequence-to-sequence paradigm using vanilla <code>nn.RNN</code> cells.
                    Features a 2-layer <code>RNNEncoder</code> (<code>embed_dim=128</code>, <code>hidden_dim=256</code>, <code>dropout=0.2</code>)
                    whose final hidden state initializes a 2-layer <code>RNNDecoder</code> producing logits through <code>nn.Linear</code>.
                  </p>
                </div>

                <div className="docs-detail-item">
                  <h4>Key Strengths</h4>
                  <ul>
                    <li>Minimal parameter footprint and lowest computational overhead.</li>
                    <li>Fastest inference latency per token, suitable for low-power edge environments.</li>
                    <li>Simple, stable training dynamics with few hyperparameter dependencies.</li>
                  </ul>
                </div>

                <div className="docs-detail-item">
                  <h4>Limitations &amp; Trade-offs</h4>
                  <ul>
                    <li>Fixed-vector information bottleneck compresses the entire sentence into one vector.</li>
                    <li>Susceptible to vanishing gradients on sentences longer than 6 to 8 words.</li>
                    <li>Achieved 76% accuracy in head-to-head A/B tests versus 84% for LSTM+Attention.</li>
                  </ul>
                </div>
              </div>

              {expandedArch === "rnn" && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ fontFamily: "Space Grotesk", fontSize: 13, marginBottom: 8, color: "var(--text)" }}>
                    Vanilla RNN Seq2Seq Definition
                  </h4>
                  <CodeBlock
                    filename="signsec_backend/text_to_sign/models/rnn_seq2seq.py"
                    code={`class RNNSeq2Seq(Seq2SeqModel):
    def __init__(
        self,
        src_vocab_size: int,
        tgt_vocab_size: int,
        embed_dim: int = 128,
        hidden_dim: int = 256,
        num_layers: int = 2,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.encoder = RNNEncoder(src_vocab_size, embed_dim, hidden_dim, num_layers, dropout)
        self.decoder = RNNDecoder(tgt_vocab_size, embed_dim, hidden_dim, num_layers, dropout)

    def forward(self, src: torch.Tensor, tgt_in: torch.Tensor) -> torch.Tensor:
        hidden = self.encoder(src)
        logits, _ = self.decoder(tgt_in, hidden)
        return logits`}
                  />
                </div>
              )}
            </div>

            {/* Architecture Comparison Table */}
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Architecture</th>
                    <th>Main Use Case</th>
                    <th>Key Strength</th>
                    <th>Main Limitation</th>
                    <th>Complexity</th>
                    <th>Best Fit Within Glossia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>TransformerSeq2Seq</strong>
                      Vaswani et al. (2017)
                    </td>
                    <td>Complex multi-clause sentences &amp; technical jargon</td>
                    <td>Global multi-head self-attention; no recurrent bottlenecks</td>
                    <td>Quadratic memory $O(n^2)$; requires high compute</td>
                    <td>High ($O(n^2 \cdot d)$)</td>
                    <td><strong>Tier 1 Primary:</strong> High-accuracy translation on GPU/cloud</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>LSTMAttentionSeq2Seq</strong>
                      Bahdanau et al. (2015)
                    </td>
                    <td>Sequential dialogue &amp; conversational meetings</td>
                    <td>Dynamic word alignment; 84% accuracy in evaluation report</td>
                    <td>Recurrent dependency prevents parallel generation</td>
                    <td>Moderate ($O(n \cdot d^2)$)</td>
                    <td><strong>Tier 2 Secondary:</strong> Reliable balance of accuracy &amp; latency</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>RNNSeq2Seq</strong>
                      Sutskever et al. (2014)
                    </td>
                    <td>Short phrases, simple commands, &amp; low-power clients</td>
                    <td>Ultra-fast inference latency; minimal memory usage</td>
                    <td>Context bottleneck &amp; vanishing gradients on long inputs</td>
                    <td>Low ($O(n \cdot d)$)</td>
                    <td><strong>Tier 3 Tertiary:</strong> Lightweight safety net when latency is paramount</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Architectural Synthesis Conclusion */}
            <div style={{ padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <h4 style={{ fontFamily: "Space Grotesk", fontSize: 15, margin: "0 0 8px", color: "var(--text)" }}>
                Architectural Synthesis: Why These Three Were Selected Together
              </h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                By pairing <strong>Transformer</strong>, <strong>LSTM with Bahdanau Attention</strong>, and <strong>Vanilla RNN</strong>,
                Glossia establishes an adaptive, tiered fallback system. The Transformer provides maximum grammatical expressive power for complex meeting
                dialogue; the LSTM Attention model guarantees proven sequential robustness and alignment without extreme compute demands;
                and the Vanilla RNN provides an ultra-fast emergency fallback before reverting to fingerspelling. Together, they guarantee that the user&apos;s
                sign language overlay remains active, accurate, and responsive throughout any video stream.
              </p>
            </div>
          </section>

          {/* ===================================================================
              6. DATA AND ANALYTICS FLOW
              =================================================================== */}
          <section id="data-flow" className="docs-section">
            <span className="docs-section-tag">
              <TrendingUp size={12} />
              <span>End-to-End Pipeline</span>
            </span>
            <h2>Data &amp; Analytics Flow</h2>
            <p className="docs-section-lead">
              From the instant a user enters a video conference to the moment aggregated metrics populate the dashboard,
              Glossia executes an 8-stage data processing lifecycle.
            </p>

            <div className="docs-timeline">
              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Video size={16} color="var(--teal)" />
                      <span>Stage 1: User Interaction &amp; Video Detection</span>
                    </h3>
                    <span className="docs-timeline-badge">Client Layer</span>
                  </div>
                  <p className="docs-timeline-desc">
                    The user opens a supported platform (Google Meet, Microsoft Teams, YouTube). <code>content.js</code> detects the
                    <code>&lt;video&gt;</code> element and injects the floating glassmorphism avatar overlay widget into the page DOM.
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Radio size={16} color="var(--teal)" />
                      <span>Stage 2: Caption Scraping &amp; Normalization</span>
                    </h3>
                    <span className="docs-timeline-badge">Client Layer</span>
                  </div>
                  <p className="docs-timeline-desc">
                    A <code>MutationObserver</code> observes live subtitle containers according to <code>MEETING_ADAPTERS</code>.
                    Caption updates are parsed into clean text tokens, avoiding duplicate words as speech progresses.
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Network size={16} color="var(--teal)" />
                      <span>Stage 3: Frontend-to-Backend Transmission</span>
                    </h3>
                    <span className="docs-timeline-badge">Network Layer</span>
                  </div>
                  <p className="docs-timeline-desc">
                    Session lifecycle events and out-of-vocabulary caption tokens are dispatched asynchronously to the Flask backend via
                    <code>POST /api/events</code> and <code>POST /api/text-to-sign</code> over secure HTTP.
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Server size={16} color="var(--teal)" />
                      <span>Stage 4: Backend Validation &amp; Ingestion</span>
                    </h3>
                    <span className="docs-timeline-badge">API Layer</span>
                  </div>
                  <p className="docs-timeline-desc">
                    Flask route handlers validate incoming JSON payloads, verify user session tokens, sanitize strings, and compute
                    session delta timestamps.
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Database size={16} color="var(--teal)" />
                      <span>Stage 5: Persistent Storage in PostgreSQL</span>
                    </h3>
                    <span className="docs-timeline-badge">Storage Layer</span>
                  </div>
                  <p className="docs-timeline-desc">
                    SQLAlchemy commits records to <code>extension_sessions</code> (platform, language, start time, sign totals) and
                    <code>extension_events</code> (event types, error frequencies, fallback usage).
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Cpu size={16} color="var(--teal)" />
                      <span>Stage 6: Real-Time Analytics Computation</span>
                    </h3>
                    <span className="docs-timeline-badge">Analytics Engine</span>
                  </div>
                  <p className="docs-timeline-desc">
                    SQL aggregation queries compute rolling active minutes, daily sign trends, caption-to-sign conversion ratios,
                    and system uptime health metrics.
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <LayoutDashboard size={16} color="var(--teal)" />
                      <span>Stage 7: Dashboard Visualization</span>
                    </h3>
                    <span className="docs-timeline-badge">Frontend UI</span>
                  </div>
                  <p className="docs-timeline-desc">
                    The Next.js 15 dashboard queries <code>GET /api/overview</code> and <code>GET /api/trends</code>, rendering interactive
                    metric cards, time-series charts, and session tables for administrators.
                  </p>
                </div>
              </div>

              <div className="docs-timeline-item">
                <span className="docs-timeline-dot" />
                <div className="docs-timeline-content">
                  <div className="docs-timeline-header">
                    <h3 className="docs-timeline-title">
                      <Network size={16} color="var(--teal)" />
                      <span>Stage 8: Deep Learning Continuous Feedback Loop</span>
                    </h3>
                    <span className="docs-timeline-badge">ML Lifecycle</span>
                  </div>
                  <p className="docs-timeline-desc">
                    Logged dictionary misses and fallback predictions are archived. These token pairs feed continuous model evaluation
                    sweeps and dataset expansion for future model checkpoint training.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              7. TECHNOLOGY STACK
              =================================================================== */}
          <section id="tech-stack" className="docs-section">
            <span className="docs-section-tag">
              <Database size={12} />
              <span>Ecosystem Specifications</span>
            </span>
            <h2>Technology Stack</h2>
            <p className="docs-section-lead">
              Glossia uses a modern, production-tested technology stack across frontend, backend, database, and machine learning components.
            </p>

            <div className="docs-tech-grid">
              <div className="docs-tech-category">
                <h3>
                  <Code2 size={16} color="var(--teal)" />
                  <span>Frontend</span>
                </h3>
                <div className="docs-tech-tags">
                  <div className="docs-tech-pill">Next.js <span>15.0+</span></div>
                  <div className="docs-tech-pill">React <span>19.0</span></div>
                  <div className="docs-tech-pill">TypeScript <span>5.6+</span></div>
                  <div className="docs-tech-pill">Lucide React <span>0.468</span></div>
                  <div className="docs-tech-pill">CSS Design Tokens <span>Native</span></div>
                </div>
              </div>

              <div className="docs-tech-category">
                <h3>
                  <Server size={16} color="var(--teal)" />
                  <span>Backend</span>
                </h3>
                <div className="docs-tech-tags">
                  <div className="docs-tech-pill">Python <span>3.10+</span></div>
                  <div className="docs-tech-pill">Flask <span>REST API</span></div>
                  <div className="docs-tech-pill">Flask-CORS <span>Cross-Origin</span></div>
                  <div className="docs-tech-pill">Blueprint Architecture <span>Modular</span></div>
                </div>
              </div>

              <div className="docs-tech-category">
                <h3>
                  <Database size={16} color="var(--teal)" />
                  <span>Database &amp; ORM</span>
                </h3>
                <div className="docs-tech-tags">
                  <div className="docs-tech-pill">PostgreSQL <span>15+</span></div>
                  <div className="docs-tech-pill">SQLAlchemy <span>2.0+</span></div>
                  <div className="docs-tech-pill">Psycopg <span>3.0 (psycopg-binary)</span></div>
                  <div className="docs-tech-pill">Relational Schema <span>Sessions &amp; Events</span></div>
                </div>
              </div>

              <div className="docs-tech-category">
                <h3>
                  <Lock size={16} color="var(--teal)" />
                  <span>Authentication &amp; Security</span>
                </h3>
                <div className="docs-tech-tags">
                  <div className="docs-tech-pill">JWT <span>JSON Web Tokens</span></div>
                  <div className="docs-tech-pill">bcrypt <span>Salted Hashing</span></div>
                  <div className="docs-tech-pill">Bearer Auth <span>Stateless</span></div>
                  <div className="docs-tech-pill">CORS Policy <span>Origin Restricted</span></div>
                </div>
              </div>

              <div className="docs-tech-category">
                <h3>
                  <Cpu size={16} color="var(--teal)" />
                  <span>Machine Learning &amp; NLP</span>
                </h3>
                <div className="docs-tech-tags">
                  <div className="docs-tech-pill">PyTorch <span>2.6+</span></div>
                  <div className="docs-tech-pill">CUDA <span>12.4</span></div>
                  <div className="docs-tech-pill">TransformerSeq2Seq <span>Multi-Head</span></div>
                  <div className="docs-tech-pill">Bahdanau Attention <span>Additive</span></div>
                  <div className="docs-tech-pill">Vanilla RNN <span>2-Layer Seq2Seq</span></div>
                </div>
              </div>

              <div className="docs-tech-category">
                <h3>
                  <Terminal size={16} color="var(--teal)" />
                  <span>Client &amp; Tooling</span>
                </h3>
                <div className="docs-tech-tags">
                  <div className="docs-tech-pill">Chrome Extension <span>Manifest V3</span></div>
                  <div className="docs-tech-pill">CWASA Runtime <span>SiGML Avatar</span></div>
                  <div className="docs-tech-pill">ESLint <span>9.0 Flat Config</span></div>
                  <div className="docs-tech-pill">MutationObserver <span>DOM Scraper</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              8. PROJECT STRUCTURE
              =================================================================== */}
          <section id="project-structure" className="docs-section">
            <span className="docs-section-tag">
              <FolderTree size={12} />
              <span>Repository Layout</span>
            </span>
            <h2>Project Structure</h2>
            <p className="docs-section-lead">
              The project is structured cleanly to separate client-side analytics presentation from the backend API,
              deep learning model definitions, and browser extension assets.
            </p>

            <div className="docs-arch-box">
              <h3 style={{ fontFamily: "Space Grotesk", fontSize: 16, margin: "0 0 14px", color: "var(--text)" }}>
                Core File &amp; Directory Tree
              </h3>
              <CodeBlock
                filename="glossia-repository-structure"
                code={`Glossia/
├── Frontend/                           # Next.js 15 Web Application
│   ├── src/
│   │   ├── app/                        # App Router Pages
│   │   │   ├── page.tsx                # Main Analytics Overview
│   │   │   ├── docs/page.tsx           # Comprehensive Project Documentation (/docs)
│   │   │   ├── sessions/page.tsx       # Session History & Platform Analytics
│   │   │   ├── conversions/page.tsx    # Caption-to-Sign Conversion Funnels
│   │   │   ├── usage/page.tsx          # Temporal Usage Trends & Sign Volumes
│   │   │   ├── users/page.tsx          # User & Role Management
│   │   │   ├── audit-log/page.tsx      # Security & Audit Log Records
│   │   │   ├── system-health/page.tsx  # API & Database Telemetry
│   │   │   ├── settings/page.tsx       # System Configuration & Preferences
│   │   │   ├── globals.css             # Design Tokens & Application Styling
│   │   │   └── layout.tsx              # Root HTML & Metadata Shell
│   │   ├── components/                 # Reusable Interface Components
│   │   │   ├── dashboard-shell.tsx     # Sidebar Navigation Shell
│   │   │   └── page-view.tsx           # Reusable Page Layout & Filter Controls
│   │   ├── assets/                     # Team Portraits & Static Graphics
│   │   │   ├── Raam Prathap.png        # Full-Stack Lead Portrait
│   │   │   ├── Kavinesh.png            # ML & NLP Lead Portrait
│   │   │   └── Santhosh.png            # UI/UX Lead Portrait
│   │   └── lib/                        # Utilities & API Clients
│   │       └── api.ts                  # REST API Client, Types, & Auth Token Storage
│   └── package.json                    # Frontend Dependencies & Scripts
│
├── signsec_backend/                    # Flask Python Backend & ML Pipeline
│   ├── app.py                          # Flask Application Entrypoint
│   ├── routes/                         # REST Blueprint Handlers
│   │   ├── analytics.py                # Session & Metric Aggregation Endpoints
│   │   ├── auth.py                     # JWT Authentication & Login
│   │   └── text_to_sign.py             # Model Fallback Translation Endpoint
│   ├── text_to_sign/                   # Deep Learning Seq2Seq Framework
│   │   ├── fallback.py                 # ModelFallbackChain Handler
│   │   ├── train.py                    # Multi-Model PyTorch Training Script
│   │   ├── tokenization.py             # Vocabulary Indexing & Preprocessing
│   │   └── models/                     # Three PyTorch Model Architectures
│   │       ├── transformer.py          # Model 1: TransformerSeq2Seq
│   │       ├── lstm_attention.py       # Model 2: LSTMAttentionSeq2Seq
│   │       └── rnn_seq2seq.py          # Model 3: RNNSeq2Seq
│   └── migrations/                     # PostgreSQL Database DDL
│       ├── 001_init.sql                # Baseline Authentication & User Tables
│       └── 002_analytics.sql           # Extension Sessions & Event Tables
│
├── manifest.json                       # Chrome Manifest V3 Configuration
├── content.js                          # Meeting Caption Scraper & DOM Adapter
├── background.js                       # Extension Service Worker
├── overlay.css                         # In-Page Floating Widget Styling
└── cwasa-runtime/                      # 3D Avatar Rendering Engine & SiGML Lexicon`}
              />
            </div>
          </section>

          {/* ===================================================================
              9. GETTING STARTED
              =================================================================== */}
          <section id="getting-started" className="docs-section">
            <span className="docs-section-tag">
              <Terminal size={12} />
              <span>Developer Setup Guide</span>
            </span>
            <h2>Getting Started</h2>
            <p className="docs-section-lead">
              Follow these step-by-step instructions to configure the database, start the backend API,
              and launch the Next.js frontend development server.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Step 1: Frontend Setup */}
              <div className="docs-card" style={{ padding: 24 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Code2 size={18} color="var(--teal)" />
                  <span>1. Frontend Installation &amp; Development Server</span>
                </h3>
                <p style={{ margin: "4px 0 14px", fontSize: 13.5, color: "var(--muted)" }}>
                  Install Node.js dependencies, configure your local environment file, and start the Next.js dev server:
                </p>
                <CodeBlock
                  code={`# Navigate to the frontend directory
cd Frontend

# Install dependencies (Next 15, React 19, Lucide)
npm install

# Configure environment variables
cp .env.example .env.local

# Start the Next.js development server
npm run dev`}
                />
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
                  The application will be live at <code>http://localhost:3000</code>.
                </p>
              </div>

              {/* Step 2: Database Migration */}
              <div className="docs-card" style={{ padding: 24 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Database size={18} color="var(--teal)" />
                  <span>2. PostgreSQL Database Setup &amp; Migrations</span>
                </h3>
                <p style={{ margin: "4px 0 14px", fontSize: 13.5, color: "var(--muted)" }}>
                  Create the PostgreSQL database and execute the initialization scripts to apply schemas:
                </p>
                <CodeBlock
                  code={`# 1. Create the database once
createdb signsec

# 2. Apply baseline authentication schema
psql postgresql://postgres:postgres@localhost:5432/signsec -f migrations/001_init.sql

# 3. Apply analytics and session tables
psql postgresql://postgres:postgres@localhost:5432/signsec -f migrations/002_analytics.sql

# 4. Verify tables were created
psql postgresql://postgres:postgres@localhost:5432/signsec -c '\\dt extension_*'`}
                />
              </div>

              {/* Step 3: Backend API Setup */}
              <div className="docs-card" style={{ padding: 24 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Server size={18} color="var(--teal)" />
                  <span>3. Backend Flask API Configuration</span>
                </h3>
                <p style={{ margin: "4px 0 14px", fontSize: 13.5, color: "var(--muted)" }}>
                  Configure your environment variables and launch the Flask backend API:
                </p>
                <CodeBlock
                  code={`# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables with credentials
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/signsec"
export JWT_SECRET="your-secure-jwt-secret-key-here"

# Start the Flask API server
python app.py`}
                />
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
                  The Flask API will run on <code>http://localhost:5000</code> by default.
                </p>
              </div>

              {/* Step 4: Machine Learning Pipeline */}
              <div className="docs-card" style={{ padding: 24 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Cpu size={18} color="var(--teal)" />
                  <span>4. Optional Deep Learning Pipeline Training</span>
                </h3>
                <p style={{ margin: "4px 0 14px", fontSize: 13.5, color: "var(--muted)" }}>
                  To train or fine-tune all three sequence-to-sequence translation models on sign-gloss pairs:
                </p>
                <CodeBlock
                  code={`# Install PyTorch and ML dependencies
pip install -r requirements-ml.txt

# Train all three models (Transformer, LSTM+Attention, RNN)
python -m signsec_backend.text_to_sign.train --model all

# Checkpoints will be saved to:
# signsec_backend/text_to_sign/checkpoints/<model>.pt`}
                />
              </div>

              {/* Step 5: Linting & Production Build */}
              <div className="docs-card" style={{ padding: 24 }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={18} color="var(--teal)" />
                  <span>5. Linting &amp; Production Build Verification</span>
                </h3>
                <p style={{ margin: "4px 0 14px", fontSize: 13.5, color: "var(--muted)" }}>
                  Verify code cleanliness and create an optimized production build:
                </p>
                <CodeBlock
                  code={`# Run ESLint across the codebase
npm run lint

# Compile and optimize for production
npm run build

# Start the production server
npm run start`}
                />
              </div>
            </div>
          </section>

          {/* ===================================================================
              10. MEET THE TEAM
              =================================================================== */}
          <section id="meet-the-team" className="docs-section">
            <span className="docs-section-tag">
              <Users size={12} />
              <span>Project Contributors</span>
            </span>
            <h2>Meet the Team</h2>
            <p className="docs-section-lead">
              Glossia is built by a passionate team of researchers and engineers combining deep learning, full-stack development,
              and accessibility user experience design.
            </p>

            <div className="docs-team-grid">
              {/* Member 1: Raam Prathap */}
              <div className="docs-team-card">
                <div className="docs-team-avatar-wrap">
                  <Image
                    src={raamImg}
                    alt="Raam Prathap - Lead Full-Stack Architect"
                    className="docs-team-img"
                    width={120}
                    height={120}
                    priority
                  />
                </div>
                <h3>Raam Prathap</h3>
                <span className="docs-team-role">Lead Full-Stack Architect</span>
                <p className="docs-team-bio">
                  Architected the core Glossia system, the Next.js 15 analytics dashboard, PostgreSQL schema integrations,
                  and end-to-end full-stack API pipelines.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <span className="docs-badge">Full-Stack &amp; Systems</span>
                </div>
              </div>

              {/* Member 2: Kavinesh */}
              <div className="docs-team-card">
                <div className="docs-team-avatar-wrap">
                  <Image
                    src={kavineshImg}
                    alt="Kavinesh - Machine Learning & NLP Engineer"
                    className="docs-team-img"
                    width={120}
                    height={120}
                    priority
                  />
                </div>
                <h3>Kavinesh</h3>
                <span className="docs-team-role">Machine Learning &amp; NLP Engineer</span>
                <p className="docs-team-bio">
                  Engineered the three text-to-sign deep learning architectures (Transformer, LSTM+Attention, Vanilla RNN),
                  the ModelFallbackChain cascade, and meeting caption adapters.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <span className="docs-badge">Deep Learning &amp; NLP</span>
                </div>
              </div>

              {/* Member 3: Santhosh */}
              <div className="docs-team-card">
                <div className="docs-team-avatar-wrap">
                  <Image
                    src={santhoshImg}
                    alt="Santhosh - UI/UX & Client Integration Engineer"
                    className="docs-team-img"
                    width={120}
                    height={120}
                    priority
                  />
                </div>
                <h3>Santhosh</h3>
                <span className="docs-team-role">UI/UX &amp; Client Integration</span>
                <p className="docs-team-bio">
                  Designed and developed the avatar overlay interface, translated line caption UI, user experience design tokens,
                  and real-time caption DOM synchronization.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <span className="docs-badge">UI/UX &amp; Frontend</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              11. FOOTER
              =================================================================== */}
          <footer id="footer" className="docs-footer">
            <div className="docs-footer-inner">
              <div className="docs-footer-brand">
                <h4>
                  <span className="brand-dot" />
                  <span>Glossia Analytics</span>
                </h4>
                <p>
                  A real-time sign language display overlay and enterprise telemetry platform designed for inclusive video
                  collaboration and digital streaming media.
                </p>
              </div>

              <div className="docs-footer-col">
                <h5>Documentation</h5>
                <ul className="docs-footer-links">
                  <li><a href="#hero">Overview &amp; Hero</a></li>
                  <li><a href="#features">Key Features</a></li>
                  <li><a href="#system-architecture">System Architecture</a></li>
                  <li><a href="#deep-learning-architectures">Deep Learning Models</a></li>
                  <li><a href="#data-flow">Data Flow Pipeline</a></li>
                </ul>
              </div>

              <div className="docs-footer-col">
                <h5>Quick Links</h5>
                <ul className="docs-footer-links">
                  <li><Link href="/">Main Dashboard</Link></li>
                  <li><Link href="/usage">Usage Trends</Link></li>
                  <li><Link href="/sessions">Session Telemetry</Link></li>
                  <li><Link href="/system-health">System Health</Link></li>
                  <li><Link href="/settings">Preferences</Link></li>
                </ul>
              </div>

              <div className="docs-footer-col">
                <h5>Project Team</h5>
                <ul className="docs-footer-links">
                  <li><a href="#meet-the-team">Raam Prathap</a></li>
                  <li><a href="#meet-the-team">Kavinesh</a></li>
                  <li><a href="#meet-the-team">Santhosh</a></li>
                  <li><a href="#getting-started">Setup Guide</a></li>
                </ul>
              </div>
            </div>

            <div className="docs-footer-bottom">
              <div>
                &copy; {new Date().getFullYear()} Glossia Accessibility Intelligence. Built with &#9829; for accessibility and inclusion.
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <a href="#hero" style={{ color: "var(--teal-dark)", textDecoration: "none", fontWeight: 600 }}>
                  Back to top &uarr;
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
