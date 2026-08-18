"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getLectures, deleteLecture } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { Lecture, LecturesResponse } from "@/types";
import toast from "react-hot-toast";

export default function HomePage() {
  const { token, loading: authLoading } = useRequireAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadLectures = async () => {
      try {
        const data = await fetchLectures();
        if (cancelled) return;

        const hasProcessing = data.lectures.some(
          (lecture) => lecture.status === "processing"
        );

        if (hasProcessing) {
          timeoutId = setTimeout(loadLectures, 10000);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadLectures();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token]);

  async function fetchLectures(): Promise<LecturesResponse> {
    try {
      const data = await getLectures();
      setLectures(data.lectures);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, title: string): Promise<void> {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteLecture(id);
      setLectures((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lecture deleted");
    } catch (err) {
      toast.error("Failed to delete");
      console.error(err);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatProcessingTime(seconds: number | null): string {
    if (!seconds) return "";
    const mins = Math.round(seconds / 60);
    return mins < 1 ? "< 1 min" : `${mins} min`;
  }

  const processingCount = lectures.filter(
    (l) => l.status === "processing"
  ).length;

  const completedCount = lectures.filter(
    (l) => l.status === "completed"
  ).length;

  if (authLoading || !token) return null;

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        📚 My Lectures
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {completedCount} ready
                        {processingCount > 0 && (
                            <span className="ml-2 text-yellow-600">
                                • {processingCount} processing
                            </span>
                        )}
                    </p>
                </div>
                <Link
                    href="/upload"
                    className="shrink-0 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition text-sm"
                >
                    + Upload
                </Link>
            </div>

            {/* Processing banner */}
            {processingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full shrink-0 mt-0.5"></div>
                    <div>
                        <p className="text-amber-800 font-medium text-sm">
                            {processingCount} lecture
                            {processingCount > 1 ? "s are" : " is"} being
                            transcribed
                        </p>
                        <p className="text-amber-600 text-xs mt-0.5">
                            Page refreshes automatically every 10 seconds
                        </p>
                    </div>
                </div>
            )}

            {/* Loading skeletons */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border p-5 animate-pulse"
                        >
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                            <div className="flex gap-2">
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && lectures.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border">
                    <div className="text-6xl mb-4">🎓</div>
                    <h2 className="text-lg font-semibold text-gray-600 mb-2">
                        No lectures yet
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Upload your first lecture to get started
                    </p>
                    <Link
                        href="/upload"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-medium"
                    >
                        Upload Now
                    </Link>
                </div>
            )}

            {/* Lecture list */}
            {!loading && (
                <div className="space-y-3">
                    {lectures.map((lecture) => (
                        <div
                            key={lecture.id}
                            className={`bg-white rounded-xl border p-4 sm:p-5 transition hover:shadow-sm ${
                                lecture.status === "processing"
                                    ? "border-l-4 border-l-amber-400"
                                    : lecture.status === "failed"
                                    ? "border-l-4 border-l-red-400"
                                    : "border-l-4 border-l-blue-500"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Title */}
                                    {lecture.status === "completed" ? (
                                        <Link
                                            href={`/lectures/${lecture.id}`}
                                            className="font-semibold text-blue-600 hover:underline line-clamp-2 text-sm sm:text-base leading-snug"
                                        >
                                            {lecture.title}
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/lectures/${lecture.id}`}
                                            className="font-semibold text-gray-600 line-clamp-2 text-sm sm:text-base leading-snug"
                                        >
                                            {lecture.title}
                                        </Link>
                                    )}

                                    {/* Meta */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-400">
                                            {lecture.file_type === "video"
                                                ? "🎬"
                                                : "🎧"}{" "}
                                            {lecture.file_type}
                                        </span>
                                        <span className="text-gray-200">
                                            |
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatDate(lecture.uploaded_at)}
                                        </span>

                                        {/* Status badge */}
                                        {lecture.status === "processing" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                                                <span className="animate-spin h-2.5 w-2.5 border border-amber-600 border-t-transparent rounded-full"></span>
                                                Processing
                                            </span>
                                        )}
                                        {lecture.status === "completed" && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                                                ✓ Ready
                                            </span>
                                        )}
                                        {lecture.status === "failed" && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                                                ✗ Failed
                                            </span>
                                        )}

                                        {lecture.processing_time && (
                                            <span className="text-xs text-gray-400">
                                                ⏱{" "}
                                                {formatProcessingTime(
                                                    lecture.processing_time
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {lecture.status === "failed" &&
                                        lecture.error_message && (
                                            <p className="text-xs text-red-500 mt-1 line-clamp-1">
                                                {lecture.error_message}
                                            </p>
                                        )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {lecture.status === "completed" && (
                                        <Link
                                            href={`/lectures/${lecture.id}`}
                                            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition text-xs font-medium"
                                        >
                                            View
                                        </Link>
                                    )}
                                    {lecture.status === "processing" && (
                                        <Link
                                            href={`/lectures/${lecture.id}`}
                                            className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition text-xs font-medium"
                                        >
                                            Status
                                        </Link>
                                    )}
                                    <button
                                        onClick={() =>
                                            handleDelete(
                                                lecture.id,
                                                lecture.title
                                            )
                                        }
                                        className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
