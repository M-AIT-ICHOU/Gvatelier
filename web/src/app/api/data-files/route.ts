import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const base =
    process.env.GEOJSON_CDN ||
    "https://raw.githubusercontent.com/M-AIT-ICHOU/Gv-Atelier/main/";

  try {
    const url = new URL("api/data-files.json", base).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    const filesUnknown: unknown = await res.json();
    const files = Array.isArray(filesUnknown)
      ? filesUnknown
          .filter((v): v is string => typeof v === "string")
          .sort((a, b) => a.localeCompare(b))
      : [];

    return NextResponse.json(files, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
}
