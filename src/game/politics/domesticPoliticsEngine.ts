import type { Country, DomesticPoliticsState, WarState } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export function createDomesticPolitics(country: Country): DomesticPoliticsState {
  const stability = country.stability
  return { governmentApproval: stability, leaderApproval: stability, politicalStability: stability, polarization: 30, corruption: 20, incomeInequality: country.socialState?.inequality ?? 35, wealthConcentration: 35, socialMobility: 55, radicalization: 15, protestRisk: 10, strikeRisk: 8, conflicts: [], politicalMemory: [] }
}

export function normalizeDomesticPolitics(country: Country): DomesticPoliticsState {
  return country.domesticPolitics ?? createDomesticPolitics(country)
}

export function updateDomesticPolitics(country: Country, wars: WarState[]): { country: Country; domesticPolitics: DomesticPoliticsState; event?: string } {
  const previous = normalizeDomesticPolitics(country)
  const social = country.socialState
  const economic = country.economicState
  const atWar = wars.some((war) => war.active && (war.attacker === country.id || war.defender === country.id))
  const groups = social?.populationGroups ?? []
  const findSatisfaction = (name: string, fallback: number) => groups.find((group) => group.name === name)?.satisfaction ?? fallback
  const workers = findSatisfaction('노동자', 55)
  const entrepreneurs = findSatisfaction('기업가', 60)
  const soldiers = findSatisfaction('군인', 70)
  const averageSatisfaction = groups.length ? groups.reduce((sum, group) => sum + group.satisfaction * group.populationShare, 0) / 100 : 55
  const inequality = clamp((economic?.standardOfLiving ? 35 + Math.max(0, 65 - economic.standardOfLiving) * 0.35 : previous.incomeInequality) + (country.gdpGrowth > 4 ? 0.1 : 0))
  const unemploymentPressure = country.unemployment * 1.5
  const inflationPressure = country.inflation * 0.8
  const polarization = clamp(previous.polarization + Math.max(0, 50 - averageSatisfaction) * 0.04 + Math.max(0, inequality - 45) * 0.03 - (country.gdpGrowth > 2 ? 0.12 : 0))
  const radicalization = clamp(previous.radicalization + Math.max(0, inequality - 50) * 0.04 + unemploymentPressure * 0.025 + (atWar ? 0.15 : 0) - (economic?.standardOfLiving && economic.standardOfLiving > 65 ? 0.12 : 0))
  const governmentApproval = clamp(previous.governmentApproval + (country.gdpGrowth * 0.5) + (averageSatisfaction - 50) * 0.08 - country.inflation * 0.12 - (atWar ? 0.15 : 0))
  const leaderApproval = clamp(previous.leaderApproval + (governmentApproval - previous.leaderApproval) * 0.15)
  const protestRisk = clamp(averageSatisfaction < 42 ? previous.protestRisk + 1.4 : previous.protestRisk - 0.6 + polarization * 0.005 + (atWar && country.unemployment > 8 ? 0.4 : 0))
  const strikeRisk = clamp(workers < 42 && (country.unemployment > 7 || (economic?.realWage ?? 50) < 45) ? previous.strikeRisk + 1.8 : previous.strikeRisk - 0.7)
  const conflicts = [
    { id: 'workers-business', name: '노동자 ↔ 기업', intensity: clamp(100 - (workers + entrepreneurs) / 2), sides: ['노동자', '기업가'], cause: '임금과 생산비용 갈등' },
    { id: 'urban-rural', name: '도시 ↔ 농촌', intensity: clamp((country.industry - 50) * 0.35 + inequality * 0.2), sides: ['도시민', '농민'], cause: '지역 경제 격차' },
    { id: 'civil-military', name: '민간정부 ↔ 군부', intensity: clamp(atWar ? 35 - soldiers * 0.1 : 20 + Math.max(0, 55 - soldiers) * 0.3), sides: ['민간정부', '군부'], cause: atWar ? '전쟁 수행과 국방예산' : '군부 영향력' },
  ].map((conflict) => ({ ...conflict, intensity: Number(conflict.intensity.toFixed(1)) }))
  let event: string | undefined
  let activeProtest = previous.activeProtest
  let activeStrike = previous.activeStrike
  if (protestRisk > 70 && !activeProtest) { activeProtest = '대규모 시위'; event = `${country.name}에서 대규모 시위가 발생할 위험이 높습니다.` }
  else if (protestRisk < 45) activeProtest = undefined
  if (strikeRisk > 70 && !activeStrike) { activeStrike = '노동자 파업'; event = event ?? `${country.name}의 산업 현장에서 파업 위험이 높아졌습니다.` }
  else if (strikeRisk < 40) activeStrike = undefined
  const next: DomesticPoliticsState = { ...previous, governmentApproval, leaderApproval, politicalStability: clamp(governmentApproval - polarization * 0.18 - previous.corruption * 0.12 - (activeProtest ? 8 : 0) - (activeStrike ? 5 : 0)), polarization, corruption: clamp(previous.corruption + (country.stability < 35 ? 0.15 : -0.08)), incomeInequality: inequality, wealthConcentration: clamp(previous.wealthConcentration + (country.gdpGrowth > 3 ? 0.12 : -0.06)), socialMobility: clamp(previous.socialMobility + ((social?.education ?? 50) > 60 ? 0.12 : -0.08)), radicalization, protestRisk, strikeRisk, conflicts, activeProtest, activeStrike, politicalMemory: event ? [event, ...previous.politicalMemory].slice(0, 12) : previous.politicalMemory }
  const nextStability = Number(clamp(country.stability + (next.politicalStability - country.stability) * 0.08).toFixed(2))
  return { country: { ...country, stability: nextStability, domesticPolitics: next }, domesticPolitics: next, event }
}
