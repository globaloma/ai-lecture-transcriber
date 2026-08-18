"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function PrimaryNav() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <>
      <Link
        href="/dashboard"
        className="text-gray-600 hover:text-blue-600 transition px-3 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
      >
        Dashboard
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
      <span className="mx-1 h-5 w-px bg-gray-200 hidden sm:block"></span>
    </>
  );
}
