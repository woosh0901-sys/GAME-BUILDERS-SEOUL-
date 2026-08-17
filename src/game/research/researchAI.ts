import type { Country } from '../../types/game'
import { getResearchable } from './researchUtils'
import { startResearch } from './researchEngine'
import { technologies } from './researchData'

export function runResearchAI(countries: Country[], playerId: string) {
  let next = countries
  const messages: string[] = []
  countries.filter((country) => country.id !== playerId).forEach((country) => {
    let updated = country
    const state = updated.researchState
    if (!state || state.activeResearch.length >= state.researchSlots) return
    const choice = getResearchable(state).sort((a, b) => b.aiWeight - a.aiWeight)[0]
    if (choice) {
      const result = startResearch(updated, choice.id)
      if (!result.error) { updated = result.country; messages.push(`${updated.name}이(가) ${choice.name} 연구를 시작했습니다.`) }
    }
    next = next.map((item) => item.id === updated.id ? updated : item)
  })
  return { countries: next, messages }
}
