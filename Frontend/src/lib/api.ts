export type AnalyticsSession = {
  id: string;
  platform: string;
  sign_language: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  signs_displayed: number;
  captions_seen: number;
  fallback_count: number;
  error_count: number;
};

export type AnalyticsOverview = {
  range: { from: string; to: string };
  metrics: {
    sessions: number;
    active_seconds: number;
    signs_displayed: number;
    captions_seen: number;
    fallback_count: number;
    error_count: number;
  };
  recent_sessions: AnalyticsSession[];
};

export type AnalyticsTrend = {
  date: string;
  sessions: number;
  signs_displayed: number;
  active_seconds: number;
};

export type Conversion = {
  id: string;
  source_type: string;
  status: string;
  created_at: string;
  output_media_file_id: string | null;
  is_signed: boolean;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function hasAnalyticsToken() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("glossia_access_token"))
  );
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("glossia_access_token")
      : null;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as {
        error?: { message?: string };
      };
      message = payload.error?.message || message;
    } catch {
      // Keep the HTTP status when the server did not return JSON.
    }
    throw new ApiRequestError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export function getAnalyticsOverview() {
  return apiFetch<AnalyticsOverview>("/analytics/overview");
}

export function getAnalyticsTrends() {
  return apiFetch<{ items: AnalyticsTrend[] }>("/analytics/trends");
}

export function getAnalyticsSessions() {
  return apiFetch<{ items: AnalyticsSession[] }>("/analytics/sessions");
}

export function getConversions() {
  return apiFetch<{ items: Conversion[] }>("/conversions");
}

export async function login(username: string, password: string) {
  return apiFetch<{
    access_token?: string;
    mfa_required?: boolean;
    mfa_challenge_token?: string;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function loginWithMfa(challengeToken: string, code: string) {
  return apiFetch<{ access_token: string }>("/auth/login/mfa", {
    method: "POST",
    body: JSON.stringify({
      mfa_challenge_token: challengeToken,
      totp_code: code,
    }),
  });
}
