"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  {
    icon: "🎙️",
    title: "Accurate Transcription",
    description:
      "AI transcribes your audio and video lectures with timestamps, so you can jump straight to the moment you need.",
  },
  {
    icon: "🏷️",
    title: "Topic Breakdown",
    description:
      "Automatically detects the key topics covered in each lecture for a quick overview before you dive in.",
  },
  {
    icon: "📝",
    title: "Auto-Generated Quizzes",
    description:
      "Turn any transcript into a 10-question practice assessment and test what you've actually learned.",
  },
  {
    icon: "🔍",
    title: "Full-Text Search",
    description:
      "Search across every lecture you've uploaded to find exactly where a topic was discussed.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Upload",
    description: "Upload an audio or video recording of your lecture.",
  },
  {
    number: "2",
    title: "Transcribe",
    description:
      "AI transcribes it and automatically detects the key topics.",
  },
  {
    number: "3",
    title: "Study & Test",
    description:
      "Review the transcript, jump to any topic, and take an auto-generated quiz.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  // Render the marketing page immediately (don't block on the auth check —
  // it's only used to redirect an already-signed-in visitor away).
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-50 to-transparent rounded-3xl px-6 sm:px-12 py-16 sm:py-24 text-center">
        <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          🎓 Built for students &amp; lecturers
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto">
          Turn lecture recordings into{" "}
          <span className="text-blue-600">transcripts, topics, and quizzes</span>{" "}
          automatically
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mt-5 max-w-xl mx-auto">
          Upload any lecture recording and get an accurate transcript, a
          key-topic breakdown, and an auto-generated practice quiz in
          minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition text-sm"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto bg-white text-gray-700 border border-gray-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
          >
            Sign In
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Free to use · No credit card required
        </p>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Everything you need to study smarter
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            From raw recording to a study-ready lecture in a few clicks.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border p-6 hover:shadow-sm transition"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-800 text-base mb-1.5">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-gray-50 rounded-3xl px-6 sm:px-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            How it works
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Three steps between a recording and a finished study session.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="font-semibold text-gray-800 text-base mb-1.5">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Ready to get more out of your lectures?
        </h2>
        <p className="text-gray-500 text-sm sm:text-base mt-2 mb-7">
          Create your free account and upload your first lecture in minutes.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition text-sm"
        >
          Create Your Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t pt-8 pb-4 text-center">
        <p className="text-xs text-gray-400">
          🎓 AI Lecture Transcriber :  AI-powered transcription for learning in
          tertiary institutions
        </p>
      </footer>
    </div>
  );
}
