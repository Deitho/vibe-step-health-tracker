import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/fatsecret";

const FS_TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const FS_API_URL = "https://platform.fatsecret.com/rest/server.api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "elma";

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  console.log("[FOOD-TEST] Searching for:", query);
  console.log("[FOOD-TEST] FATSECRET_CLIENT_ID:", clientId?.slice(0, 8) + "...");
  console.log("[FOOD-TEST] FATSECRET_CLIENT_SECRET:", clientSecret?.slice(0, 4) + "...");

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: "FatSecret API key'leri tanimli degil",
      clientId: !!clientId,
      clientSecret: !!clientSecret,
    }, { status: 400 });
  }

  // Step 1: Test token endpoint
  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(FS_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=basic",
    });

    const tokenStatus = tokenRes.status;
    const tokenBody = await tokenRes.text();
    console.log("[FOOD-TEST] Token response status:", tokenStatus);
    console.log("[FOOD-TEST] Token response body:", tokenBody);

    if (!tokenRes.ok) {
      return NextResponse.json({
        error: "Token alinamadi",
        status: tokenStatus,
        body: tokenBody,
      }, { status: 500 });
    }

    const tokenData = JSON.parse(tokenBody);
    if (!tokenData.access_token) {
      return NextResponse.json({
        error: "Token yanitinda access_token yok",
        body: tokenData,
      }, { status: 500 });
    }

    // Step 2: Test search endpoint
    const searchUrl = new URL(FS_API_URL);
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("method", "foods.search");
    searchUrl.searchParams.set("search_expression", query);
    searchUrl.searchParams.set("max_results", "5");

    console.log("[FOOD-TEST] Search URL:", searchUrl.toString());
    console.log("[FOOD-TEST] Token (first 20 chars):", tokenData.access_token.slice(0, 20) + "...");

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const searchStatus = searchRes.status;
    const searchBody = await searchRes.text();
    console.log("[FOOD-TEST] Search response status:", searchStatus);
    console.log("[FOOD-TEST] Search response body:", searchBody);

    return NextResponse.json({
      token_ok: true,
      token_preview: tokenData.access_token.slice(0, 10) + "...",
      search_status: searchStatus,
      search_body: searchBody,
    });
  } catch (error) {
    console.error("[FOOD-TEST] Error:", error);
    return NextResponse.json({
      error: "Test basarisiz",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
