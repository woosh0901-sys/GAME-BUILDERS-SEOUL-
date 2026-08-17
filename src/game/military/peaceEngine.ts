import type { Country, RegionState, WarState } from '../../types/game'

export function makePeace(war: WarState, countries: Country[], territories: Record<string, RegionState[]>) {
  const attacker = countries.find((country) => country.id === war.attacker)!
  const defender = countries.find((country) => country.id === war.defender)!
  return { wars: { ...war, active: false }, territories, message: `${attacker.name}과(와) ${defender.name}이(가) 평화 협정을 체결했습니다.` }
}
