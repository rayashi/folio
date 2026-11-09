import type { AllocationInput } from "@/lib/portfolio";

/**
 * Sample allocation. Copy this file to app/config.ts and replace the holdings.
 * app/config.ts is gitignored. The export name must stay `assetAllocation`.
 *
 * Inside each class, `targetPercentage` is the share of that class and the
 * children should add up to 100. A class holds nested `classes` or `assets`.
 */
export const assetAllocation = {
  targetPercentage: 100,
  classes: [
    {
      name: "Internacional",
      targetPercentage: 70,
      classes: [
        {
          name: "ETFs",
          targetPercentage: 100,
          assets: [
            {
              code: "VOO",
              targetPercentage: 60,
              holdingQuantity: 10,
            },
            {
              code: "SCHH",
              targetPercentage: 40,
              holdingQuantity: 25,
            },
          ],
        },
      ],
    },
    {
      name: "Nacional",
      targetPercentage: 30,
      classes: [
        {
          name: "Ações",
          targetPercentage: 60,
          assets: [
            {
              code: "WEGE3",
              targetPercentage: 100,
              holdingQuantity: 100,
            },
          ],
        },
        {
          name: "Renda fixa",
          targetPercentage: 30,
          assets: [
            {
              code: "CDB",
              targetPercentage: 100,
              balance: 50000,
              currency: "BRL",
            },
          ],
        },
        {
          name: "Caixa",
          targetPercentage: 10,
          assets: [
            {
              code: "Saldo corretora",
              targetPercentage: 100,
              balance: 1000,
              currency: "USD",
            },
          ],
        },
      ],
    },
  ],
} satisfies AllocationInput;
