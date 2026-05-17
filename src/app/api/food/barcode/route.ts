import { NextResponse } from "next/server";
import { findFoodByBarcode } from "@/lib/fatsecret";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Barkod gerekli" }, { status: 400 });
    }
    const food = await findFoodByBarcode(code.trim());
    if (!food) {
      return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
    }
    return NextResponse.json({ food });
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json({ error: "Barkod aramasi basarisiz" }, { status: 500 });
  }
}
