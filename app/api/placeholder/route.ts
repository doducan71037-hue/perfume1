import { NextRequest, NextResponse } from "next/server";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "PF";
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const text = searchParams.get("text") || "Perfume";
  const id = searchParams.get("id") || text;
  const initials = getInitials(text);
  const hash = hashString(id);
  const hue = hash % 360;
  const background = `hsl(${hue} 32% 18%)`;
  const accent = `hsl(${hue} 40% 80%)`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" role="img" aria-label="${text}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${background}" />
      <stop offset="100%" stop-color="hsl(${hue} 30% 24%)" />
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#g)" />
  <circle cx="620" cy="140" r="160" fill="hsl(${hue} 45% 30% / 0.5)" />
  <circle cx="140" cy="860" r="200" fill="hsl(${hue} 35% 22% / 0.6)" />
  <text x="50%" y="52%" text-anchor="middle" font-family="\"Geist\", Arial, sans-serif" font-size="140" fill="${accent}" font-weight="600" letter-spacing="8">${initials}</text>
  <text x="50%" y="62%" text-anchor="middle" font-family="\"Geist\", Arial, sans-serif" font-size="28" fill="hsl(${hue} 30% 78%)" letter-spacing="6">SCENT PROFILE</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
