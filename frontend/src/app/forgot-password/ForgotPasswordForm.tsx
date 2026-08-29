"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { AxiosError } from "axios";
import type { ApiError } from "@/types";
import toast from "react-hot-toast";
import PasswordInput from "@/components/PasswordInput";

const INPUT_CLASS =
    "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400";

export default function ForgotPasswordForm() {
    const router = useRouter();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [matricNumber, setMatricNumber] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
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

        const cleanPassword = newPassword.trim();

        if (!email.trim() || !matricNumber.trim() || !cleanPassword) {
            toast.error("Please fill in every field");
            return;
        }
        if (cleanPassword.length < 8) {
            toast.error("Your new password must be at least 8 characters");
            return;
        }
        if (cleanPassword !== confirmPassword.trim()) {
            toast.error("The two passwords don't match");
            return;
        }

        try {
            setSubmitting(true);
            await resetPassword(email.trim(), matricNumber.trim(), cleanPassword);
            toast.success("Password updated — you're signed in");
            router.push("/dashboard");
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            if (axiosError.response) {
                toast.error(
                    axiosError.response.data?.error ||
                        "Couldn't reset your password. Please check your details and try again."
                );
            } else {
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
                    🔑 Reset Your Password
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    Confirm your identity with the email and matric number on your
                    account, then choose a new password.
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
                        className={INPUT_CLASS}
                        disabled={submitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Matric Number
                    </label>
                    <input
                        type="text"
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        placeholder="e.g. CSC/2021/001"
                        className={INPUT_CLASS}
                        disabled={submitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        New Password
                    </label>
                    <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className={INPUT_CLASS}
                        disabled={submitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm New Password
                    </label>
                    <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className={INPUT_CLASS}
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
                            {slow ? "Waking up the server..." : "Updating password..."}
                        </span>
                    ) : (
                        "Update Password"
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
                Remembered it?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Back to Sign In
                </Link>
            </p>
        </div>
    );
}
