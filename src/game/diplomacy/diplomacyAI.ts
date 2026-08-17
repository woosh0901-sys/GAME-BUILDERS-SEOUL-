import type { Country, DiplomaticRelation } from '../../types/game'
import { executeDiplomaticAction, type DiplomacyAction } from './diplomacyActions'
import { getRelation, relationKey } from './diplomacyUtils'

const profiles: Record<string, { aggressiveness: number; diplomacy: number; economicFocus: number; alliancePreference: number }> = {
  usa: { aggressiveness: 50, diplomacy: 80, economicFocus: 70, alliancePreference: 90 }, russia: { aggressiveness: 75, diplomacy: 40, economicFocus: 50, alliancePreference: 45 }, japan: { aggressiveness: 30, diplomacy: 80, economicFocus: 75, alliancePreference: 85 }, china: { aggressiveness: 55, diplomacy: 60, economicFocus: 85, alliancePreference: 70 }, germany: { aggressiveness: 45, diplomacy: 70, economicFocus: 75, alliancePreference: 65 }, uk: { aggressiveness: 35, diplomacy: 85, economicFocus: 70, alliancePreference: 80 }, france: { aggressiveness: 35, diplomacy: 80, economicFocus: 75, alliancePreference: 75 }, india: { aggressiveness: 40, diplomacy: 65, economicFocus: 90, alliancePreference: 60 }, brazil: { aggressiveness: 35, diplomacy: 65, economicFocus: 85, alliancePreference: 50 }, han: { aggressiveness: 40, diplomacy: 75, economicFocus: 80, alliancePreference: 75 },
}

export function runDiplomacyAI(countries: Country[], relations: Record<string, DiplomaticRelation>, playerId: string) {
  let nextCountries = countries
  let nextRelations = relations
  const messages: string[] = []
  countries.filter((country) => country.id !== playerId).forEach((actor) => {
    if (Math.random() > 0.28) return
    const profile = profiles[actor.id] ?? profiles.han
    const target = countries.filter((country) => country.id !== actor.id).sort((a, b) => getRelation(nextRelations, actor.id, b.id).opinion - getRelation(nextRelations, actor.id, a.id).opinion)[0]
    if (!target) return
    const relation = getRelation(nextRelations, actor.id, target.id)
    let action: DiplomacyAction | undefined
    if (relation.opinion >= 60 && relation.tradeAgreement && relation.nonAggressionPact && !relation.alliance && profile.alliancePreference > 60) action = 'alliance'
    else if (relation.opinion >= 20 && !relation.tradeAgreement && profile.economicFocus > 60) action = 'trade'
    else if (relation.opinion >= 30 && !relation.nonAggressionPact && profile.diplomacy > 60) action = 'nonAggression'
    else if (!relation.diplomaticMission && relation.opinion < 60 && profile.diplomacy > 55) action = 'mission'
    else if (relation.opinion > -60 && profile.diplomacy > 50) action = 'improve'
    if (!action) return
    const result = executeDiplomaticAction(action, actor.id, target.id, nextCountries, nextRelations)
    if (!result.error) { nextCountries = result.countries; nextRelations = result.relations; messages.push(result.message) }
  })
  return { countries: nextCountries, relations: nextRelations, messages }
}
