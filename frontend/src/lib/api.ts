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
} from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export async function uploadLecture(
  file: File,
  title?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const response = await api.post<UploadResponse>("/api/upload", formData);
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

