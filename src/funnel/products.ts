/* TAM Black Friday 2026 — resolves the four Payments products.
   Explicit IDs (env vars or src/funnel/config.ts) always win. Anything left
   blank is looked up in this project's Payments catalog by its price, so the
   funnel starts selling as soon as the products exist in More → Payments. */
import { listCatalogProducts, type CatalogProduct } from "../integrations/payments";
import { TAM_FUNNEL } from "./config";

export type ProductRef = { productId: string; priceId: string };
export type FunnelProducts = {
  main: ProductRef | null;
  bump: ProductRef | null;
  upsell: ProductRef | null;
  plan: ProductRef | null;
};

const explicit = (productId: string, priceId: string): ProductRef | null =>
  productId && priceId ? { productId, priceId } : null;

/** The one price in the catalog matching amount + billing type; null when none or ambiguous. */
function findByPrice(
  products: CatalogProduct[],
  amount: number,
  recurring: boolean,
): ProductRef | null {
  const hits: ProductRef[] = [];
  for (const product of products) {
    for (const price of product.prices ?? []) {
      const isRecurring = price.type === "recurring" || Boolean(price.recurring);
      if (price.amount === amount && isRecurring === recurring && !price.sold_out) {
        hits.push({ productId: product.id, priceId: price.id });
      }
    }
  }
  return hits.length === 1 ? (hits[0] ?? null) : null;
}

let cached: Promise<FunnelProducts> | undefined;

export function resolveFunnelProducts(): Promise<FunnelProducts> {
  cached ??= (async () => {
    const out: FunnelProducts = {
      main: explicit(TAM_FUNNEL.MAIN_PRODUCT_ID, TAM_FUNNEL.MAIN_PRICE_ID),
      bump: explicit(TAM_FUNNEL.BUMP_PRODUCT_ID, TAM_FUNNEL.BUMP_PRICE_ID),
      upsell: explicit(TAM_FUNNEL.UPSELL_PRODUCT_ID, TAM_FUNNEL.UPSELL_PRICE_ID),
      plan: explicit(TAM_FUNNEL.PLAN_PRODUCT_ID, TAM_FUNNEL.PLAN_PRICE_ID),
    };
    if (out.main && out.bump && out.upsell && out.plan) return out;
    try {
      const page = await listCatalogProducts({ limit: 100 });
      const products = page.products ?? [];
      out.main ??= findByPrice(products, 97, false);
      out.bump ??= findByPrice(products, 47, false);
      out.upsell ??= findByPrice(products, 997, false);
      out.plan ??= findByPrice(products, 197, true);
    } catch (err) {
      console.warn("[tam-funnel] Payments catalog lookup failed.", err);
    }
    return out;
  })();
  return cached;
}
