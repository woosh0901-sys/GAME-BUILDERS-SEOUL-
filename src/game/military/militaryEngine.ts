import type { Country } from '../../types/game'
import { clamp } from '../economy/clamp'

export const militaryPower = (country: Country) => {
  const m = country.militaryState ?? { manpower: country.population * 2, army: country.military, navy: country.military / 2, airForce: country.military / 2, militaryIndustry: country.industry, equipment: country.military, organization: 70, morale: country.stability }
  const completed = country.researchState?.completedTechnologies ?? []
  const bonus = (completed.includes('modern_military') ? 0.05 : 0) + (completed.includes('mechanized_forces') ? 0.1 : 0) + (completed.includes('combined_arms') ? 0.15 : 0) + (completed.includes('precision_strike') ? 0.15 : 0) + (completed.includes('military_ai') ? 0.15 : 0) + (completed.includes('artificial_intelligence') ? 0.05 : 0)
  return Math.max(1, Math.round((m.manpower * 0.12 + m.army * 0.42 + m.navy * 0.12 + m.airForce * 0.14 + m.equipment * 0.08 + country.technology * 0.06 + m.militaryIndustry * 0.04 + m.organization * 0.04 + m.morale * 0.04) * (1 + bonus)))
}

export function updateMilitary(country: Country, atWar: boolean) {
  const m = country.militaryState ?? { manpower: country.population * 2, army: country.military, navy: country.military / 2, airForce: country.military / 2, militaryIndustry: country.industry, equipment: country.military, organization: 70, morale: country.stability }
  const production = m.militaryIndustry * (1 + country.technology / 200) * 0.018
  const maintenance = m.manpower * 0.012 + m.equipment * 0.18 + m.militaryIndustry * 0.15 + (atWar ? 18 : 0)
  const paid = country.treasury >= maintenance
  const next = { ...m, equipment: clamp(m.equipment + production - (atWar ? 0.35 : 0.15), 0, 100), organization: clamp(m.organization + (paid ? 0.25 : -2.5), 0, 100), morale: clamp(m.morale + (paid ? 0.12 : -2), 0, 100) }
  return { country: { ...country, treasury: Math.max(0, country.treasury - maintenance), military: militaryPower({ ...country, militaryState: next }), militaryState: next }, paid, maintenance }
}
