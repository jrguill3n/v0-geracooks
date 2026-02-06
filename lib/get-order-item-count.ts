/**
 * Safely calculates the total item count for an order by summing quantities
 * across all line items. Handles multiple item shapes and defaults quantity to 1 if missing.
 */
export function getOrderItemCount(
  items: Array<Record<string, any>> | undefined | null
): number {
  if (!items || !Array.isArray(items)) return 0

  return items.reduce((total, item) => {
    // Support both { quantity } and { qty } shapes
    const qty = item.quantity ?? item.qty ?? 1
    return total + (typeof qty === "number" && qty > 0 ? qty : 1)
  }, 0)
}

/**
 * Returns a formatted string like "(4 items)" or "(1 item)" with correct pluralization.
 */
export function formatItemCount(count: number): string {
  return `(${count} ${count === 1 ? "item" : "items"})`
}
