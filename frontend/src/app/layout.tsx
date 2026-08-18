import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import PrimaryNav from "@/components/PrimaryNav";

export const metadata: Metadata = {
    title: "AI Lecture Transcriber",
    description:
        "AI-Powered Audio and Video Transcription System for Learning in Tertiary Institutions",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50 min-h-screen">
              <AuthProvider>
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
                                <span>🎓</span>
                                <span className="hidden sm:inline">
                                    AI Lecture Transcriber
                                </span>
                                <span className="sm:hidden">
                                    AI Transcriber
                                </span>
                            </Link>

                            <div className="flex items-center gap-1">
                                <PrimaryNav />
                                <AuthNav />
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto px-4 py-6">
                    {children}
                </main>
              </AuthProvider>
            </body>
        </html>
    );
}