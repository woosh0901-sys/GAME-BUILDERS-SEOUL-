import type { Country, DiplomaticRelation } from '../../types/game'
import { clamp } from '../economy/clamp'

export const relationKey = (a: string, b: string) => [a, b].sort().join('::')
export const relationStatus = (opinion: number) => opinion <= -75 ? '적대' : opinion <= -25 ? '긴장' : opinion < 25 ? '중립' : opinion < 75 ? '우호' : '매우 우호'
export const tensionStatus = (tension: number) => tension <= 20 ? '안정' : tension <= 40 ? '주의' : tension <= 60 ? '긴장' : tension <= 80 ? '고조' : '위기'
export const getRelation = (relations: Record<string, DiplomaticRelation>, a: string, b: string) => relations[relationKey(a, b)]

export function createInitialRelations(countries: Country[]) {
  const result: Record<string, DiplomaticRelation> = {}
  const hanOpinions: Record<string, number> = { usa: 65, japan: 45, china: -20, russia: 5, germany: 25, uk: 25, france: 20, india: 15, brazil: 10 }
  countries.forEach((first, index) => countries.slice(index + 1).forEach((second, offset) => {
    const opinion = first.id === 'han' ? hanOpinions[second.id] ?? 0 : Math.round(((index * 17 + offset * 11) % 61) - 20)
    result[relationKey(first.id, second.id)] = { countryA: first.id, countryB: second.id, opinion, tradeAgreement: false, nonAggressionPact: false, alliance: false, diplomaticMission: false, tension: Math.max(0, 35 - opinion / 3) }
  }))
  return result
}

export const updateRelation = (relation: DiplomaticRelation, opinionDelta = 0, tensionDelta = 0): DiplomaticRelation => ({ ...relation, opinion: clamp(Math.round((relation.opinion + opinionDelta) * 10) / 10, -100, 100), tension: clamp(Math.round((relation.tension + tensionDelta) * 10) / 10, 0, 100) })
