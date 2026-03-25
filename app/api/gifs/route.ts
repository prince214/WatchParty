import { NextRequest, NextResponse } from "next/server";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

export async function GET(request: NextRequest) {
  if (!GIPHY_API_KEY) {
    return NextResponse.json({ error: "GIPHY API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const offset = searchParams.get("offset") || "0";

  const endpoint = q ? "search" : "trending";
  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    limit: "20",
    offset,
    rating: "pg-13",
  });

  if (q) params.set("q", q);

  try {
    const res = await fetch(`${GIPHY_BASE}/${endpoint}?${params}`);
    const data = await res.json();

    const gifs = (data.data ?? []).map(
      (g: {
        id: string;
        title: string;
        images: {
          fixed_width_small: { url: string; width: string; height: string };
          fixed_width: { url: string };
        };
      }) => ({
        id: g.id,
        title: g.title || "",
        preview: g.images.fixed_width_small.url,
        url: g.images.fixed_width.url,
        width: parseInt(g.images.fixed_width_small.width, 10) || 100,
        height: parseInt(g.images.fixed_width_small.height, 10) || 100,
      })
    );

    return NextResponse.json({ gifs, next: String(parseInt(offset, 10) + gifs.length) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch GIFs" }, { status: 500 });
  }
}
