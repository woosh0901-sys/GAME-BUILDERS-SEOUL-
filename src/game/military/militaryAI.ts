import type { Country, DiplomaticRelation, RegionState, WarState } from '../../types/game'
import { declareWar, warBetween } from './warEngine'
import { activeWarsFor } from './warEngine'
import { relationKey } from '../diplomacy/diplomacyUtils'

export function runMilitaryAI(countries: Country[], wars: WarState[], relations: Record<string, DiplomaticRelation>, territories: Record<string, RegionState[]>, playerId: string, date: string) {
  let nextCountries = countries
  let nextWars = wars
  let nextRelations = relations
  const messages: string[] = []
  countries.filter((country) => country.id !== playerId && activeWarsFor(wars, country.id).length === 0).forEach((actor) => {
    if (Math.random() > 0.06 || actor.stability < 50) return
    const target = countries.filter((country) => country.id !== actor.id && country.id !== playerId && !warBetween(nextWars, actor.id, country.id)).find((country) => {
      const relation = nextRelations[relationKey(actor.id, country.id)]
      return relation && relation.opinion < -60 && actor.military > country.military * 1.4
    })
    if (!target) return
    const result = declareWar(actor.id, target.id, nextCountries, nextWars, nextRelations, territories, date)
    if (!result.error && result.war) { nextCountries = result.countries!; nextWars = [...nextWars, result.war]; nextRelations = result.relations!; messages.push(result.message!) }
  })
  return { countries: nextCountries, wars: nextWars, relations: nextRelations, territories, messages }
}
