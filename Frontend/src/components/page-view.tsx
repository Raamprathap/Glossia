"use client";

import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";

export function PageView({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [range, setRange] = useState("Last 30 days");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>
            {title}
            <span className="heading-period">.</span>
          </h1>
          <p className="page-subtitle">{description}</p>
        </div>
        <div className="heading-controls">
          <div className="control-menu">
            <button
              className="date-control"
              onClick={() => {
                setRangeOpen(!rangeOpen);
                setFiltersOpen(false);
              }}
            >
              <span className="date-dot" />
              {range}
              <ChevronDown size={15} />
            </button>
            {rangeOpen && (
              <div className="range-options">
                <button
                  onClick={() => {
                    setRange("Last 7 days");
                    setRangeOpen(false);
                  }}
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => {
                    setRange("Last 30 days");
                    setRangeOpen(false);
                  }}
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => {
                    setRange("Last 90 days");
                    setRangeOpen(false);
                  }}
                >
                  Last 90 days
                </button>
              </div>
            )}
          </div>
          <div className="control-menu">
            <button
              className="filter-button"
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                setRangeOpen(false);
              }}
            >
              <Filter size={15} />
              Filters
            </button>
            {filtersOpen && (
              <div className="range-options">
                <button onClick={() => setFiltersOpen(false)}>
                  All platforms
                </button>
                <button onClick={() => setFiltersOpen(false)}>ASL</button>
                <button onClick={() => setFiltersOpen(false)}>
                  Completed only
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {children}
      <footer className="page-footer">
        <span>
          <span className="footer-dot" />
          Your data is synced and protected
        </span>
        <span>Glossia Analytics · v0.1</span>
      </footer>
    </div>
  );
}

export function MetricRow({
  items,
}: {
  items: Array<{ label: string; value: string; note: string }>;
}) {
  return (
    <section className="stats-grid">
      {items.map((item) => (
        <article className="stat-card" key={item.label}>
          <div className="stat-card-heading">
            <span>{item.label}</span>
          </div>
          <strong className="stat-value">{item.value}</strong>
          <span className="stat-footnote">{item.note}</span>
        </article>
      ))}
    </section>
  );
}
