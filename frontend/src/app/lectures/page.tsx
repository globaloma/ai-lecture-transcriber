"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getLectures, deleteLecture } from "@/lib/api";
import type { Lecture } from "@/types";

export default function LecturesPage() {
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        fetchLectures();
    }, []);

    async function fetchLectures(): Promise<void> {
        try {
            setLoading(true);
            const data = await getLectures();
            setLectures(data.lectures);
        } catch (err) {
            setError("Failed to load lectures");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: number): Promise<void> {
        if (!confirm("Are you sure you want to delete this lecture?")) return;

        try {
            await deleteLecture(id);
            setLectures(lectures.filter((l) => l.id !== id));
        } catch (err) {
            alert("Failed to delete lecture");
            console.error(err);
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // Filter lectures by type
    const filteredLectures = lectures.filter((lecture) => {
        if (filter === "all") return true;
        if (filter === "audio") return lecture.file_type === "audio";
        if (filter === "video") return lecture.file_type === "video";
        if (filter === "transcribed") return lecture.has_transcript;
        return true;
    });

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-xl text-gray-600">
                    Loading lectures...
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        📚 All Lectures
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {lectures.length} total lecture(s)
                    </p>
                </div>
                <Link
                    href="/upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                    + Upload Lecture
                </Link>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: "all", label: "All" },
                    { key: "video", label: "🎬 Video" },
                    { key: "audio", label: "🎧 Audio" },
                    { key: "transcribed", label: "✅ Transcribed" },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            filter === f.key
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* No lectures */}
            {filteredLectures.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg shadow">
                    <div className="text-5xl mb-4">📭</div>
                    <h2 className="text-lg font-medium text-gray-600">
                        No lectures found
                    </h2>
                    <p className="text-gray-400 mt-1 text-sm">
                        {filter !== "all"
                            ? "Try a different filter"
                            : "Upload your first lecture to get started"}
                    </p>
                </div>
            )}

            {/* Lecture grid */}
            <div className="grid gap-4">
                {filteredLectures.map((lecture) => (
                    <div
                        key={lecture.id}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <Link
                                    href={`/lectures/${lecture.id}`}
                                    className="text-xl font-semibold text-blue-600 hover:underline"
                                >
                                    {lecture.title}
                                </Link>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        {lecture.file_type === "video"
                                            ? "🎬"
                                            : "🎧"}{" "}
                                        {lecture.file_type}
                                    </span>
                                    <span>
                                        📅 {formatDate(lecture.uploaded_at)}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            lecture.has_transcript
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {lecture.has_transcript
                                            ? "Transcribed"
                                            : "Pending"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <Link
                                    href={`/lectures/${lecture.id}`}
                                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition text-sm font-medium"
                                >
                                    View
                                </Link>
                                <button
                                    onClick={() => handleDelete(lecture.id)}
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}