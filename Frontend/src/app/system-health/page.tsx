import {
  CheckCircle2,
  Database,
  Gauge,
  Server,
  TriangleAlert,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricRow, PageView } from "@/components/page-view";
export default function SystemHealthPage() {
  return (
    <DashboardShell active="System health">
      <PageView
        eyebrow="Admin / System health"
        title="Everything in working order"
        description="A quick operational view of the services that keep Glossia moving."
      >
        <MetricRow
          items={[
            { label: "API uptime", value: "99.98%", note: "Last 30 days" },
            {
              label: "Ingestion lag",
              value: "240ms",
              note: "Latest telemetry batch",
            },
            {
              label: "Avatar availability",
              value: "99.4%",
              note: "CWASA health",
            },
            {
              label: "Open incidents",
              value: "0",
              note: "No active incidents",
            },
          ]}
        />
        <section className="health-grid">
          <article className="panel health-card">
            <div className="health-icon health-ok">
              <Server size={18} />
            </div>
            <div>
              <h2>Flask API</h2>
              <p>Responding normally · 42ms average</p>
            </div>
            <CheckCircle2 className="health-status" size={18} />
          </article>
          <article className="panel health-card">
            <div className="health-icon health-ok">
              <Database size={18} />
            </div>
            <div>
              <h2>PostgreSQL</h2>
              <p>Connected · pool healthy</p>
            </div>
            <CheckCircle2 className="health-status" size={18} />
          </article>
          <article className="panel health-card">
            <div className="health-icon health-warn">
              <Gauge size={18} />
            </div>
            <div>
              <h2>Text-to-sign models</h2>
              <p>Fallback available · no active checkpoint alert</p>
            </div>
            <TriangleAlert
              className="health-status health-status-warn"
              size={18}
            />
          </article>
        </section>
      </PageView>
    </DashboardShell>
  );
}
