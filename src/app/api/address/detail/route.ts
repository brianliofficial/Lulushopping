import { NextResponse } from "next/server";

/** getAddress.io: full structured address by id from /autocomplete suggestion. */
export async function GET(request: Request) {
  const key = process.env.GETADDRESS_API_KEY?.trim();
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") ?? "").trim();
  if (!key) {
    return NextResponse.json(
      { error: "Address lookup not configured", code: "NO_GETADDRESS" },
      { status: 503 },
    );
  }
  if (!id) {
    return NextResponse.json(
      { error: "Missing id", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://api.getAddress.io/get/${encodeURIComponent(id)}?api-key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Address not found", code: "ADDRESS_NOT_FOUND" },
        { status: 404 },
      );
    }
    const data = (await res.json()) as {
      postcode?: string;
      line_1?: string;
      line_2?: string;
      line_3?: string;
      line_4?: string;
      locality?: string;
      town_or_city?: string;
    };

    const parts = [
      String(data.line_2 ?? "").trim(),
      String(data.line_3 ?? "").trim(),
      String(data.line_4 ?? "").trim(),
      String(data.locality ?? "").trim(),
    ].filter(Boolean);
    const addressLine2 = parts.join(", ");

    return NextResponse.json({
      addressLine1: String(data.line_1 ?? "").trim(),
      addressLine2,
      city: String(data.town_or_city ?? "").trim(),
      postcode: String(data.postcode ?? "").trim(),
    });
  } catch {
    return NextResponse.json(
      { error: "Lookup failed", code: "ADDRESS_LOOKUP_FAILED" },
      { status: 502 },
    );
  }
}
