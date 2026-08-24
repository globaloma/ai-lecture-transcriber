import SignupForm from "./SignupForm";

// Force this route to render fresh on every request instead of being
// statically prerendered and served from Vercel's edge cache — a stale
// cached shell here was serving old JS chunks long after new deploys.
// (This must live in a Server Component file — Next.js ignores route
// segment config exported from a "use client" module.)
export const dynamic = "force-dynamic";

export default function SignupPage() {
    return <SignupForm />;
}
