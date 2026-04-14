import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
    title: "AI Lecture Transcriber",
    description:
        "AI-Powered Audio and Video Transcription System for Teaching and Learning",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50 min-h-screen">
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            borderRadius: "12px",
                            fontSize: "14px",
                            padding: "12px 16px",
                            maxWidth: "90vw",
                        },
                        success: {
                            style: {
                                background: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                            },
                        },
                        error: {
                            style: {
                                background: "#fef2f2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                            },
                        },
                    }}
                />

                {/* Navbar */}
                <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <Link
                                href="/"
                                className="text-lg font-bold text-blue-600 flex items-center gap-2"
                            >
                                
                                <span className="hidden sm:inline">
                                    AI Lecture Transcriber
                                </span>
                                <span className="sm:hidden">
                                    AI Transcriber
                                </span>
                            </Link>

                            <div className="flex items-center gap-1">
                                <Link
                                    href="/"
                                    className="text-gray-600 hover:text-blue-600 transition px-3 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/lectures"
                                    className="text-gray-600 hover:text-blue-600 transition px-3 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium hidden sm:block"
                                >
                                    Lectures
                                </Link>
                                <Link
                                    href="/search"
                                    className="text-gray-600 hover:text-blue-600 transition px-3 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
                                >
                                    Search
                                </Link>
                                <Link
                                    href="/upload"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium ml-1"
                                >
                                    + Upload
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto px-4 py-6">
                    {children}
                </main>
                <Analytics />
            </body>
        </html>
    );
}