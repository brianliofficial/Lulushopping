import { NextResponse } from "next/server";

type PostcodeIoResult = {
  admin_district?: string | null;
  region?: string | null;
  parish?: string | null;
  admin_ward?: string | null;
  bua?: string | null;
};

function deriveAddressFields(r: PostcodeIoResult): {
  addressLine1: string;
  addressLine2: string;
  city: string;
} {
  const city =
    String(r.admin_district ?? "").trim() || String(r.region ?? "").trim();

  const ward = String(r.admin_ward ?? "").trim();
  const bua = String(r.bua ?? "").trim();
  const parishRaw = String(r.parish ?? "").trim();
  const parishFirst = parishRaw.split(",")[0]?.trim() ?? "";

  let line1 = "";
  if (bua && bua.toLowerCase() !== city.toLowerCase()) {
    line1 = bua;
  } else if (
    parishFirst &&
    parishFirst.toLowerCase() !== city.toLowerCase() &&
    !parishFirst.toLowerCase().includes("unparished")
  ) {
    line1 = parishFirst;
  }

  const line2 = ward;

  return {
    addressLine1: line1,
    addressLine2: line2,
    city,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim().replace(/\s+/g, "");
  if (q.length < 5) {
    return NextResponse.json(
      { error: "Invalid postcode", code: "INVALID_POSTCODE" },
      { status: 400 },
    );
  }

  const encoded = encodeURIComponent(q);
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encoded}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Postcode not found", code: "POSTCODE_NOT_FOUND" },
        { status: 404 },
      );
    }
    const data = (await res.json()) as {
      status?: number;
      result?: PostcodeIoResult;
    };
    const r = data.result;
    if (!r) {
      return NextResponse.json(
        { error: "Postcode not found", code: "POSTCODE_NOT_FOUND" },
        { status: 404 },
      );
    }
    const fields = deriveAddressFields(r);
    return NextResponse.json(fields);
  } catch {
    return NextResponse.json(
      { error: "Lookup failed", code: "POSTCODE_LOOKUP_FAILED" },
      { status: 502 },
    );
  }
}
