import type { Country, ResearchState } from '../../types/game'
import { technologies } from './researchData'
import { createResearchState, getResearchEffects, getResearchable } from './researchUtils'
import { clamp } from '../economy/clamp'

export const normalizeResearch = (country: Country) => country.researchState ?? createResearchState(country)
export const calculateResearchSpeed = (country: Country, state: ResearchState) => state.researchSpeed + (getResearchEffects(state).filter((effect) => effect.includes('연구 속도')).length * 5) + (getResearchEffects(state).some((effect) => effect.includes('연구력')) ? 5 : 0)
export const monthlyResearchPoints = (country: Country, state: ResearchState) => Math.max(1, country.technology * 0.14 + country.industry * 0.035 + country.gdp / 7000 + (getResearchEffects(state).some((effect) => effect.includes('연구력')) ? 3 : 0))

export function startResearch(country: Country, techId: string) {
  const state = normalizeResearch(country)
  const tech = technologies.find((item) => item.id === techId)
  if (!tech) return { country, error: '존재하지 않는 기술입니다.' }
  if (state.activeResearch.includes(techId)) return { country, error: '이미 연구 중인 기술입니다.' }
  if (state.completedTechnologies.includes(techId)) return { country, error: '이미 완료한 기술입니다.' }
  if (state.activeResearch.length >= state.researchSlots) return { country, error: '사용 가능한 연구 슬롯이 없습니다.' }
  if (!getResearchable(state).some((item) => item.id === techId)) return { country, error: '선행 기술이 필요합니다.' }
  return { country: { ...country, researchState: { ...state, activeResearch: [...state.activeResearch, techId], progress: { ...state.progress, [techId]: state.progress[techId] ?? 0 } } } }
}

export function cancelResearch(country: Country, techId: string) { const state = normalizeResearch(country); return { ...country, researchState: { ...state, activeResearch: state.activeResearch.filter((id) => id !== techId), progress: { ...state.progress, [techId]: Math.max(0, (state.progress[techId] ?? 0) * 0.5) } } } }

export function advanceResearch(country: Country) {
  const state = normalizeResearch(country); let next: ResearchState = { ...state, progress: { ...state.progress } }; const completed: string[] = []
  const points = monthlyResearchPoints(country, state); const speed = calculateResearchSpeed(country, state)
  next.activeResearch.forEach((id) => { const tech = technologies.find((item) => item.id === id); if (!tech) return; const progress = (next.progress[id] ?? 0) + points * (1 + speed / 100) / tech.researchMonths * 100 / 100; next.progress[id] = progress; if (progress >= 100) { completed.push(id); next.completedTechnologies = [...next.completedTechnologies, id] } })
  next.activeResearch = next.activeResearch.filter((id) => !completed.includes(id)); next.researchPoints += points
  if (next.completedTechnologies.includes('higher_education') && next.researchSlots < 3) next.researchSlots = 3
  if (next.completedTechnologies.includes('modern_education') && next.researchSlots < 4) next.researchSlots = 4
  return { country: { ...country, researchState: next }, completed, points }
}
