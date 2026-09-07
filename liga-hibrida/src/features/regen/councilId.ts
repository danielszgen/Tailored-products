/** Adjustment id that stores the Markdown report of a closed council (one per week). */
export function councilAdjustmentId(weekStart: string): string {
  return `council_${weekStart}`;
}
