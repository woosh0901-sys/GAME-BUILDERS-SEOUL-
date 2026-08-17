import type { Country } from '../../types/game'
import { clamp } from './clamp'

export interface CountryEconomyUpdate {
  country: Country
  gdpDelta: number
  gdpPercent: number
  treasuryDelta: number
}

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals))

export function updateCountryEconomy(country: Country): CountryEconomyUpdate {
  const completed = country.researchState?.completedTechnologies ?? []
  const researchGrowth = (completed.includes('economics') ? 0.2 : 0) + (completed.includes('modern_finance') ? 0.3 : 0) + (completed.includes('internet') ? 0.3 : 0) + (completed.includes('social_digitalization') ? 0.15 : 0)
  const researchIndustry = (completed.includes('industrialization_1') ? 0.05 : 0) + (completed.includes('industrialization_2') ? 0.08 : 0) + (completed.includes('automation') ? 0.1 : 0) + (completed.includes('advanced_manufacturing') ? 0.15 : 0) + (completed.includes('electronics') ? 0.03 : 0) + (completed.includes('artificial_intelligence') ? 0.1 : 0)
  const annualGrowth = clamp(
    country.gdpGrowth +
      researchGrowth +
      (country.industry - 60) * 0.025 +
      (country.technology - 60) * 0.01 +
      (country.stability - 60) * 0.012 +
      (country.resourceProduction - 50) * 0.004 -
      country.inflation * 0.08 - country.unemployment * 0.03,
    -4,
    10,
  )
  const monthlyGrowth = annualGrowth / 12 / 100
  const gdp = Math.max(1, round(country.gdp * (1 + monthlyGrowth), 3))
  const populationGrowth = clamp(0.65 + annualGrowth * 0.035 + (country.stability - 50) * 0.006, -0.2, 1.4) / 12 / 100
  const population = Math.max(0.1, round(country.population * (1 + populationGrowth), 3))
  const taxRevenue = gdp * 0.018
  const governmentSpending = country.population * 0.72 + country.industry * 0.78
  const resourceRevenue = country.resourceProduction * 0.22
  const treasuryDelta = round(taxRevenue + resourceRevenue - governmentSpending)
  const unemployment = clamp(country.unemployment - annualGrowth * 0.012 - (country.industry - 60) * 0.002, 0, 100)
  const inflation = clamp(country.inflation + (annualGrowth - 3) * 0.012 + Math.max(0, governmentSpending - taxRevenue) / Math.max(gdp, 1) * 0.06, 0, 100)
  const industry = clamp(country.industry + annualGrowth * 0.006 + (country.technology - 60) * 0.001 + researchIndustry * 0.04, 0, 100)
  const resourceProduction = Math.max(0, round(country.resourceProduction * (1 + (industry - country.industry) * 0.002)))
  const updated: Country = { ...country, gdp, gdpGrowth: round(annualGrowth), population, gdpPerCapita: round((gdp * 1000) / population), treasury: Math.max(0, round(country.treasury + treasuryDelta)), industry: round(industry), resourceProduction, unemployment: round(unemployment), inflation: round(inflation) }
  return { country: updated, gdpDelta: round(gdp - country.gdp, 3), gdpPercent: round((gdp / country.gdp - 1) * 100), treasuryDelta }
}

export function updateWorldEconomy(world: Country[]) {
  const changes: Record<string, { gdpDelta: number; gdpPercent: number; treasuryDelta: number }> = {}
  const updatedCountries = world.map((country) => {
    const result = updateCountryEconomy(country)
    changes[country.id] = { gdpDelta: result.gdpDelta, gdpPercent: result.gdpPercent, treasuryDelta: result.treasuryDelta }
    return result.country
  })
  return { countries: updatedCountries, changes }
}
