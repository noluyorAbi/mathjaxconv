"use client";

import type React from "react";

import { useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import type { Engine, RecursivePartial, IOptions } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ArrowRight,
  Quote,
  RemoveFormatting,
  Clock,
  Timer,
  Monitor,
  StopCircle,
  Grid2x2,
  GraduationCap,
  MessageSquareQuote,
  Palette,
  FileText,
} from "lucide-react";

export default function Page() {
  // Initialize particles engine using the slim build
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async () => {
    // Optional: Code to run after particles are loaded
  }, []);

  // Particle configuration with a subtle effect
  const particlesOptions = {
    background: {
      color: { value: "transparent" },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "attract" },
        onClick: { enable: true, mode: "push" },
        resize: true,
      },
      modes: {
        attract: { distance: 150, duration: 1, factor: 0.5 },
        push: { quantity: 1 },
      },
    },
    particles: {
      color: { value: "#A48EFC" },
      links: {
        color: "#A48EFC",
        distance: 120,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.3,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
      number: {
        density: { enable: true, area: 800 },
        value: 250,
      },
      opacity: { value: 0.1 },
      shape: { type: "lines" },
      size: { value: { min: 1, max: 8 } },
    },
    detectRetina: true,
  } as unknown as RecursivePartial<IOptions>;

  return (
    <>
      {/* Global styles for the subtle dark animated gradient */}
      <style jsx global>{`
        .dark-gradient-bg {
          animation: darkGradient 30s ease infinite;
          background: linear-gradient(45deg, #0f0f0f, #1a1a1a);
        }
        @keyframes darkGradient {
          0% {
            background: linear-gradient(45deg, #0f0f0f, #1a1a1a);
          }
          50% {
            background: linear-gradient(45deg, #101010, #191919);
          }
          100% {
            background: linear-gradient(45deg, #0f0f0f, #1a1a1a);
          }
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden text-white">
        {/* Dark, subtle animated gradient background */}
        <div className="absolute inset-0 z-0 dark-gradient-bg" />

        {/* Particle overlay */}
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={particlesOptions}
          className="absolute inset-0 z-10"
        />

        {/* Main content */}
        <main className="relative z-20 select-none container mx-auto px-4 py-16">
          {/* Hero Section with smooth fade-in */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Developer Tools
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Streamline your workflow with modern development tools
            </p>
          </motion.div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ToolCard
              href="/mathjaxconv"
              title="MathJax Converter"
              description="Convert $$ &nbsp; $$ markdown inline LaTeX to $$ format"
              icon={<RemoveFormatting className="h-6 w-6" />}
              gradient="from-blue-500 to-cyan-500"
            >
              Transform your LaTeX equations seamlessly for better compatibility
              across platforms.
            </ToolCard>

            <ToolCard
              href="/callout-maker"
              title="Callout Maker"
              description="Add > prefix to create markdown callouts with titles"
              icon={<Quote className="h-6 w-6" />}
              gradient="from-purple-500 to-pink-500"
            >
              Create beautiful markdown callouts with automatic prefix
              generation.
            </ToolCard>

            <ToolCard
              href="/stopwatch"
              title="Stopwatch Tool"
              description="Monitor your learning sessions with a customizable stopwatch."
              icon={<Clock className="h-6 w-6" />}
              gradient="from-green-500 to-blue-500"
            >
              Keep track of your session time with a simple, intuitive
              interface.
            </ToolCard>

            <ToolCard
              href="/pomodoro"
              title="Pomodoro Timer"
              description="Optimized for long, focused study sessions with sound cues."
              icon={<Timer className="h-6 w-6" />}
              gradient="from-red-500 to-orange-500"
            >
              Enhance your concentration with the Pomodoro technique and custom
              sound cues.
            </ToolCard>

            <ToolCard
              href="/black-whitescreen"
              title="Black-White Screen"
              description="Toggle between a black and white screen for a distraction-free, minimalist workspace."
              icon={<Monitor className="h-6 w-6" />}
              gradient="from-gray-700 to-gray-900"
            >
              Perfect for a minimal distraction environment with additional
              sunlight feature.
            </ToolCard>

            <ToolCard
              href="/stop-addic"
              title="Stop Addiction"
              description="Track your progress and build streaks to overcome cravings."
              icon={<StopCircle className="h-6 w-6" />}
              gradient="from-indigo-500 to-blue-500"
            >
              Stay on track with an interactive calendar, status alerts, and
              streak counters.
            </ToolCard>

            <ToolCard
              href="/eisenhower-matrix"
              title="Eisenhower Matrix"
              description="Prioritize your tasks effectively using the Eisenhower decision principle."
              icon={<Grid2x2 className="h-6 w-6" />}
              gradient="from-teal-500 to-green-500"
            >
              Visualize and categorize your tasks to decide what matters most.
            </ToolCard>

            <ToolCard
              href="/gradeview"
              title="GradeView"
              description="Track and analyze all your university grades with statistics."
              icon={<GraduationCap className="h-6 w-6" />}
              gradient="from-yellow-500 to-orange-500"
            >
              View your grade collection, averages, and detailed performance
              statistics in one place.
            </ToolCard>

            {/* New Motivation Quotes Card */}
            <ToolCard
              href="/motivation"
              title="Motivation Quotes"
              description="Inspiring wallpapers with motivational quotes on beautiful backgrounds."
              icon={<MessageSquareQuote className="h-6 w-6" />}
              gradient="from-violet-500 to-purple-500"
            >
              Discover a new quote each time with dark, aesthetic backgrounds to
              inspire your day.
            </ToolCard>

            {/* Pixel Color Remover Card */}
            <ToolCard
              href="/pixel-color-remover"
              title="Pixel Color Remover"
              description="Remove specific pixel colors like #CCC and similar shades to make them transparent."
              icon={<Palette className="h-6 w-6" />}
              gradient="from-emerald-500 to-teal-500"
            >
              Clean up images by removing unwanted background colors and making
              them transparent for better integration.
            </ToolCard>

            {/* Markdown to Jira Card */}
            <ToolCard
              href="/markdown-to-jira"
              title="Markdown to Jira"
              description="Convert standard Markdown formatting to Jira Wiki Markup."
              icon={<FileText className="h-6 w-6" />}
              gradient="from-blue-600 to-indigo-600"
            >
              Streamline your documentation workflow by converting Markdown to Jira format.
            </ToolCard>
          </div>
        </main>
      </div>
    </>
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
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
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
            <div className="flex items-center font-medium text-white">
              Try it now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
