import { ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageView } from "@/components/page-view";
const logs = [
  {
    action: "conversion.create",
    actor: "Alex Morgan",
    outcome: "ALLOW",
    time: "Oct 16, 10:24 AM",
    detail: "conversion_id=CNV-1042",
  },
  {
    action: "auth.login",
    actor: "Priya Shah",
    outcome: "ALLOW",
    time: "Oct 16, 09:18 AM",
    detail: "MFA verified",
  },
  {
    action: "media.download",
    actor: "Daniel Kim",
    outcome: "DENY",
    time: "Oct 15, 04:43 PM",
    detail: "Permission denied",
  },
  {
    action: "conversion.share",
    actor: "Alex Morgan",
    outcome: "ALLOW",
    time: "Oct 15, 02:11 PM",
    detail: "expires in 60 minutes",
  },
];
export default function AuditLogPage() {
  return (
    <DashboardShell active="Audit log">
      <PageView
        eyebrow="Admin / Audit log"
        title="A clear security trail"
        description="Inspect important account, conversion, and media access decisions."
      >
        <section className="panel sessions-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Security events</p>
              <h2>Recent audit activity</h2>
            </div>
            <button className="filter-button">Export log</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Outcome</th>
                  <th>When</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={`${log.action}-${log.time}`}>
                    <td>
                      <div className="platform-cell">
                        <ShieldCheck size={16} color="var(--teal)" />
                        <strong>{log.action}</strong>
                      </div>
                    </td>
                    <td>{log.actor}</td>
                    <td>
                      <span
                        className={`status-pill ${log.outcome === "ALLOW" ? "status-complete" : "status-review"}`}
                      >
                        <span />
                        {log.outcome}
                      </span>
                    </td>
                    <td>{log.time}</td>
                    <td>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PageView>
    </DashboardShell>
  );
}
