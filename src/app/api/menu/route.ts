import { NextResponse } from "next/server";
import { getDefaultMenu } from "@/lib/menu";

export function GET() {
  return NextResponse.json(getDefaultMenu());
}
