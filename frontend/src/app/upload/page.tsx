"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLecture } from "@/lib/api";
import { AxiosError } from "axios";
import type { ApiError } from "@/types";
import toast from "react-hot-toast";

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> {
        e.preventDefault();

        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        try {
            setUploading(true);

            const result = await uploadLecture(file, title || undefined);

            // Redirect immediately to lecture page
            // The lecture page will show processing state
            router.push(`/lectures/${result.lecture_id}`);

        } catch (err) {
            console.error(err);
            const axiosError = err as AxiosError<ApiError>;
            toast.error(
                axiosError.response?.data?.error ||
                    "Upload failed. Please try again."
            );
            setUploading(false);
        }
    }

    function handleFileChange(
        e: React.ChangeEvent<HTMLInputElement>
    ): void {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile && !title) {
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) {
            setFile(dropped);
            if (!title) {
                setTitle(dropped.name.replace(/\.[^/.]+$/, ""));
            }
        }
    }

    function getEstimate(): string {
        if (!file) return "";
        const sizeMB = file.size / (1024 * 1024);
        const low = Math.ceil(sizeMB / 3);
        const high = Math.ceil(sizeMB / 1.5);
        return `~${low}–${high} min estimated`;
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                    📤 Upload Lecture
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    Upload a lecture recording to transcribe it automatically
                    with AI
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-sm border p-6 space-y-5"
            >
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Lecture Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Introduction to Data Structures"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        disabled={uploading}
                    />
                </div>

                {/* File drop zone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Select File
                    </label>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                            isDragging
                                ? "border-blue-500 bg-blue-50"
                                : file
                                ? "border-green-400 bg-green-50"
                                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                    >
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mov,.avi,.mkv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                        />
                        {file ? (
                            <div>
                                <div className="text-4xl mb-2">
                                    {file.type.includes("video")
                                        ? "🎬"
                                        : "🎧"}
                                </div>
                                <p className="font-medium text-gray-800 text-sm truncate px-4">
                                    {file.name}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    {(file.size / (1024 * 1024)).toFixed(1)}{" "}
                                    MB
                                    {getEstimate() && (
                                        <span className="ml-2 text-blue-500">
                                            • {getEstimate()}
                                        </span>
                                    )}
                                </p>
                                {!uploading && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Tap to change file
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="text-4xl mb-3">🎵</div>
                                <p className="font-medium text-gray-700 text-sm">
                                    Tap to select or drop a file here
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    MP3, WAV, M4A, MP4, MOV, AVI, MKV
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={uploading || !file}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm ${
                        uploading || !file
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                    }`}
                >
                    {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Uploading...
                        </span>
                    ) : (
                        "Upload & Transcribe"
                    )}
                </button>
            </form>

            {/* Info cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Supported Formats
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {[
                            "MP3","WAV","M4A",
                            "AAC","MP4","MOV",
                            "AVI","MKV",
                        ].map((f) => (
                            <span
                                key={f}
                                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs"
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                        Processing Time (CPU)
                    </p>
                    <div className="text-xs text-amber-700 space-y-0.5">
                        <p>• 5 min video → ~5–10 min</p>
                        <p>• 10 min video → ~10–20 min</p>
                        <p>• 20 min video → ~20–40 min</p>
                    </div>
                </div>
            </div>
        </div>
    );
}