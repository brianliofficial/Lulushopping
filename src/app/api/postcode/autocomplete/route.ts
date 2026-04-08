import { NextResponse } from "next/server";

const MIN_LEN = 2;
const MAX_LEN = 12;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  if (q.length < MIN_LEN) {
    return NextResponse.json({ results: [] as string[] });
  }
  if (q.length > MAX_LEN) {
    return NextResponse.json({ results: [] as string[] });
  }

  const encoded = encodeURIComponent(q);
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encoded}/autocomplete`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json({ results: [] as string[] });
    }
    const data = (await res.json()) as { result?: string[] };
    return NextResponse.json({
      results: Array.isArray(data.result) ? data.result : [],
    });
  } catch {
    return NextResponse.json({ results: [] as string[] });
  }
}
