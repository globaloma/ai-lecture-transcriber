export interface Segment {
    id: number;
    segment_index: number;
    start_time: number;
    end_time: number;
    text: string;
}

export interface Topic {
    id: number;
    topic_title: string;
    start_time: number;
    end_time: number;
    description: string;
}

export interface Transcript {
    id: number;
    lecture_id: number;
    full_text: string;
    language: string;
    created_at: string;
    segments: Segment[];
}

export interface Lecture {
    id: number;
    title: string;
    file_name: string;
    file_type: string;
    status: "processing" | "completed" | "failed";
    processing_time: number | null;
    error_message: string | null;
    uploaded_at: string;
    has_transcript: boolean;
    transcript?: Transcript;
    topics?: Topic[];
}

export interface LecturesResponse {
    lectures: Lecture[];
    total: number;
}

export interface UploadResponse {
    message: string;
    lecture_id: number;
    title: string;
    file_name: string;
    file_type: string;
    status: string;
}

export interface StatusResponse {
    lecture_id: number;
    title: string;
    status: "processing" | "completed" | "failed";
    processing_time: number | null;
    elapsed_seconds?: number;
    has_transcript: boolean;
    segment_count?: number;
    language?: string;
    topic_count?: number;
    error_message?: string | null;
}

export interface SearchResult {
    lecture_id: number;
    lecture_title: string;
    file_type: string;
    segment_id: number;
    segment_index: number;
    start_time: number;
    end_time: number;
    text: string;
    transcript_id: number;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    total: number;
    lecture_id?: number;
    lecture_title?: string;
}

export interface TopicsResponse {
    lecture_id: number;
    lecture_title: string;
    topics: Topic[];
    total: number;
}

export interface ApiError {
    error: string;
    details?: string;
}