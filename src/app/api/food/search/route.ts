import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/fatsecret";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Arama terimi gerekli" }, { status: 400 });
    }
    const foods = await searchFoods(query.trim());
    return NextResponse.json({ foods });
  } catch (error) {
    console.error("Food search error:", error);
    return NextResponse.json({ error: "Arama basarisiz" }, { status: 500 });
  }
}
