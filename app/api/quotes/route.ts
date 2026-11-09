import { assetAllocation } from "@/app/config";
import { fetchMarketQuotes, fetchUsdBrlRate, listedCodes } from "@/lib/quotes";

export async function GET() {
  try {
    const [quotes, usdBrlRate] = await Promise.all([
      fetchMarketQuotes(listedCodes(assetAllocation)),
      fetchUsdBrlRate(),
    ]);
    return Response.json({ quotes, usdBrlRate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao buscar cotações.";
    return Response.json({ error: message }, { status: 502 });
  }
}
