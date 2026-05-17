import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      food_id,
      food_name,
      serving_description,
      calories,
      protein,
      carbs,
      fat,
      quantity,
      meal_type,
    } = body;

    if (!date || !food_id || !quantity) {
      return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
    }

    const result = await db`
      INSERT INTO food_log (date, food_id, food_name, serving_description, calories, protein, carbs, fat, quantity, meal_type)
      VALUES (${date}, ${food_id}, ${food_name ?? ""}, ${serving_description ?? ""}, ${calories ?? 0}, ${protein ?? 0}, ${carbs ?? 0}, ${fat ?? 0}, ${quantity}, ${meal_type ?? "snack"})
      RETURNING id, date, food_name, calories, quantity, created_at
    `;

    return NextResponse.json({ success: true, entry: result.rows[0] });
  } catch (error) {
    console.error("Food log POST error:", error);
    return NextResponse.json({ error: "Kayit basarisiz" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Tarih gerekli" }, { status: 400 });
    }

    const { rows } = await db`
      SELECT id, date, food_name, serving_description, calories, protein, carbs, fat, quantity, meal_type, created_at
      FROM food_log
      WHERE date = ${date}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ entries: rows });
  } catch (error) {
    console.error("Food log GET error:", error);
    return NextResponse.json({ error: "Veri alinamadi" }, { status: 500 });
  }
}
