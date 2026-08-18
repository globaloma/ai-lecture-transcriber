"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getLecture,
  getTopics,
  checkStatus,
  searchInLecture,
  generateTopics,
  exportSRT,
  exportTXT,
  API_BASE_URL,
} from "@/lib/api";
import type { Lecture, Segment, Topic, SearchResult } from "@/types";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

// =====================
// PROCESSING SCREEN
// =====================
function ProcessingScreen({
  title,
  lectureId,
  onComplete,
}: {
  title: string;
  lectureId: string;
  onComplete: () => void;
}) {
  const [elapsed, setElapsed] = useState<number>(0);
  const [dots, setDots] = useState<string>(".");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const dotsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const status = await checkStatus(lectureId);

        if (!mounted) return;

        if (
          status.status === "processing" &&
          typeof status.elapsed_seconds === "number"
        ) {
          setElapsed(status.elapsed_seconds);
        } else {
          setElapsed(0);
        }

        if (status.status === "completed") {
          onComplete();
        }
      } catch (err) {
        console.error("Failed to load processing status", err);
      }
    }

    init();

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    dotsRef.current = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    pollRef.current = setInterval(async () => {
      try {
        const status = await checkStatus(lectureId);

        if (status.status === "completed") {
          cleanup();
          toast.success("Transcription complete!");
          onComplete();
        }

        if (status.status === "failed") {
          cleanup();
          toast.error(status.error_message || "Transcription failed.");
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }
    }, 8000);

    return () => {
      mounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (dotsRef.current) clearInterval(dotsRef.current);
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
  }

  const progress = Math.min((elapsed / 2400) * 100, 95);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          {/* Animated icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-50"></div>
            <div className="relative bg-blue-100 rounded-full p-5">
              <span className="text-4xl">🎙️</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Transcribing Your Lecture
          </h2>
          <p className="text-gray-500 text-sm mb-6 line-clamp-2">{title}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Status line */}
          <p className="text-blue-600 text-sm font-medium mb-6">
            AI is processing your audio{dots}
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {formatTime(elapsed)}
              </p>
              <p className="text-xs text-gray-400">Elapsed</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">8s</p>
              <p className="text-xs text-gray-400">Poll interval</p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-semibold text-blue-700 mb-2">
              📊 Typical processing times:
            </p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>• 5 min video → ~5–10 minutes</p>
              <p>• 10 min video → ~10–20 minutes</p>
              <p>• 20 min video → ~20–40 minutes</p>
            </div>
          </div>

          {/* Safe to leave notice */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-6">
            <p className="text-xs text-green-700 font-medium">
              ✅ Safe to close this page
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Transcription continues in the background. Come back anytime to
              check progress.
            </p>
          </div>

          <Link
            href="/"
            className="block w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// =====================
// MAIN LECTURE PAGE
// =====================
export default function LectureDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lectureId = params.id as string;

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [activeTopic, setActiveTopic] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"segments" | "topics">("segments");

  // Topics
  const [topics, setTopics] = useState<Topic[]>([]);
  const [generatingTopics, setGeneratingTopics] = useState<boolean>(false);

  // Search within lecture
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetchLecture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto jump to timestamp from ?t=
  useEffect(() => {
    const t = searchParams.get("t");
    if (t && lecture?.status === "completed") {
      const time = parseFloat(t);
      if (!isNaN(time)) {
        setTimeout(() => {
          if (mediaRef.current) {
            mediaRef.current.currentTime = time;
            mediaRef.current.play();
          }
        }, 600);
      }
    }
  }, [searchParams, lecture]);

  async function fetchLecture(): Promise<void> {
    try {
      setLoading(true);
      const data = await getLecture(lectureId);
      setLecture(data);
      if (data.topics && data.topics.length > 0) {
        setTopics(data.topics);
      }
    } catch (err) {
      setError("Failed to load lecture");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Called by ProcessingScreen when transcription completes
  async function handleTranscriptionComplete(): Promise<void> {
    await fetchLecture();
  }

  function jumpToTime(startTime: number): void {
    if (mediaRef.current) {
      mediaRef.current.currentTime = startTime;
      mediaRef.current.play();
      // On mobile, scroll to the player
      mediaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  const scrollToSegment = useCallback((index: number) => {
    const el = segmentRefs.current.get(index);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Track active segment during playback
  useEffect(() => {
    if (!mediaRef.current || !lecture?.transcript?.segments) return;
    const media = mediaRef.current;

    function handleTimeUpdate(): void {
      const currentTime = media.currentTime;
      const segments = lecture!.transcript!.segments;
      const current = segments.find(
        (seg: Segment) =>
          currentTime >= seg.start_time && currentTime < seg.end_time,
      );
      if (current && current.segment_index !== activeSegment) {
        setActiveSegment(current.segment_index);
        scrollToSegment(current.segment_index);
      }
      if (topics.length > 0) {
        const topicIdx = topics.findIndex(
          (t) => currentTime >= t.start_time && currentTime < t.end_time,
        );
        setActiveTopic(topicIdx !== -1 ? topicIdx : null);
      }
    }

    media.addEventListener("timeupdate", handleTimeUpdate);
    return () => media.removeEventListener("timeupdate", handleTimeUpdate);
  }, [lecture, activeSegment, topics, scrollToSegment]);

async function handleGenerateTopics(): Promise<void> {
    try {
        setGeneratingTopics(true);

        // Generate new topics
        await generateTopics(Number(lectureId));

        // Always refetch from backend to get fresh data with IDs
        const refreshed = await getTopics(Number(lectureId));

        if (refreshed.topics && refreshed.topics.length > 0) {
            setTopics(refreshed.topics);
            toast.success(`${refreshed.topics.length} topics detected!`);
        } else {
            toast.error("No topics could be detected");
        }

        setActiveTab("topics");
    } catch (err) {
        toast.error("Failed to generate topics");
        console.error(err);
    } finally {
        setGeneratingTopics(false);
    }
}

  async function handleLectureSearch(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setHasSearched(true);
      const data = await searchInLecture(Number(lectureId), searchQuery);
      setSearchResults(data.results);
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error(axiosError);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }

  // ---- LOADING STATE ----
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading lecture...</p>
        </div>
      </div>
    );
  }

  // ---- ERROR STATE ----
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!lecture) return null;

  // ---- PROCESSING STATE ----
  // Show beautiful processing screen while transcription runs
  if (lecture.status === "processing") {
    return (
      <ProcessingScreen
        title={lecture.title}
        lectureId={lectureId}
        onComplete={handleTranscriptionComplete}
      />
    );
  }

  // ---- FAILED STATE ----
  if (lecture.status === "failed") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Transcription Failed
            </h2>
            <p className="text-gray-500 text-sm mb-2">{lecture.title}</p>
            {lecture.error_message && (
              <p className="text-red-500 text-xs bg-red-50 rounded-lg p-3 mb-6">
                {lecture.error_message}
              </p>
            )}
            <Link
              href="/"
              className="block w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- COMPLETED STATE ----
  const mediaUrl = lecture.file_url ?? `${API_BASE_URL}/uploads/${lecture.file_name}`;
  const isVideo = lecture.file_type === "video";

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
              {lecture.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
              <span>
                {isVideo ? "🎬" : "🎧"} {lecture.file_type}
              </span>
              <span>•</span>
              <span>
                📅 {new Date(lecture.uploaded_at).toLocaleDateString()}
              </span>
              {lecture.transcript && (
                <>
                  <span>•</span>
                  <span>🌐 {lecture.transcript.language}</span>
                  <span>•</span>
                  <span>📝 {lecture.transcript.segments.length} segments</span>
                </>
              )}
              {lecture.processing_time && (
                <>
                  <span>•</span>
                  <span>
                    ⏱ {Math.round(lecture.processing_time / 60)} min to process
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Export buttons */}
          {lecture.transcript && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  exportSRT(lecture.id);
                  toast.success("Downloading SRT...");
                }}
                className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-xs font-medium"
              >
                📄 SRT
              </button>
              <button
                onClick={() => {
                  exportTXT(lecture.id);
                  toast.success("Downloading TXT...");
                }}
                className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-xs font-medium"
              >
                📝 TXT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search within lecture */}
      <div className="bg-white rounded-xl border p-3 mb-4">
        <form onSubmit={handleLectureSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within this lecture..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0"
          >
            {searching ? "..." : "Search"}
          </button>
          {hasSearched && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setHasSearched(false);
              }}
              className="border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition shrink-0"
            >
              Clear
            </button>
          )}
        </form>

        {/* Inline search results */}
        {hasSearched && !searching && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">
              {searchResults.length} result(s) for &quot;
              {searchQuery}&quot;
            </p>
            {searchResults.length > 0 ? (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => jumpToTime(r.start_time)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition group"
                  >
                    <span className="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">
                      {formatTime(r.start_time)}
                    </span>
                    <span className="text-xs text-gray-600 truncate flex-1">
                      {r.text}
                    </span>
                    <span className="text-blue-500 text-xs shrink-0 opacity-0 group-hover:opacity-100">
                      ▶
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No matches found</p>
            )}
          </div>
        )}
      </div>

      {/* Main content — stacked on mobile, side by side on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
        {/* Left: Media Player + Full Transcript */}
        <div className="space-y-4">
          {/* Player */}
          <div className="bg-black rounded-xl overflow-hidden shadow">
            {isVideo ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                controls
                className="w-full max-h-64 sm:max-h-80 lg:max-h-none"
                src={mediaUrl}
                playsInline
              />
            ) : (
              <div className="bg-linear-to-br from-blue-900 to-blue-700 p-8">
                <div className="text-center text-white mb-4">
                  <div className="text-5xl mb-2">🎧</div>
                  <p className="text-sm opacity-75 truncate px-4">
                    {lecture.title}
                  </p>
                </div>
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  controls
                  className="w-full"
                  src={mediaUrl}
                />
              </div>
            )}
          </div>

          {/* Full transcript */}
          {lecture.transcript && (
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-base font-bold text-gray-700 mb-3">
                📝 Full Transcript
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {lecture.transcript.full_text}
              </p>
            </div>
          )}
        </div>

        {/* Right: Tabs */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("segments")}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === "segments"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              ⏱️ Segments
              {lecture.transcript && (
                <span className="ml-1 text-xs opacity-60">
                  ({lecture.transcript.segments.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("topics")}
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === "topics"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              🏷️ Topics
              {topics.length > 0 && (
                <span className="ml-1 text-xs opacity-60">
                  ({topics.length})
                </span>
              )}
            </button>
          </div>

          <div className="p-4">
            {/* Segments tab */}
            {activeTab === "segments" && (
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  Tap any segment to jump to that moment
                </p>
                {lecture.transcript?.segments &&
                lecture.transcript.segments.length > 0 ? (
                  <div className="space-y-1.5 max-h-125 overflow-y-auto pr-1">
                    {lecture.transcript.segments.map((seg: Segment) => (
                      <div
                        key={seg.id}
                        ref={(el) => {
                          if (el) {
                            segmentRefs.current.set(seg.segment_index, el);
                          }
                        }}
                        onClick={() => jumpToTime(seg.start_time)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          activeSegment === seg.segment_index
                            ? "bg-blue-100 border-l-4 border-blue-600"
                            : "bg-gray-50 hover:bg-gray-100 border-l-4 border-transparent active:bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                            {formatTime(seg.start_time)}
                          </span>
                          <span className="text-gray-700 text-sm leading-relaxed">
                            {seg.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    No segments available
                  </p>
                )}
              </div>
            )}

            {/* Topics tab */}
            {activeTab === "topics" && (
              <div>
                {topics.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🏷️</div>
                    <p className="text-gray-600 font-medium text-sm mb-1">
                      No topics yet
                    </p>
                    <p className="text-gray-400 text-xs mb-5">
                      Generate an overview of key topics covered in this lecture
                    </p>
                    <button
                      onClick={handleGenerateTopics}
                      disabled={generatingTopics}
                      className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white transition ${
                        generatingTopics
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                      }`}
                    >
                      {generatingTopics ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Detecting...
                        </span>
                      ) : (
                        "Generate Topics"
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-400">
                        Tap a topic to jump to it
                      </p>
                      <button
                        onClick={handleGenerateTopics}
                        disabled={generatingTopics}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {generatingTopics ? "Regenerating..." : "↺ Regenerate"}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-125 overflow-y-auto pr-1">
                      {topics.map((topic, index) => (
                        <div
                          key={topic.id ?? `${topic.start_time}-${topic.end_time}-${index}`}
                          onClick={() => jumpToTime(topic.start_time)}
                          className={`p-3 rounded-xl cursor-pointer transition-all border ${
                            activeTopic === index
                              ? "bg-green-50 border-green-300"
                              : "bg-gray-50 hover:bg-gray-100 border-transparent active:bg-green-50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center mt-0.5">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm leading-snug">
                                {topic.topic_title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {topic.description}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                  {formatTime(topic.start_time)}
                                </span>
                                <span className="text-gray-300 text-xs">→</span>
                                <span className="text-xs font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                  {formatTime(topic.end_time)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
