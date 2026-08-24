"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { AxiosError } from "axios";
import type { ApiError } from "@/types";
import toast from "react-hot-toast";

export default function LoginForm() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [slow, setSlow] = useState<boolean>(false);
    const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (submitting) {
            slowTimer.current = setTimeout(() => setSlow(true), 5000);
        } else {
            if (slowTimer.current) clearTimeout(slowTimer.current);
            setSlow(false);
        }
        return () => {
            if (slowTimer.current) clearTimeout(slowTimer.current);
        };
    }, [submitting]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();

        if (!email.trim() || !password) {
            toast.error("Please enter your email and password");
            return;
        }

        try {
            setSubmitting(true);
            await login(email.trim(), password);
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            if (axiosError.response) {
                // The server responded with a real error (e.g. wrong
                // password) — show that message as-is.
                toast.error(axiosError.response.data?.error || "Sign in failed. Please try again.");
            } else {
                // No response at all: network error, timeout, or the
                // backend still waking up from being idle (Render free
                // tier). Say so explicitly instead of a generic failure.
                toast.error(
                    "Couldn't reach the server. It may be waking up from being idle — please wait a few seconds and try again."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                    👋 Welcome Back
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    Sign in to access your lectures and assessments
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-sm border p-6 space-y-5"
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.edu"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        disabled={submitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        disabled={submitting}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm ${
                        submitting
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                    }`}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {slow ? "Waking up the server..." : "Signing in..."}
                        </span>
                    ) : (
                        "Sign In"
                    )}
                </button>

                {slow && (
                    <p className="text-center text-xs text-gray-400">
                        The server can take up to a minute to wake up after being idle.
                        Please don&apos;t close this page or submit again.
                    </p>
                )}
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                    Sign Up
                </Link>
            </p>
        </div>
    );
}
