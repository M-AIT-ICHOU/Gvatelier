import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const explicit = process.env.GEOJSON_CDN || process.env.DATA_CDN || "";

  return NextResponse.json(
    {
      dataBase: explicit,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
