import type { Country, DiplomaticRelation } from '../../types/game'
import { clamp } from '../economy/clamp'
import { getRelation, relationKey, updateRelation } from './diplomacyUtils'

export function updateDiplomaticRelations(countries: Country[], relations: Record<string, DiplomaticRelation>) {
  const next = { ...relations }
  Object.entries(next).forEach(([key, relation]) => {
    const first = countries.find((country) => country.id === relation.countryA)!
    const second = countries.find((country) => country.id === relation.countryB)!
    let opinionDelta = (relation.tradeAgreement ? 0.5 : 0) + (relation.nonAggressionPact ? 0.2 : 0) + (relation.alliance ? 0.3 : 0) + (relation.diplomaticMission ? 2 : 0)
    const militaryGap = Math.abs(first.military - second.military)
    const tensionDelta = militaryGap > 35 && !relation.nonAggressionPact ? 1 : relation.nonAggressionPact ? -0.3 : -0.05
    if (relation.tension > 60) opinionDelta -= 0.3
    next[key] = updateRelation(relation, opinionDelta, tensionDelta)
  })
  return next
}
