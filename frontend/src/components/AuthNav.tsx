"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="text-gray-600 hover:text-blue-600 transition px-3 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium ml-1"
        >
          Sign Up
        </Link>
      </>
    );
  }

  function handleLogout(): void {
    logout();
    router.push("/login");
  }

  return (
    <>
      <span className="text-gray-500 text-sm hidden sm:inline px-2">
        👋 {user.full_name.split(" ")[0]}
      </span>
      <button
        onClick={handleLogout}
        className="text-gray-600 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
      >
        Log Out
      </button>
    </>
  );
}
