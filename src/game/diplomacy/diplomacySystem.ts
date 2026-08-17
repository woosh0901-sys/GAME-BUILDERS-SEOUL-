import type { Country, DiplomaticRelation, DiplomaticState } from '../../types/game'
import { relationKey, relationStatus } from './diplomacyUtils'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export function createDiplomaticState(country: Country): DiplomaticState {
  return { diplomaticPower: clamp(country.gdp / 40 + country.stability * 0.2), foreignPolicy: '균형', internationalReputation: 0, worldTension: 0, regionalTension: {}, influence: {}, activeTreaties: [] }
}

export function normalizeDiplomaticState(country: Country): DiplomaticState {
  return country.diplomaticState ?? createDiplomaticState(country)
}

export function calculateDiplomaticPower(country: Country, reputation = 0) {
  return clamp(country.gdp / 35 + country.military * 0.35 + country.stability * 0.2 + reputation * 0.2)
}

export function updateDiplomacy(countries: Country[], relations: Record<string, DiplomaticRelation>, wars: { attacker: string; defender: string }[] = []) {
  const nextRelations: Record<string, DiplomaticRelation> = {}
  const influenceByCountry: Record<string, Record<string, number>> = {}
  const powers = Object.fromEntries(countries.map((country) => [country.id, calculateDiplomaticPower(country, normalizeDiplomaticState(country).internationalReputation)]))
  let tensionTotal = 0
  Object.entries(relations).forEach(([key, relation]) => {
    const first = countries.find((country) => country.id === relation.countryA)
    const second = countries.find((country) => country.id === relation.countryB)
    if (!first || !second) return
    const atWar = wars.some((war) => (war.attacker === first.id && war.defender === second.id) || (war.attacker === second.id && war.defender === first.id))
    const militaryGap = Math.abs(first.military - second.military)
    const economicDependence = clamp(((first.economicState?.imports ?? first.gdp * 0.1) / Math.max(1, first.gdp)) * 100 + (relation.tradeAgreement ? 15 : 0))
    const historicalTension = clamp(relation.historicalTension ?? Math.max(0, -relation.opinion * 0.25))
    const threat = clamp((relation.threat ?? 0) + (militaryGap > 45 ? 0.3 : -0.15) + (atWar ? 6 : 0) + (second.military > first.military * 1.5 ? 0.25 : 0))
    const trust = clamp((relation.trust ?? 50) + (relation.tradeAgreement ? 0.25 : 0) + (relation.nonAggressionPact ? 0.2 : 0) - (atWar ? 5 : 0))
    const opinion = clamp((relation.opinion + (trust - 50) * 0.01 - historicalTension * 0.005 + (relation.diplomaticMission ? 0.15 : 0)), -100, 100)
    const tension = clamp(relation.tension + (atWar ? 4 : threat > 60 ? 0.25 : -0.1) - (relation.nonAggressionPact ? 0.2 : 0))
    const strategicValue = clamp(second.resourceProduction * 0.6 + second.gdp / 100 + (first.id === 'han' && second.id === 'japan' ? 15 : 0))
    const diplomaticInfluence = clamp(powers[first.id] * 0.7 + (relation.tradeAgreement ? 8 : 0) + (relation.alliance ? 18 : 0))
    const relationshipType = relation.alliance ? '동맹' : relation.tradeAgreement && opinion >= 40 ? '협력' : relationStatus(opinion) as DiplomaticRelation['relationshipType']
    nextRelations[key] = { ...relation, opinion: Number(opinion.toFixed(1)), trust: Number(trust.toFixed(1)), threat: Number(threat.toFixed(1)), diplomaticInfluence: Number(diplomaticInfluence.toFixed(1)), economicDependence: Number(economicDependence.toFixed(1)), militaryDependence: Number(clamp(first.military / Math.max(1, second.military) * 30).toFixed(1)), ideologicalCompatibility: Number(clamp(100 - Math.abs((first.politicalState?.nationalism ?? 50) - (second.politicalState?.nationalism ?? 50))).toFixed(1)), historicalTension: Number(historicalTension.toFixed(1)), strategicValue: Number(strategicValue.toFixed(1)), relationshipType, lastReasons: [relation.tradeAgreement ? '무역 협정' : '', relation.alliance ? '동맹 관계' : '', atWar ? '전쟁 중' : '', threat > 60 ? '상대 군사력 증가' : ''].filter(Boolean) }
    tensionTotal += tension
    influenceByCountry[first.id] = influenceByCountry[first.id] ?? {}
    influenceByCountry[first.id][second.id] = diplomaticInfluence
  })
  const worldTension = clamp((tensionTotal / Math.max(1, Object.keys(nextRelations).length)) * 0.7 + wars.length * 5)
  const countriesWithState = countries.map((country) => {
    const previous = normalizeDiplomaticState(country)
    const reputation = clamp(previous.internationalReputation + (country.stability > 65 ? 0.05 : -0.05) - (wars.some((war) => war.attacker === country.id) ? 0.2 : 0), -100, 100)
    return { ...country, diplomaticState: { ...previous, diplomaticPower: calculateDiplomaticPower(country, reputation), internationalReputation: Number(reputation.toFixed(1)), worldTension, influence: influenceByCountry[country.id] ?? previous.influence } }
  })
  return { countries: countriesWithState, relations: nextRelations, worldTension }
}
