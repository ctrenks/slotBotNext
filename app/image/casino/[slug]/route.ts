import { LoadImage } from "@/app/lib/images/LoadImage";
import { NextRequest, NextResponse } from "next/server";
import imageType, { minimumBytes } from "image-type";
export const runtime = "nodejs";
export async function GET(
  _: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const params = await props.params;
  const blob = await LoadImage(params.slug, 1);
  const headers = new Headers();

  const detect = blob.slice(0, minimumBytes);
  const detectedType = await imageType(Buffer.from(await detect.arrayBuffer()));
  headers.set("Content-Type", detectedType ? detectedType.mime : "image/*");
  headers.set(
    "cache-control",
    "s-maxage=3600, stale-while-revalidate=31560000",
  );
  // or just use new Response ❗️
  return new NextResponse(blob, { status: 200, statusText: "OK", headers });
}
