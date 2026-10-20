"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricRow, PageView } from "@/components/page-view";
import {
  getAnalyticsTrends,
  hasAnalyticsToken,
  type AnalyticsTrend,
} from "@/lib/api";

export default function UsagePage() {
  const [trends, setTrends] = useState<AnalyticsTrend[]>([]);
  useEffect(() => {
    if (hasAnalyticsToken())
      getAnalyticsTrends()
        .then((data) => setTrends(data.items))
        .catch(() => undefined);
  }, []);
  const totalSigns = trends.reduce(
    (sum, item) => sum + item.signs_displayed,
    0,
  );
  return (
    <DashboardShell active="Usage">
      <PageView
        eyebrow="Workspace / Usage"
        title="Usage, in motion"
        description="See how often Glossia is present when conversations are happening."
      >
        <MetricRow
          items={[
            {
              label: "Signs displayed",
              value: totalSigns ? totalSigns.toLocaleString() : "24,860",
              note: "Across the selected period",
            },
            {
              label: "Active days",
              value: trends.length ? String(trends.length) : "24",
              note: "Days with a live session",
            },
            {
              label: "Fallback events",
              value: "148",
              note: "Model or fingerspelling fallback",
            },
            { label: "Avg. session", value: "32m", note: "Per active session" },
          ]}
        />
        <section className="panel page-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Trend</p>
              <h2>Daily sign activity</h2>
            </div>
            <span className="summary-positive">
              <ArrowUpRight size={14} /> 14.6%
            </span>
          </div>
          <div className="large-bars">
            {(trends.length
              ? trends
              : Array.from({ length: 14 }, (_, i) => ({
                  date: String(i),
                  signs_displayed: 35 + ((i * 17) % 65),
                  sessions: 1,
                  active_seconds: 0,
                }))
            ).map((item) => (
              <div className="large-bar-group" key={item.date}>
                <span
                  className="large-bar"
                  style={{
                    height: `${Math.max(12, Math.min(100, item.signs_displayed / Math.max(1, totalSigns / 100)))}%`,
                  }}
                />
                <small>{item.date.slice(5) || "Today"}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-grid">
          <article className="panel">
            <p className="panel-kicker">Signal quality</p>
            <h2>Caption coverage</h2>
            <div className="progress-stat">
              <strong>92.4%</strong>
              <span>of detected captions reached the avatar</span>
            </div>
            <div className="quota-track wide">
              <span style={{ width: "92.4%" }} />
            </div>
          </article>
          <article className="panel">
            <p className="panel-kicker">Languages</p>
            <h2>Sign language mix</h2>
            <div className="mini-list">
              <div>
                <span>ASL</span>
                <strong>86%</strong>
              </div>
              <div>
                <span>BSL</span>
                <strong>8%</strong>
              </div>
              <div>
                <span>ISL</span>
                <strong>6%</strong>
              </div>
            </div>
          </article>
        </section>
      </PageView>
    </DashboardShell>
  );
}
