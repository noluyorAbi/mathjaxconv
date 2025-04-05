import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if we have the API key
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      console.error("Missing UNSPLASH_ACCESS_KEY environment variable");
      throw new Error("Missing API key");
    }

    // Search terms for dark, mysterious images
    const searchTerms = [
      "dark",
      "night",
      "mysterious",
      "noir",
      "shadow",
      "silhouette",
      "moody",
      "dark landscape",
      "dark nature",
      "dark abstract",
      "dark minimal",
      "gothic",
      "brooding",
      "cinematic",
      "urban noir",
      "enigmatic",
      "ethereal darkness",
      "atmospheric",
      "ominous",
      "twilight",
      "black and white",
    ];

    // Randomly select a search term
    const randomTerm =
      searchTerms[Math.floor(Math.random() * searchTerms.length)];

    console.log(`Fetching Unsplash image with search term: ${randomTerm}`);

    // Fetch from Unsplash API
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        randomTerm
      )}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Unsplash API error (${response.status}): ${errorText}`);
      throw new Error(`Unsplash API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      url: data.urls.regular,
      photographer: data.user.name,
      photographerUrl: data.user.links.html,
    });
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);

    // Return a fallback image instead of an error
    return NextResponse.json({
      url: `https://source.unsplash.com/random/1920x1080/?dark,minimal`,
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    });
  }
}
