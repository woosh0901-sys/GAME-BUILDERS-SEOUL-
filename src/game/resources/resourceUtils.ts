import type { ResourceProduction, ResourceStockpile } from '../../types/game'
export const emptyResources = (): ResourceProduction => ({ oil: 0, iron: 0, coal: 0, aluminum: 0, rareMaterials: 0, uranium: 0 })
export const addResources = (a: ResourceStockpile, b: ResourceProduction): ResourceStockpile => ({ oil: a.oil + b.oil, iron: a.iron + b.iron, coal: a.coal + b.coal, aluminum: a.aluminum + b.aluminum, rareMaterials: a.rareMaterials + b.rareMaterials, uranium: a.uranium + b.uranium })
export const resourceLabels: Record<keyof ResourceProduction, string> = { oil: '석유', iron: '철', coal: '석탄', aluminum: '알루미늄', rareMaterials: '희귀 자원', uranium: '우라늄' }
