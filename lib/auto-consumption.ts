export type AutoConsumptionItem = {
  id: string
  item_name: string
  store_id: string | null
  store_name: string | null
  current_stock: number
  target_stock: number
  threshold_percent: number
  auto_add_enabled: boolean
  last_auto_added_at: string | null
}

export function getStockPercentage(current: number, target: number) {
  if (!target || target <= 0) return 0
  return (current / target) * 100
}

export function shouldAutoAdd(item: AutoConsumptionItem) {
  if (!item.auto_add_enabled) return false
  if (item.target_stock <= 0) return false

  const stockPercent = getStockPercentage(item.current_stock, item.target_stock)
  return stockPercent <= item.threshold_percent
}

export function getSuggestedPurchaseQuantity(current: number, target: number) {
  const needed = Math.ceil(target - current)
  return needed > 0 ? needed : 0
}