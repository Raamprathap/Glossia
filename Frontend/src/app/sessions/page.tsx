"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageView } from "@/components/page-view";
import {
  getAnalyticsSessions,
  hasAnalyticsToken,
  type AnalyticsSession,
} from "@/lib/api";

const demo = [
  {
    id: "demo-1",
    platform: "Google Meet",
    sign_language: "ASL",
    status: "COMPLETE",
    started_at: "2026-10-16T10:24:00Z",
    duration_seconds: 2280,
    signs_displayed: 1842,
    captions_seen: 1900,
    fallback_count: 12,
    error_count: 0,
  },
  {
    id: "demo-3",
    platform: "Microsoft Teams",
    sign_language: "ASL",
    status: "COMPLETE",
    started_at: "2026-10-14T11:02:00Z",
    duration_seconds: 3360,
    signs_displayed: 2914,
    captions_seen: 3020,
    fallback_count: 18,
    error_count: 1,
  },
  {
    id: "demo-2",
    platform: "YouTube",
    sign_language: "ASL",
    status: "COMPLETE",
    started_at: "2026-10-15T16:18:00Z",
    duration_seconds: 1260,
    signs_displayed: 936,
    captions_seen: 1010,
    fallback_count: 5,
    error_count: 0,
  },
];
const duration = (seconds: number) => `${Math.floor(seconds / 60)}m`;
export default function SessionsPage() {
  const [items, setItems] = useState<AnalyticsSession[]>(demo);
  useEffect(() => {
    if (hasAnalyticsToken())
      getAnalyticsSessions()
        .then((data) => setItems(data.items.length ? data.items : demo))
        .catch(() => undefined);
  }, []);
  return (
    <DashboardShell active="Sessions">
      <PageView
        eyebrow="Workspace / Sessions"
        title="Every session, accounted for"
        description="Review the moments Glossia was listening, translating, and signing."
      >
        <section className="panel sessions-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Session history</p>
              <h2>{items.length} sessions in this period</h2>
            </div>
            <button className="filter-button">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Signs</th>
                  <th>Fallbacks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="platform-cell">
                        <span className="platform-mark meet-mark" />
                        <div>
                          <strong>{item.platform}</strong>
                          <span>{item.sign_language}</span>
                        </div>
                      </div>
                    </td>
                    <td>{new Date(item.started_at).toLocaleString()}</td>
                    <td>{duration(item.duration_seconds)}</td>
                    <td>{item.signs_displayed.toLocaleString()}</td>
                    <td>{item.fallback_count}</td>
                    <td>
                      <span className="status-pill status-complete">
                        <span />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel insight-panel">
          <Activity size={18} />
          <div>
            <h2>Session signal</h2>
            <p>
              Longer sessions with fewer fallback events usually indicate a
              stronger caption stream and a stable avatar connection.
            </p>
          </div>
        </section>
      </PageView>
    </DashboardShell>
  );
}
