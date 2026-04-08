import { NextResponse } from "next/server";
import { isValidUkPostcodeFormat, normalizeUkPostcode } from "@/lib/postcode-uk";

export type AddressSuggestion = {
  id: string;
  address: string;
};

/** getAddress.io: list premises for a full postcode (requires GETADDRESS_API_KEY). */
export async function GET(request: Request) {
  const key = process.env.GETADDRESS_API_KEY?.trim();
  const { searchParams } = new URL(request.url);
  const raw = String(searchParams.get("q") ?? "").trim();
  if (!key) {
    return NextResponse.json({
      configured: false,
      suggestions: [] as AddressSuggestion[],
    });
  }
  const norm = normalizeUkPostcode(raw);
  if (!isValidUkPostcodeFormat(raw) && !isValidUkPostcodeFormat(norm)) {
    return NextResponse.json({
      configured: true,
      suggestions: [] as AddressSuggestion[],
    });
  }

  const term = encodeURIComponent(norm);
  try {
    const res = await fetch(
      `https://api.getAddress.io/autocomplete/${term}?api-key=${encodeURIComponent(key)}&all=true`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        suggestions: [] as AddressSuggestion[],
        upstreamStatus: res.status,
      });
    }
    const data = (await res.json()) as {
      suggestions?: Array<{ id?: string; address?: string }>;
    };
    const list = Array.isArray(data.suggestions) ? data.suggestions : [];
    const suggestions: AddressSuggestion[] = list
      .filter((s) => s.id && s.address)
      .map((s) => ({ id: String(s.id), address: String(s.address) }));
    return NextResponse.json({ configured: true, suggestions });
  } catch {
    return NextResponse.json({
      configured: true,
      suggestions: [] as AddressSuggestion[],
    });
  }
}
