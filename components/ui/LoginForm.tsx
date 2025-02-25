"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  apiEndpoint?: string;
  redirectPath?: string;
  cookieName?: string;
  title?: string;
  subtitle?: string;
}

export default function LoginForm({
  apiEndpoint = "/api/stop-addic/login", // or "/api/eisenhower-matrix/login" as needed
  redirectPath = "/stop-addic", // or "/eisenhower-matrix" accordingly
  title = "Sign In",
  subtitle = "Enter your password to continue",
}: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(redirectPath);
      } else {
        setError(data.message || "Incorrect password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {title}
        </h1>
        <p className="text-center text-gray-600 mb-8">{subtitle}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Your secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={!password.trim()}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
