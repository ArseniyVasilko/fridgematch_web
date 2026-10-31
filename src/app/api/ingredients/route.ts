import { NextResponse, type NextRequest } from "next/server";
import { DURATIONS, LIMITS } from "@/lib/constants";
import { suggestIngredients } from "@/lib/recipes";

/** GET /api/ingredients?q=tom -> ["Tomatoes", "Tomato Puree", ...] */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, LIMITS.ingredientNameLength);
  const suggestions = await suggestIngredients(q);
  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": `public, max-age=${DURATIONS.ingredientSuggestionsCacheSeconds}` } },
  );
}
