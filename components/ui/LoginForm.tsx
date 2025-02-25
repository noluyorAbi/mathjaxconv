"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface LoginFormProps {
  apiEndpoint?: string;
  redirectPath?: string;
  cookieName?: string;
  title?: string;
  subtitle?: string;
}

export default function LoginForm({
  apiEndpoint = "/api/stop-addic/login",
  redirectPath = "/stop-addic",
  title = "Login",
  subtitle = "Enter your password",
}: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsValidating(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTimeout(() => {
          router.push(redirectPath);
        }, 1200); // Matches loading bar duration
      } else {
        setIsValidating(false);
        setError(data.message || "Invalid password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setIsValidating(false);
      setError("An error occurred. Please try again.");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
    },
  };

  const glowVariants = {
    hidden: { opacity: 1 },
    visible: {
      boxShadow: [
        "0 0 0px rgba(255, 255, 255, 0)",
        "0 0 20px rgba(255, 255, 255, 0.3)",
        "0 0 0px rgba(255, 255, 255, 0)",
      ],
      background: [
        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(31,41,55,1) 70%)",
        "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(31,41,55,1) 70%)",
        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(31,41,55,1) 70%)",
      ],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const errorIconVariants = {
    initial: { opacity: 0, x: 0 },
    animate: {
      opacity: 1,
      x: [-5, 5, -5, 0], // Shake effect
      transition: { duration: 0.5, ease: "easeInOut" },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-950 to-gray-900 px-4 relative overflow-hidden">
      {/* Wave background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="wave-background" />
      </div>

      {/* Form container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md bg-gray-900/90 rounded-xl p-8 border border-gray-800 shadow-2xl shadow-black/20"
      >
        {/* Top accent with loading bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 rounded-t-xl overflow-hidden">
          {isValidating && !error && (
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400"
            />
          )}
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.2, ease: "easeOut" },
          }}
          className="text-3xl font-semibold text-center text-white mb-2"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.3, ease: "easeOut" },
          }}
          className="text-center text-gray-400 text-sm mb-8"
        >
          {subtitle}
        </motion.p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="relative">
            <label
              htmlFor="password"
              className="block text-sm text-gray-300 mb-2"
            >
              Password
            </label>
            <motion.input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variants={glowVariants}
              animate={isValidating ? "visible" : "hidden"}
              className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-gray-500 transition-all duration-500 placeholder-gray-500"
            />
          </motion.div>

          {/* Error with icon */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center justify-center gap-2 text-red-500 text-sm"
              >
                <motion.svg
                  variants={errorIconVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </motion.svg>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button */}
          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)",
            }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 px-4 bg-gray-200 text-black text-base font-medium rounded-lg transition-all duration-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed relative overflow-hidden"
            disabled={!password.trim()}
          >
            <span className="relative z-10">Go</span>
            <motion.span
              className="absolute inset-0 bg-white/30"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.button>
        </form>
      </motion.div>

      {/* Inline CSS for wave animation */}
      <style jsx>{`
        .wave-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
              45deg,
              #0a0a0a 25%,
              #111111 25%,
              #111111 50%,
              #0a0a0a 50%,
              #0a0a0a 75%,
              #111111 75%,
              #111111
            ),
            linear-gradient(
              -45deg,
              #0a0a0a 25%,
              #111111 25%,
              #111111 50%,
              #0a0a0a 50%,
              #0a0a0a 75%,
              #111111 75%,
              #111111
            );
          background-color: #000;
          background-size: 100px 100px;
          animation: wave 20s linear infinite;
          opacity: 0.5;
        }

        @keyframes wave {
          0% {
            background-position: 0 0, 50px 50px;
          }
          100% {
            background-position: 100px 0, 150px 50px;
          }
        }
      `}</style>
    </div>
  );
}
