import type { Country, TechnologyState } from '../../types/game'
import { technologies } from './researchData'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export function createTechnologyState(country: Country): TechnologyState {
  const level = clamp(country.technology)
  return { overallLevel: level, researchBudget: 1.5, researchCapacity: clamp(country.technology * 0.7), technologyInfrastructure: clamp(country.industry * 0.65 + country.technology * 0.2), utilization: clamp(level * 0.7), technologyGap: clamp(70 - level), nationalCapability: clamp(country.economy * 0.35 + country.industry * 0.35 + level * 0.3), specialization: {}, commercialization: {}, technologyDependency: clamp(70 - level), technologySelfSufficiency: level * 0.65, brainGain: 0, brainDrain: 0, obsolescence: 8 }
}

export function normalizeTechnology(country: Country): TechnologyState { return country.technologyState ?? createTechnologyState(country) }

export function updateTechnology(country: Country): Country {
  const previous = normalizeTechnology(country)
  const research = country.researchState
  const completed = research?.completedTechnologies ?? []
  const completedDefinitions = technologies.filter((technology) => completed.includes(technology.id))
  const categoryCounts = completedDefinitions.reduce<Record<string, number>>((counts, technology) => { counts[technology.category] = (counts[technology.category] ?? 0) + 1; return counts }, {})
  const specialization = Object.fromEntries(Object.entries(categoryCounts).map(([category, count]) => [category, clamp(count * 12 + (previous.specialization[category] ?? 0) * 0.4)]))
  const infrastructure = clamp(previous.technologyInfrastructure + (country.economicState?.privateInvestment ?? 0) / Math.max(1, country.gdp) * 0.2 + (country.gdpGrowth > 0 ? 0.08 : -0.03))
  const education = country.socialState?.education ?? country.technology * 0.75
  const researchCapacity = clamp(previous.researchCapacity + (education > 60 ? 0.15 : 0) + (country.gdpGrowth > 2 ? 0.1 : -0.03))
  const utilization = clamp((country.technology * 0.35 + infrastructure * 0.35 + education * 0.3))
  const overallLevel = clamp(previous.overallLevel + completedDefinitions.length * 0.015 + (researchCapacity > 60 ? 0.08 : 0))
  const commercialization = Object.fromEntries(completedDefinitions.map((technology) => [technology.id, clamp((previous.commercialization[technology.id] ?? 0) + (utilization / 100) * 3)]))
  const brainGain = country.diplomaticState && country.diplomaticState.internationalReputation > 20 ? 0.1 : 0
  const brainDrain = country.stability < 35 ? 0.15 : 0
  const nationalCapability = clamp(country.economy * 0.25 + country.industry * 0.25 + overallLevel * 0.25 + education * 0.15 + infrastructure * 0.1)
  const next: TechnologyState = { ...previous, overallLevel, researchCapacity, technologyInfrastructure: infrastructure, utilization, technologyGap: clamp(75 - overallLevel), nationalCapability, specialization, commercialization, technologyDependency: clamp(75 - overallLevel + (infrastructure < 40 ? 8 : 0)), technologySelfSufficiency: clamp(overallLevel * 0.65 + infrastructure * 0.25), brainGain, brainDrain, obsolescence: clamp(previous.obsolescence + (completedDefinitions.length ? -0.03 : 0.05)) }
  const industrialEffect = (utilization - 50) * 0.001
  const militaryEffect = (completed.includes('modern_military') || completed.includes('combined_arms') ? 0.12 : 0)
  return { ...country, technologyState: next, industry: Math.max(1, country.industry * (1 + industrialEffect)), military: Math.max(1, country.military * (1 + militaryEffect * 0.01)) }
}
