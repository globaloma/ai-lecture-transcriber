// import axios from "axios";
// import type {
//     LecturesResponse,
//     Lecture,
//     UploadResponse,
//     SearchResponse,
//     TopicsResponse,
//     StatusResponse,
// } from "@/types";

// export const API_BASE_URL =
//     process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// const api = axios.create({
//     baseURL: API_BASE_URL,
//     headers: {
//         'ngrok-skip-browser-warning': 'true', // <-- ADD THIS
//     }
// });

// export async function uploadLecture(
//     file: File,
//     title?: string
// ): Promise<UploadResponse> {
//     const formData = new FormData();
//     formData.append("file", file);
//     if (title) formData.append("title", title);

//     const response = await api.post<UploadResponse>("/api/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//     });
//     return response.data;
// }

// export async function getLectures(): Promise<LecturesResponse> {
//     const response = await api.get<LecturesResponse>("/api/lectures");
//     return response.data;
// }

// export async function getLecture(id: string | number): Promise<Lecture> {
//     const response = await api.get<Lecture>(`/api/lectures/${id}`);
//     return response.data;
// }

// export async function checkStatus(id: string | number): Promise<StatusResponse> {
//     const response = await api.get<StatusResponse>(
//         `/api/lectures/${id}/status`
//     );
//     return response.data;
// }

// export async function deleteLecture(id: number): Promise<{ message: string }> {
//     const response = await api.delete<{ message: string }>(
//         `/api/lectures/${id}`
//     );
//     return response.data;
// }

// export async function searchTranscripts(
//     query: string
// ): Promise<SearchResponse> {
//     const response = await api.get<SearchResponse>(
//         `/api/search?q=${encodeURIComponent(query)}`
//     );
//     return response.data;
// }

// export async function searchInLecture(
//     lectureId: number,
//     query: string
// ): Promise<SearchResponse> {
//     const response = await api.get<SearchResponse>(
//         `/api/lectures/${lectureId}/search?q=${encodeURIComponent(query)}`
//     );
//     return response.data;
// }

// export async function getTopics(lectureId: number): Promise<TopicsResponse> {
//     const response = await api.get<TopicsResponse>(
//         `/api/lectures/${lectureId}/topics`
//     );
//     return response.data;
// }

// export async function generateTopics(
//     lectureId: number
// ): Promise<TopicsResponse> {
//     const response = await api.post<TopicsResponse>(
//         `/api/lectures/${lectureId}/topics`
//     );
//     return response.data;
// }

// export function exportSRT(lectureId: number): void {
//     window.open(
//         `${API_BASE_URL}/api/lectures/${lectureId}/export/srt`,
//         "_blank"
//     );
// }

// export function exportTXT(lectureId: number): void {
//     window.open(
//         `${API_BASE_URL}/api/lectures/${lectureId}/export/txt`,
//         "_blank"
//     );
// }




import axios from "axios";
import type {
  LecturesResponse,
  Lecture,
  UploadResponse,
  SearchResponse,
  TopicsResponse,
  StatusResponse,
  AuthResponse,
  RegisterPayload,
  User,
  Assessment,
  SubmitAttemptResponse,
  AttemptsResponse,
} from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend";

// Uploads bypass the Vercel proxy route above and go straight to Render:
// Vercel serverless functions cap request bodies at 4.5MB and cap execution
// time, both of which a real lecture video blows past. The backend already
// allows this origin via CORS.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      clearStoredAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export async function uploadLecture(
  file: File,
  title?: string,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const response = await axios.post<UploadResponse>(
    `${BACKEND_URL}/api/upload`,
    formData,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );
  return response.data;
}

export async function getLectures(): Promise<LecturesResponse> {
  const response = await api.get<LecturesResponse>("/api/lectures");
  return response.data;
}

export async function getLecture(id: string | number): Promise<Lecture> {
  const response = await api.get<Lecture>(`/api/lectures/${id}`);
  return response.data;
}

export async function checkStatus(id: string | number): Promise<StatusResponse> {
  const response = await api.get<StatusResponse>(`/api/lectures/${id}/status`);
  return response.data;
}

export async function deleteLecture(id: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/api/lectures/${id}`);
  return response.data;
}

export async function searchTranscripts(query: string): Promise<SearchResponse> {
  const response = await api.get<SearchResponse>(
    `/api/search?q=${encodeURIComponent(query)}`
  );
  return response.data;
}

export async function searchInLecture(
  lectureId: number,
  query: string
): Promise<SearchResponse> {
  const response = await api.get<SearchResponse>(
    `/api/lectures/${lectureId}/search?q=${encodeURIComponent(query)}`
  );
  return response.data;
}

export async function getTopics(lectureId: number): Promise<TopicsResponse> {
  const response = await api.get<TopicsResponse>(
    `/api/lectures/${lectureId}/topics`
  );
  return response.data;
}

export async function generateTopics(
  lectureId: number
): Promise<TopicsResponse> {
  const response = await api.post<TopicsResponse>(
    `/api/lectures/${lectureId}/topics`
  );
  return response.data;
}

export function exportSRT(lectureId: number): void {
  window.open(
    `${API_BASE_URL}/api/lectures/${lectureId}/export/srt`,
    "_blank"
  );
}

export function exportTXT(lectureId: number): void {
  window.open(
    `${API_BASE_URL}/api/lectures/${lectureId}/export/txt`,
    "_blank"
  );
}

// =====================
// AUTH
// =====================
export async function registerRequest(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/register", payload);
  return response.data;
}

export async function loginRequest(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function resetPasswordRequest(
  email: string,
  matricNumber: string,
  newPassword: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/reset-password", {
    email,
    matric_number: matricNumber,
    new_password: newPassword,
  });
  return response.data;
}

export async function getCurrentUser(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>("/api/auth/me");
  return response.data;
}

// =====================
// ASSESSMENTS
// =====================
export async function generateAssessment(
  lectureId: number
): Promise<Assessment> {
  const response = await api.post<Assessment>(
    `/api/lectures/${lectureId}/assessment`
  );
  return response.data;
}

export async function getAssessment(lectureId: number): Promise<Assessment> {
  const response = await api.get<Assessment>(
    `/api/lectures/${lectureId}/assessment`
  );
  return response.data;
}

export async function submitAttempt(
  assessmentId: number,
  answers: Record<number, number>
): Promise<SubmitAttemptResponse> {
  const response = await api.post<SubmitAttemptResponse>(
    `/api/assessments/${assessmentId}/attempts`,
    { answers }
  );
  return response.data;
}

export async function getAttempts(
  assessmentId: number
): Promise<AttemptsResponse> {
  const response = await api.get<AttemptsResponse>(
    `/api/assessments/${assessmentId}/attempts`
  );
  return response.data;
}

