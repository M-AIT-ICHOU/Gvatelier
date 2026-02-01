import { NextResponse } from "next/server";
import path from "path";
import { readdir } from "fs/promises";

export const runtime = "nodejs";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "public", "static", "data");
    const entries = await readdir(dataDir, { withFileTypes: true });
    const files = entries
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json(files, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
