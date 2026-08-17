import type { Country, ResearchState } from '../../types/game'
import { technologies } from './researchData'

export const createResearchState = (country: Country): ResearchState => {
  const initial: Record<string, string[]> = { usa: ['basic_science', 'higher_education', 'electronics', 'modern_military', 'economics'], japan: ['basic_science', 'higher_education', 'electronics', 'industrialization_2', 'economics'], china: ['basic_science', 'industrialization_2', 'modern_military', 'economics'], han: ['basic_science', 'higher_education', 'electronics', 'industrialization_2', 'economics'], russia: ['basic_science', 'modern_military', 'industrialization_1', 'economics'] }
  const completedTechnologies = initial[country.id] ?? ['basic_science', 'economics']
  return { researchPoints: 0, researchSpeed: 15 + country.technology * 0.25, activeResearch: [], progress: {}, completedTechnologies, researchSlots: 2 }
}

export const getResearchable = (state: ResearchState) => technologies.filter((tech) => !state.completedTechnologies.includes(tech.id) && tech.prerequisites.every((id) => state.completedTechnologies.includes(id)))
export const getResearchEffects = (state: ResearchState) => technologies.filter((tech) => state.completedTechnologies.includes(tech.id)).flatMap((tech) => tech.effects)
