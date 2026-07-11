const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body && !(rest.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      token,
    }),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),
};

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export type Region = 'UAE' | 'INDIA' | 'BOTH';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  region: Region;
  description: string;
  isActive: boolean;
  createdAt: string;
  companyId?: string | null;
  company?: Company | null;
  _count?: { applications: number };
}

export type ApplicationStatus =
  | 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED'
  | 'OFFERED' | 'HIRED' | 'REJECTED';

export interface Application {
  id: string;
  candidateName: string;
  email: string;
  phone?: string;
  nationality?: string;
  currentLocation?: string;
  currentRole?: string;
  yearsExperience?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl: string;
  coverLetterUrl?: string;
  coverLetterText?: string;
  source: string;
  status: ApplicationStatus;
  createdAt: string;
  job: Job;
  reviewer?: { id: string; name: string };
  statusHistory?: {
    id: string;
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    note: string | null;
    createdAt: string;
    changedBy: { name: string };
  }[];
}

export interface Settings {
  id: string;
  companyName: string;
  logoUrl: string | null;
  senderEmail: string | null;
  updatedAt: string;
}

export interface Reviewer {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'REVIEWER';
  isActive: boolean;
  createdAt: string;
}
