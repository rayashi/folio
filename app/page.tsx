import { Suspense } from "react";
import { AllocationDashboard } from "@/components/allocation-dashboard";
import { assetAllocation } from "@/app/config";
import { fetchMarketQuotes, fetchUsdBrlRate, listedCodes } from "@/lib/quotes";

export default function Home() {
  return (
    <Suspense
      fallback={
        <AllocationDashboard
          allocation={assetAllocation}
          initialUsdBrlRate={null}
          initialQuotes={{}}
          pending
        />
      }
    >
      <QuotedAllocation />
    </Suspense>
  );
}

async function QuotedAllocation() {
  let quotes: Record<string, number> = {};
  let usdBrlRate: number | null = null;
  let error: string | null = null;
  try {
    [quotes, usdBrlRate] = await Promise.all([
      fetchMarketQuotes(listedCodes(assetAllocation)),
      fetchUsdBrlRate(),
    ]);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Falha ao buscar cotações.";
  }

  return (
    <AllocationDashboard
      allocation={assetAllocation}
      initialUsdBrlRate={usdBrlRate}
      initialQuotes={quotes}
      initialError={error}
    />
  );
}
