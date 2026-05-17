import { NextResponse } from "next/server";
import { getFood } from "@/lib/fatsecret";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const foodId = searchParams.get("food_id");
    if (!foodId) {
      return NextResponse.json({ error: "food_id gerekli" }, { status: 400 });
    }
    const food = await getFood(foodId);
    if (!food) {
      return NextResponse.json({ error: "Besin bulunamadi" }, { status: 404 });
    }
    return NextResponse.json({ food });
  } catch (error) {
    console.error("Food get error:", error);
    return NextResponse.json({ error: "Besin detaylari alinamadi" }, { status: 500 });
  }
}
