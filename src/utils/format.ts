export const formatMoney = (billions: number) => billions >= 1000 ? `$${(billions / 1000).toFixed(2)}T` : `$${billions.toFixed(1)}B`
export const formatPopulation = (millions: number) => {
  const man = Math.round(millions * 100)
  if (man >= 10000) return `${Math.floor(man / 10000)}억 ${(man % 10000).toLocaleString()}만`
  return `${man.toLocaleString()}만`
}
export const formatSigned = (value: number, suffix = '') => `${value >= 0 ? '+' : ''}${value.toFixed(2)}${suffix}`
