"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Share2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricRow, PageView } from "@/components/page-view";
import { getConversions, hasAnalyticsToken, type Conversion } from "@/lib/api";

const conversions = [
  {
    id: "CNV-1042",
    source: "weekly-team-sync.mp4",
    type: "Upload",
    status: "Complete",
    date: "Oct 16, 2026",
    size: "18.4 MB",
  },
  {
    id: "CNV-1041",
    source: "youtube.com/watch/…",
    type: "YouTube",
    status: "Processing",
    date: "Oct 15, 2026",
    size: "—",
  },
  {
    id: "CNV-1040",
    source: "Accessibility workshop",
    type: "Text",
    status: "Complete",
    date: "Oct 14, 2026",
    size: "—",
  },
];
export default function ConversionsPage() {
  const [items, setItems] = useState<Conversion[]>(
    conversions.map((item) => ({
      id: item.id,
      source_type: item.type,
      status: item.status.toUpperCase(),
      created_at: new Date(item.date).toISOString(),
      output_media_file_id: null,
      is_signed: item.status === "Complete",
    })),
  );
  useEffect(() => {
    if (hasAnalyticsToken())
      getConversions()
        .then((data) => setItems(data.items))
        .catch(() => undefined);
  }, []);
  return (
    <DashboardShell active="Conversions">
      <PageView
        eyebrow="Workspace / Conversions"
        title="Conversion library"
        description="Keep translated media, signed metadata, and shareable outputs in one place."
      >
        <MetricRow
          items={[
            {
              label: "This month",
              value: "14",
              note: "of 20 conversions used",
            },
            {
              label: "Completed",
              value: String(
                items.filter((item) => item.status === "COMPLETE").length || 11,
              ),
              note: "Ready to view or share",
            },
            {
              label: "Processing",
              value: String(
                items.filter((item) => item.status !== "COMPLETE").length || 2,
              ),
              note: "Currently in the pipeline",
            },
            {
              label: "Shared links",
              value: "6",
              note: "Active or recently expired",
            },
          ]}
        />
        <section className="panel sessions-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Library</p>
              <h2>Recent conversions</h2>
            </div>
            <button className="filter-button">
              <Plus size={14} />
              New conversion
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Conversion</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th>Signed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="platform-cell">
                        <span className="platform-mark meet-mark" />
                        <div>
                          <strong>{item.id}</strong>
                          <span>{item.source_type}</span>
                        </div>
                      </div>
                    </td>
                    <td>{item.source_type}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>{item.is_signed ? "Verified" : "Not signed"}</td>
                    <td>
                      <span
                        className={`status-pill ${item.status === "COMPLETE" ? "status-complete" : "status-review"}`}
                      >
                        <span />
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Share ${item.id}`}
                      >
                        <Share2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel insight-panel">
          <FileText size={18} />
          <div>
            <h2>Integrity built in</h2>
            <p>
              Completed conversions can be signed with your RSA key and shared
              with expiring access links.
            </p>
          </div>
        </section>
      </PageView>
    </DashboardShell>
  );
}
