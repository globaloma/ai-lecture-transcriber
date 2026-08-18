"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { AxiosError } from "axios";
import type { ApiError, RegisterPayload } from "@/types";
import toast from "react-hot-toast";

const EMPTY_FORM: RegisterPayload = {
    full_name: "",
    email: "",
    password: "",
    university: "",
    faculty: "",
    department: "",
    matric_number: "",
};

const FIELDS: { name: keyof RegisterPayload; label: string; type?: string; placeholder: string }[] = [
    { name: "full_name", label: "Full Name", placeholder: "e.g. Ada Lovelace" },
    { name: "email", label: "Email", type: "email", placeholder: "you@school.edu" },
    { name: "password", label: "Password", type: "password", placeholder: "At least 8 characters" },
    { name: "university", label: "University", placeholder: "e.g. University of Lagos" },
    { name: "faculty", label: "Faculty", placeholder: "e.g. Faculty of Science" },
    { name: "department", label: "Department", placeholder: "e.g. Computer Science" },
    { name: "matric_number", label: "Matric Number", placeholder: "e.g. CSC/2021/001" },
];

export default function SignupPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [form, setForm] = useState<RegisterPayload>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState<boolean>(false);

    function handleChange(field: keyof RegisterPayload, value: string): void {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();

        const missing = FIELDS.filter((f) => !form[f.name].trim());
        if (missing.length > 0) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setSubmitting(true);
            await register(form);
            toast.success("Account created!");
            router.push("/");
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            toast.error(
                axiosError.response?.data?.error || "Sign up failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                    🎓 Create Your Account
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    Sign up to upload lectures and take auto-generated assessments
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-sm border p-6 space-y-5"
            >
                {FIELDS.map((field) => (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {field.label}
                        </label>
                        <input
                            type={field.type || "text"}
                            value={form[field.name]}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                            disabled={submitting}
                        />
                    </div>
                ))}

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
                            Creating account...
                        </span>
                    ) : (
                        "Sign Up"
                    )}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Sign In
                </Link>
            </p>
        </div>
    );
}
