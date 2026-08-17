import type { BalanceReport, Country } from '../../types/game'

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const safe = (value: number) => Number.isFinite(value) ? value : 0

export function createBalanceReport(countries: Country[], currentDate: string): BalanceReport {
  const gdp = countries.map((country) => safe(country.gdp))
  const population = countries.map((country) => safe(country.population))
  const military = countries.map((country) => safe(country.military))
  const technology = countries.map((country) => safe(country.technology))
  const inflation = countries.map((country) => safe(country.inflation))
  const unemployment = countries.map((country) => safe(country.unemployment))
  const warnings: string[] = []
  if (gdp.some((value) => value > 1_000_000)) warnings.push('GDP 폭발 가능성')
  if (population.some((value) => value > 100_000)) warnings.push('인구 폭발 가능성')
  if (military.some((value) => value > 10_000)) warnings.push('군사력 폭발 가능성')
  if (technology.some((value) => value > 100)) warnings.push('기술력 범위 초과')
  if (inflation.some((value) => value > 40)) warnings.push('인플레이션 위험')
  if (unemployment.some((value) => value > 40)) warnings.push('고용 위기')
  if (countries.some((country) => !Number.isFinite(country.gdp) || !Number.isFinite(country.population))) warnings.push('NaN 또는 Infinity 감지')
  return { currentDate, averageGdp: average(gdp), maxGdp: Math.max(0, ...gdp), averagePopulation: average(population), averageMilitary: average(military), averageTechnology: average(technology), averageInflation: average(inflation), averageUnemployment: average(unemployment), warnings }
}
