"use client";

import React, { useState } from "react";

type PasswordInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type"
> & {
    value: string;
};

/**
 * Password field with a show/hide ("eye") toggle. Forwards every other input
 * prop through, so it drops in wherever a plain <input type="password"> was.
 */
export default function PasswordInput({
    className = "",
    disabled,
    ...props
}: PasswordInputProps) {
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <div className="relative">
            <input
                {...props}
                type={visible ? "text" : "password"}
                disabled={disabled}
                className={`${className} pr-11`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
            >
                {visible ? (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                ) : (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}
