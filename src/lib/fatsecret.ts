const FS_TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const FS_API_URL = "https://platform.fatsecret.com/rest/server.api";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("FATSECRET_CLIENT_ID veya FATSECRET_CLIENT_SECRET tanimli degil");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(FS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!res.ok) {
    throw new Error(`FatSecret token hatasi (${res.status})`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function apiCall(params: Record<string, string>): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const url = new URL(FS_API_URL);
  url.searchParams.set("format", "json");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`FatSecret API hatasi (${res.status})`);
  }

  return res.json();
}

export interface SearchResult {
  food_id: string;
  food_name: string;
  food_description: string;
  brand_name?: string;
}

export interface Serving {
  serving_id: string;
  serving_description: string;
  calories: string;
  protein: string;
  carbohydrate: string;
  fat: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
}

export interface FoodDetail extends SearchResult {
  servings: Serving[];
}

export async function searchFoods(query: string): Promise<SearchResult[]> {
  const data = await apiCall({
    method: "foods.search",
    search_expression: query,
    max_results: "10",
  });

  const foods = (data as Record<string, unknown>)?.foods as Record<string, unknown> | undefined;
  const foodList = foods?.food;
  if (!foodList) return [];

  const list = Array.isArray(foodList) ? foodList : [foodList];
  return list.map((f: Record<string, unknown>) => ({
    food_id: String(f.food_id ?? ""),
    food_name: String(f.food_name ?? ""),
    food_description: String(f.food_description ?? ""),
    brand_name: f.brand_name ? String(f.brand_name) : undefined,
  }));
}

export async function getFood(foodId: string): Promise<FoodDetail | null> {
  const data = await apiCall({ method: "food.get", food_id: foodId });

  const food = (data as Record<string, unknown>)?.food as Record<string, unknown> | undefined;
  if (!food) return null;

  const servings = food.servings as Record<string, unknown> | undefined;
  const servingList = servings?.serving;
  const servingArr = servingList
    ? Array.isArray(servingList)
      ? servingList
      : [servingList]
    : [];

  return {
    food_id: String(food.food_id ?? ""),
    food_name: String(food.food_name ?? ""),
    food_description: String(food.food_description ?? ""),
    brand_name: food.brand_name ? String(food.brand_name) : undefined,
    servings: servingArr.map((s: Record<string, unknown>) => ({
      serving_id: String(s.serving_id ?? ""),
      serving_description: String(s.serving_description ?? ""),
      calories: String(s.calories ?? "0"),
      protein: String(s.protein ?? "0"),
      carbohydrate: String(s.carbohydrate ?? "0"),
      fat: String(s.fat ?? "0"),
      metric_serving_amount: s.metric_serving_amount ? String(s.metric_serving_amount) : undefined,
      metric_serving_unit: s.metric_serving_unit ? String(s.metric_serving_unit) : undefined,
    })),
  };
}

export async function findFoodByBarcode(barcode: string): Promise<FoodDetail | null> {
  const data = await apiCall({
    method: "food.find_id_for_barcode",
    barcode,
  });

  const foodId = (data as Record<string, unknown>)?.food_id as
    | { value: string }
    | string
    | undefined;

  const id = typeof foodId === "object" ? foodId?.value : foodId;
  if (!id) return null;

  return getFood(String(id));
}
