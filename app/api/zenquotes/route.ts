// app/api/zenquotes/route.ts
export async function GET() {
  try {
    // Replace with your ZenQuotes endpoint & key if you have one
    const res = await fetch("https://zenquotes.io/api/random", {
      // If your usage is limited or you want fresh data, you can do:
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "ZenQuotes request failed" }),
        {
          status: 500,
        }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ZenQuotes API error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch ZenQuotes" }),
      {
        status: 500,
      }
    );
  }
}
