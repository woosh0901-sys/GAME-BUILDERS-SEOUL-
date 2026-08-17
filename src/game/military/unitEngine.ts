import type { Country, EquipmentStock, MilitaryUnit, UnitOrder, UnitTrainingProject, UnitType } from '../../types/game'

export const unitProfiles: Record<UnitType, { manpower: number; equipment: EquipmentStock; combat: number; defense: number; speed: number; supply: number; months: number }> = {
  보병: { manpower: 10000, equipment: { rifles: 8000, support: 300, artillery: 120, vehicles: 0, tanks: 0, transport: 300, airSupport: 0 }, combat: 42, defense: 48, speed: 3, supply: 10, months: 3 },
  기계화: { manpower: 10000, equipment: { rifles: 6000, support: 350, artillery: 180, vehicles: 1200, tanks: 0, transport: 500, airSupport: 0 }, combat: 62, defense: 55, speed: 5, supply: 15, months: 5 },
  전차: { manpower: 9000, equipment: { rifles: 3500, support: 250, artillery: 100, vehicles: 500, tanks: 450, transport: 450, airSupport: 0 }, combat: 78, defense: 58, speed: 6, supply: 18, months: 6 },
  산악: { manpower: 9000, equipment: { rifles: 7500, support: 350, artillery: 100, vehicles: 80, tanks: 0, transport: 250, airSupport: 0 }, combat: 48, defense: 58, speed: 3, supply: 11, months: 4 },
  공수: { manpower: 7000, equipment: { rifles: 5500, support: 450, artillery: 80, vehicles: 60, tanks: 0, transport: 300, airSupport: 400 }, combat: 58, defense: 38, speed: 4, supply: 13, months: 5 },
  해병: { manpower: 8000, equipment: { rifles: 6500, support: 400, artillery: 100, vehicles: 100, tanks: 0, transport: 280, airSupport: 100 }, combat: 55, defense: 50, speed: 4, supply: 13, months: 5 },
}

export const emptyEquipment = (): EquipmentStock => ({ rifles: 0, support: 0, artillery: 0, vehicles: 0, tanks: 0, transport: 0, airSupport: 0 })
const addEquipment = (a: EquipmentStock, b: EquipmentStock): EquipmentStock => Object.fromEntries(Object.keys(a).map((key) => [key, a[key as keyof EquipmentStock] + b[key as keyof EquipmentStock]])) as unknown as EquipmentStock

export function initialMilitary(countries: Country[], territories: Record<string, { id: string }[]>) {
  const commanders = countries.map((country, index) => ({ id: `commander-${country.id}`, countryId: country.id, name: `${country.name} 사령관`, attack: 3 + (index % 3), defense: 3 + ((index + 1) % 3), planning: 2 + (index % 4), logistics: 2 + ((index + 2) % 4), command: 4, trait: index % 2 ? '방어 전문가' : '공세 전문가' }))
  const units: MilitaryUnit[] = []
  const armies = countries.map((country) => { const region = territories[country.id]?.[0]?.id ?? `${country.id}-capital`; const profile = unitProfiles.보병; const unit: MilitaryUnit = { id: `unit-${country.id}-1`, countryId: country.id, name: `${country.name} 제1보병사단`, type: '보병', manpower: profile.manpower, maxManpower: profile.manpower, organization: 72, maxOrganization: 100, morale: 75, training: 55, experience: 10, equipment: { ...profile.equipment }, combatPower: profile.combat, defensePower: profile.defense, speed: profile.speed, supplyUsage: profile.supply, equipmentRatio: 1, regionId: region, commanderId: `commander-${country.id}`, status: '대기', order: '대기' }; units.push(unit); return { id: `army-${country.id}-1`, countryId: country.id, name: `${country.name} 제1군`, unitIds: [unit.id], commanderId: `commander-${country.id}` } })
  const manpowerPools = Object.fromEntries(countries.map((country) => [country.id, Math.max(20000, Math.floor(country.population * 0.015) - 10000)]))
  const equipmentStocks = Object.fromEntries(countries.map((country) => [country.id, { rifles: 24000, support: 1200, artillery: 600, vehicles: 1800, tanks: 700, transport: 1600, airSupport: 600 }]))
  return { commanders, armies, units, manpowerPools, equipmentStocks }
}

export function createTraining(countryId: string, type: UnitType, regionId: string, manpowerPools: Record<string, number>, stocks: Record<string, EquipmentStock>): { project?: UnitTrainingProject; error?: string; manpowerPools: Record<string, number>; stocks: Record<string, EquipmentStock> } {
  const profile = unitProfiles[type]; const pool = manpowerPools[countryId] ?? 0; if (pool < profile.manpower) return { error: '가용 인력이 부족합니다.', manpowerPools, stocks }
  const stock = stocks[countryId] ?? emptyEquipment(); const enough = Object.keys(profile.equipment).every((key) => stock[key as keyof EquipmentStock] >= profile.equipment[key as keyof EquipmentStock])
  if (!enough) return { error: '필요한 장비가 부족합니다. 군수 생산을 먼저 진행하세요.', manpowerPools, stocks }
  const nextStock = Object.fromEntries(Object.keys(stock).map((key) => [key, stock[key as keyof EquipmentStock] - profile.equipment[key as keyof EquipmentStock]])) as unknown as EquipmentStock
  return { project: { id: `training-${Date.now()}`, countryId, name: `${type} 사단`, type, regionId, monthsTotal: profile.months, monthsRemaining: profile.months }, manpowerPools: { ...manpowerPools, [countryId]: pool - profile.manpower }, stocks: { ...stocks, [countryId]: nextStock } }
}

export function completeTraining(project: UnitTrainingProject, index: number): MilitaryUnit {
  const profile = unitProfiles[project.type]; return { id: `unit-${project.countryId}-${Date.now()}-${index}`, countryId: project.countryId, name: `${project.countryId} ${project.name}`, type: project.type, manpower: profile.manpower, maxManpower: profile.manpower, organization: 40, maxOrganization: 100, morale: 65, training: 30, experience: 0, equipment: { ...profile.equipment }, combatPower: profile.combat, defensePower: profile.defense, speed: profile.speed, supplyUsage: profile.supply, equipmentRatio: 1, regionId: project.regionId, status: '대기', order: '대기' }
}

export function setOrder(unit: MilitaryUnit, order: UnitOrder, targetRegionId?: string): MilitaryUnit { return { ...unit, order, targetRegionId, status: order === '공격' ? '공격' : order === '방어' ? '방어' : order === '이동' ? '이동 중' : '대기' } }

export function unitPower(unit: MilitaryUnit, commanderBonus = 1, terrainBonus = 1, supplyRatio = 1) { return Math.max(1, unit.combatPower * unit.equipmentRatio * (0.65 + unit.training / 300 + unit.experience / 500) * (0.5 + unit.organization / 200) * (0.7 + unit.morale / 333) * commanderBonus * terrainBonus * (0.5 + supplyRatio / 2)) }
export function mergeEquipment(a: EquipmentStock, b: EquipmentStock) { return addEquipment(a, b) }
