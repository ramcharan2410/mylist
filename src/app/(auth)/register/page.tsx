import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Create account — My List" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      {/* Brand */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My List</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Create your account</p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <AuthForm mode="register" />
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
