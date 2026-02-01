import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const explicit = process.env.GEOJSON_CDN || process.env.DATA_CDN || "";
  const fallback = "https://storage.googleapis.com/gv-ateliers-data/";

  return NextResponse.json(
    {
      dataBase: explicit || fallback,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
