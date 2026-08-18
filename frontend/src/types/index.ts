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
    file_url: string | null;
    status: "processing" | "completed" | "failed";
    processing_time: number | null;
    error_message: string | null;
    uploaded_at: string;
    has_transcript: boolean;
    has_assessment: boolean;
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

// =====================
// AUTH
// =====================
export interface User {
    id: number;
    full_name: string;
    email: string;
    university: string;
    faculty: string;
    department: string;
    matric_number: string;
    created_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface RegisterPayload {
    full_name: string;
    email: string;
    password: string;
    university: string;
    faculty: string;
    department: string;
    matric_number: string;
}

// =====================
// ASSESSMENTS
// =====================
export interface Choice {
    id: number;
    choice_text: string;
    is_correct?: boolean;
}

export interface Question {
    id: number;
    question_text: string;
    choices: Choice[];
    explanation?: string;
}

export interface Assessment {
    id: number;
    lecture_id: number;
    created_at: string;
    total_questions: number;
    questions: Question[];
}

export interface AttemptResultItem {
    question_id: number;
    selected_choice_id: number | null;
    correct_choice_id: number | null;
    is_correct: boolean;
    explanation?: string;
}

export interface SubmitAttemptResponse {
    attempt_id: number;
    score: number;
    total: number;
    results: AttemptResultItem[];
}

export interface Attempt {
    id: number;
    assessment_id: number;
    score: number;
    total: number;
    submitted_at: string;
}

export interface AttemptsResponse {
    assessment_id: number;
    attempts: Attempt[];
    total: number;
}