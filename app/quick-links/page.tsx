"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface LinkEntry {
  title: string;
  description: string;
  href: string;
}

const LINKS: LinkEntry[] = [
  { title: "Yesflicks", description: "Streaming", href: "https://de2.yesflicks.com/" },
  { title: "Streamexa", description: "Streaming", href: "https://streamexa.to/" },
  { title: "HiMovies", description: "Streaming", href: "https://himovies-sx.cyou/" },
  { title: "Z-Library", description: "Bücher", href: "https://z-library.sk/" },
  { title: "Welib", description: "Bücher", href: "https://welib.st/" },
];

export default function QuickLinksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 text-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Quick Links
        </h1>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="bg-gray-900 border-gray-800 transition-all duration-300 hover:bg-gray-800 hover:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-white">
                      {link.title}
                    </CardTitle>
                    <ExternalLink className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                  <CardDescription className="text-gray-400">
                    {link.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
