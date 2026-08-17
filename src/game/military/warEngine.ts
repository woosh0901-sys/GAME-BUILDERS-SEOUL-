import type { Country, DiplomaticRelation, RegionState, WarState } from '../../types/game'
import { clamp } from '../economy/clamp'
import { relationKey, updateRelation } from '../diplomacy/diplomacyUtils'
import { militaryPower, updateMilitary } from './militaryEngine'

export const activeWarsFor = (wars: WarState[], id: string) => wars.filter((war) => war.active && (war.attacker === id || war.defender === id))
export const warBetween = (wars: WarState[], a: string, b: string) => wars.find((war) => war.active && ((war.attacker === a && war.defender === b) || (war.attacker === b && war.defender === a)))

export function declareWar(actorId: string, targetId: string, countries: Country[], wars: WarState[], relations: Record<string, DiplomaticRelation>, territories: Record<string, RegionState[]>, date: string) {
  const actor = countries.find((country) => country.id === actorId)!
  const target = countries.find((country) => country.id === targetId)!
  const relation = relations[relationKey(actorId, targetId)]
  if (!target || actorId === targetId) return { error: '자기 자신에게 전쟁을 선포할 수 없습니다.' }
  if (activeWarsFor(wars, actorId).length >= 2) return { error: '동시에 진행할 수 있는 전쟁은 최대 2개입니다.' }
  if (warBetween(wars, actorId, targetId)) return { error: '이미 전쟁 중인 국가입니다.' }
  if (relation?.nonAggressionPact) return { error: '불가침 협정이 체결되어 있어 전쟁을 선포할 수 없습니다.' }
  if (actor.treasury < 50) return { error: '전쟁을 시작하려면 국고 50이 필요합니다.' }
  if (actor.stability < 25) return { error: '안정도가 너무 낮아 전쟁을 시작할 수 없습니다.' }
  const war: WarState = { id: `${actorId}-${targetId}-${Date.now()}`, attacker: actorId, defender: targetId, startDate: date, warScoreAttacker: 0, warScoreDefender: 0, active: true, months: 0 }
  const baseRelation = relation ?? { countryA: actorId, countryB: targetId, opinion: 0, tradeAgreement: false, nonAggressionPact: false, alliance: false, diplomaticMission: false, tension: 0 }
  const nextRelations = { ...relations, [relationKey(actorId, targetId)]: updateRelation(baseRelation, -35, 55) }
  const nextCountries = countries.map((country) => country.id === actorId ? { ...country, treasury: country.treasury - 50, stability: clamp(country.stability - 4, 0, 100) } : country.id === targetId ? { ...country, stability: clamp(country.stability - 4, 0, 100) } : country)
  return { war, relations: nextRelations, countries: nextCountries, territories, message: `${actor.name}이(가) ${target.name}에 전쟁을 선포했습니다. ${actor.name}과(와) ${target.name} 사이에 전쟁이 시작되었습니다.` }
}

export function advanceWars(countries: Country[], wars: WarState[], territories: Record<string, RegionState[]>) {
  let nextCountries = countries.map((country) => ({ ...country }))
  const nextWars = wars.map((war) => ({ ...war }))
  const nextTerritories: Record<string, RegionState[]> = Object.fromEntries(Object.entries(territories).map(([id, regions]) => [id, regions.map((region) => ({ ...region }))]))
  const messages: string[] = []
  nextWars.forEach((war) => {
    if (!war.active) return
    const attacker = nextCountries.find((country) => country.id === war.attacker)!
    const defender = nextCountries.find((country) => country.id === war.defender)!
    const attackRoll = militaryPower(attacker) * (0.85 + Math.random() * 0.3)
    const defenseRoll = militaryPower(defender) * (0.85 + Math.random() * 0.3)
    const difference = clamp((attackRoll - defenseRoll) / Math.max(attackRoll, defenseRoll) * 18, -12, 12)
    war.warScoreAttacker = clamp(war.warScoreAttacker + difference, -100, 100)
    war.warScoreDefender = -war.warScoreAttacker
    war.months += 1
    const winner = difference >= 0 ? war.attacker : war.defender
    const loser = winner === war.attacker ? war.defender : war.attacker
    if (Math.abs(difference) > 3) {
      const loserCountry = nextCountries.find((country) => country.id === loser)!
      loserCountry.militaryState = { ...loserCountry.militaryState, manpower: Math.max(0, loserCountry.militaryState.manpower - Math.abs(difference) * 0.22), equipment: Math.max(0, loserCountry.militaryState.equipment - Math.abs(difference) * 0.18), morale: clamp(loserCountry.militaryState.morale - Math.abs(difference) * 0.08, 0, 100) }
      if (Math.random() < 0.32) {
        const loserRegions = nextTerritories[loser] ?? []
        const regionIndex = loserRegions.findIndex((region) => !region.capital)
        if (regionIndex >= 0) {
          const [captured] = loserRegions.splice(regionIndex, 1)
          nextTerritories[winner] = [...(nextTerritories[winner] ?? []), captured]
          messages.push(`${nextCountries.find((country) => country.id === winner)!.name}군이 ${captured.name} 지역을 점령했습니다.`)
        }
      }
    }
    if (war.warScoreAttacker <= -90 || war.warScoreAttacker >= 90 || war.months >= 36) { war.active = false; messages.push(`${attacker.name}과(와) ${defender.name}의 전쟁이 종료되었습니다.`) }
  })
  return { countries: nextCountries, wars: nextWars, territories: nextTerritories, messages }
}
