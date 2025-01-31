"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import {
  ArrowRight,
  ActivityIcon as Function,
  Quote,
  RemoveFormatting,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-10"></div>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Developer Tools
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Streamline your workflow with our modern development tools
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <ToolCard
            href="/mathjaxconv"
            title="MathJax Converter"
            description="Convert $$ $$ markdown inline LaTeX to $$ format"
            icon={<RemoveFormatting className="h-6 w-6" />}
            gradient="from-blue-500 to-cyan-500"
          >
            Transform your LaTeX equations seamlessly for better compatibility
            across platforms
          </ToolCard>

          <ToolCard
            href="/callout-maker"
            title="Callout Maker"
            description="Add > prefix to create markdown callouts"
            icon={<Quote className="h-6 w-6" />}
            gradient="from-purple-500 to-pink-500"
          >
            Create beautiful markdown callouts with automatic prefix generation
          </ToolCard>
        </div>
      </main>
    </div>
  );
}

interface ToolCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  children: React.ReactNode;
}

function ToolCard({
  href,
  title,
  description,
  icon,
  gradient,
  children,
}: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Link href={href} className="block group h-full">
        <Card className="h-full bg-gray-900 border-gray-800 transition-all duration-300 hover:bg-gray-800 hover:border-gray-700 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-white">
                {title}
              </CardTitle>
              <div className={`bg-gradient-to-r ${gradient} p-2 rounded-full`}>
                {icon}
              </div>
            </div>
            <CardDescription className="text-gray-400 text-lg">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-gray-500">{children}</p>
            <div
              className={`flex items-center font-medium text-white group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r ${gradient}`}
            >
              Try it now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
