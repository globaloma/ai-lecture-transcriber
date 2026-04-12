"use client";

import React, { useState, useEffect, Suspense } from "react"; // Added Suspense
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { searchTranscripts } from "@/lib/api";
import type { SearchResult } from "@/types";
import { AxiosError } from "axios";

// 1. Create a separate component for the actual search logic
function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState<string>(
        searchParams.get("q") || ""
    );
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searched, setSearched] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Auto search if URL has ?q=
    useEffect(() => {
        const urlQuery = searchParams.get("q");
        if (urlQuery) {
            setQuery(urlQuery);
            runSearch(urlQuery);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function runSearch(searchQuery: string): Promise<void> {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setError("Please enter at least 2 characters");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSearched(true);

            const data = await searchTranscripts(searchQuery);
            setResults(data.results);

            // Update URL with query
            router.replace(
                `/search?q=${encodeURIComponent(searchQuery)}`,
                { scroll: false }
            );
        } catch (err) {
            const axiosError = err as AxiosError;
            console.error(axiosError);
            setError("Search failed. Make sure the backend is running.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch(
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> {
        e.preventDefault();
        await runSearch(query);
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }

    function highlightMatch(
        text: string,
        searchQuery: string
    ): React.ReactNode {
        if (!searchQuery.trim()) return text;

        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark
                            key={i}
                            className="bg-yellow-200 text-yellow-900 px-0.5 rounded"
                        >
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    }

    const groupedResults = results.reduce<Record<number, SearchResult[]>>(
        (acc, result) => {
            if (!acc[result.lecture_id]) {
                acc[result.lecture_id] = [];
            }
            acc[result.lecture_id].push(result);
            return acc;
        },
        {}
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🔍 Search Lectures
            </h1>
            <p className="text-gray-500 mb-8">
                Search across all lecture transcripts by keyword or phrase
            </p>

            <form
                onSubmit={handleSearch}
                className="bg-white p-6 rounded-lg shadow mb-8"
            >
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a topic, keyword, or phrase..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg font-medium text-white transition ${
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Searching
                            </span>
                        ) : (
                            "Search"
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {searched && !loading && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-700">
                            {results.length === 0
                                ? `No results for "${query}"`
                                : `${results.length} result(s) in ${
                                      Object.keys(groupedResults).length
                                  } lecture(s) for "${query}"`}
                        </h2>
                        {results.length > 0 && (
                            <button
                                onClick={() => {
                                    setResults([]);
                                    setSearched(false);
                                    setQuery("");
                                    router.replace("/search");
                                }}
                                className="text-sm text-gray-400 hover:text-gray-600"
                            >
                                Clear results
                            </button>
                        )}
                    </div>

                    {results.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-lg shadow">
                            <div className="text-5xl mb-4">🔎</div>
                            <p className="text-gray-500 text-lg">
                                No matching segments found
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                Try different or simpler keywords
                            </p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {Object.entries(groupedResults).map(
                            ([lectureId, lectureResults]) => (
                                <div
                                    key={lectureId}
                                    className="bg-white rounded-lg shadow overflow-hidden"
                                >
                                    <div className="bg-blue-50 px-5 py-3 border-b flex items-center justify-between">
                                        <Link
                                            href={`/lectures/${lectureId}`}
                                            className="text-blue-700 font-semibold hover:underline flex items-center gap-2"
                                        >
                                            {lectureResults[0].file_type ===
                                            "video"
                                                ? "🎬"
                                                : "🎧"}
                                            {lectureResults[0].lecture_title}
                                        </Link>
                                        <span className="text-sm text-blue-500">
                                            {lectureResults.length} match(es)
                                        </span>
                                    </div>

                                    <div className="divide-y">
                                        {lectureResults.map(
                                            (result, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 hover:bg-gray-50 transition"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <span className="inline-block text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded mb-2">
                                                                ⏱{" "}
                                                                {formatTime(
                                                                    result.start_time
                                                                )}{" "}
                                                                →{" "}
                                                                {formatTime(
                                                                    result.end_time
                                                                )}
                                                              </span>
                                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                                {highlightMatch(
                                                                    result.text,
                                                                    query
                                                                )}
                                                            </p>
                                                        </div>

                                                        <Link
                                                            href={`/lectures/${result.lecture_id}?t=${result.start_time}`}
                                                            className="shrink-0 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
                                                        >
                                                            ▶{" "}
                                                            {formatTime(
                                                                result.start_time
                                                            )}
                                                        </Link>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// 2. The default export wraps the content in Suspense
export default function SearchPage() {
    return (
        <Suspense fallback={<div className="max-w-4xl mx-auto p-10 text-center">Loading Search...</div>}>
            <SearchContent />
        </Suspense>
    );
}