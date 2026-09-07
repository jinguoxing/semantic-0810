/**
 * Marketplace resources and registry metrics have different ID spaces.
 * Keep the approved cross-reference here instead of treating a resource ID
 * as a canonical metric ID at individual navigation sites.
 */
export const MARKETPLACE_RESOURCE_METRIC_REFERENCES = {
  'res-03': { canonicalMetricId: 'met_001' }
} as const;

export function getCanonicalMetricIdForMarketplaceResource(resourceId?: string): string | undefined {
  if (!resourceId) return undefined;
  return MARKETPLACE_RESOURCE_METRIC_REFERENCES[resourceId.trim() as keyof typeof MARKETPLACE_RESOURCE_METRIC_REFERENCES]?.canonicalMetricId;
}
