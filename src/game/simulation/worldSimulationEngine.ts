import type { Country, DiplomaticRelation, IntegrationState, WarState, WorldIntegrationState } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min
const score = (...values: number[]) => values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0) / Math.max(1, values.length)

function integrateCountry(country: Country, countries: Country[], wars: WarState[], relations: Record<string, DiplomaticRelation>): Country {
  const political = country.politicalState
  const social = country.socialState
  const domestic = country.domesticPolitics2 ?? country.domesticPolitics
  const technology = country.technologyState
  const diplomacy = country.diplomaticState
  const atWar = wars.some((war) => war.active && (war.attacker === country.id || war.defender === country.id))
  const nationalStability = clamp(score(country.stability, political?.politicalStability ?? 50, social?.governmentTrust ?? 50, domestic && 'governmentApproval' in domestic ? domestic.governmentApproval : 50, 100 - country.unemployment * 2, 100 - country.inflation * 1.5, atWar ? 35 : 80))
  const nationalCapacity = clamp(score(country.economy, country.industry, technology?.nationalCapability ?? country.technology, technology?.utilization ?? 50, social?.education ?? 50, country.military * 0.25, country.population > 0 ? 60 : 0))
  const relationValues = Object.values(relations).filter((relation) => relation.countryA === country.id || relation.countryB === country.id)
  const influenceValues = diplomacy?.influence ? Object.values(diplomacy.influence) : [0]
  const diplomaticPower = diplomacy?.diplomaticPower ?? score(...influenceValues, country.economy * 0.4)
  const nationalInfluence = clamp(score(country.economy * 0.35, country.military * 0.25, technology?.nationalCapability ?? country.technology, diplomaticPower, country.nationalProfile?.softPower ?? 40, relationValues.length * 3))
  const powerIndex = clamp(score(Math.log10(Math.max(1, country.gdp)) * 14, Math.log10(Math.max(1, country.military)) * 18, technology?.nationalCapability ?? country.technology, nationalInfluence, nationalStability))
  const riskFactors: string[] = []
  const opportunityFactors: string[] = []
  if (country.inflation > 8) riskFactors.push('높은 인플레이션')
  if (country.unemployment > 10) riskFactors.push('고용 불안')
  if ((country.economicDeepState?.financial.creditRisk ?? 0) > 55) riskFactors.push('금융위기 위험')
  if ((domestic && 'polarization' in domestic ? domestic.polarization : 0) > 60) riskFactors.push('정치 양극화')
  if (atWar) riskFactors.push('전쟁 부담')
  if ((diplomacy?.internationalReputation ?? 50) < 30) riskFactors.push('외교 고립')
  if (country.gdpGrowth > 2) opportunityFactors.push('경제 성장')
  if ((technology?.nationalCapability ?? country.technology) > 60) opportunityFactors.push('기술 혁신')
  if ((country.economicDeepState?.financial.capitalFlow ?? 0) > 0) opportunityFactors.push('외국인 투자')
  if (relationValues.some((relation) => relation.tradeAgreement)) opportunityFactors.push('무역 협력')
  if ((country.innovationState?.innovationCapacity ?? 0) > 60) opportunityFactors.push('혁신 역량')
  const causes = [country.gdpGrowth < 0 ? 'GDP 감소 ← 투자·수요 약화' : 'GDP 성장 ← 생산·수요 개선', country.inflation > 6 ? '물가 상승 ← 공급·수요 압력' : '물가 안정', country.unemployment > 8 ? '정치 불안 ← 고용 악화' : '고용 안정']
  const summary: IntegrationState['summary'] = { economy: country.gdpGrowth < -1 || country.inflation > 10 ? '불안' : country.gdpGrowth > 2 ? '성장' : '안정', politics: (political?.politicalStability ?? 50) < 35 ? '불안' : '안정', society: (social?.socialUnrest ?? 0) > 45 ? '주의' : '안정', military: atWar ? '전시' : country.military > 60 ? '강함' : '보통', diplomacy: (diplomacy?.internationalReputation ?? 50) < 35 ? '고립' : '협력적', technology: (technology?.overallLevel ?? country.technology) > 70 ? '선도' : (technology?.overallLevel ?? country.technology) > 45 ? '성장' : '추격' }
  const previous = country.integrationState
  const next: IntegrationState = { nationalStability, nationalCapacity, nationalInfluence, powerIndex, riskFactors, opportunityFactors, summary, causes, history: [`안정도 ${nationalStability.toFixed(0)} · 역량 ${nationalCapacity.toFixed(0)}`, ...(previous?.history ?? [])].slice(0, 24) }
  return { ...country, integrationState: next }
}

export interface SimulationContext { currentDate: string; countries: Country[]; wars: WarState[]; relations: Record<string, DiplomaticRelation>; worldState?: WorldIntegrationState }
export function integrateWorldState(context: SimulationContext): { countries: Country[]; worldState: WorldIntegrationState } {
  const countries = context.countries.map((country) => integrateCountry(country, context.countries, context.wars, context.relations))
  const worldGdp = countries.reduce((sum, country) => sum + Math.max(0, country.gdp), 0)
  const worldPopulation = countries.reduce((sum, country) => sum + Math.max(0, country.population), 0)
  const worldTrade = countries.reduce((sum, country) => sum + (country.economicState?.exports ?? 0), 0)
  const worldTension = clamp(countries.reduce((sum, country) => sum + (country.diplomaticState?.worldTension ?? 0), 0) / Math.max(1, countries.length))
  const ranking = (selector: (country: Country) => number) => countries.slice().sort((a, b) => selector(b) - selector(a)).map((country) => country.name).slice(0, 5)
  const previous = context.worldState
  const worldState: WorldIntegrationState = { currentDate: context.currentDate, worldGdp, worldPopulation, worldTrade, worldTension, activeWars: context.wars.filter((war) => war.active).length, rankings: { economic: ranking((country) => country.gdp), military: ranking((country) => country.military), technology: ranking((country) => country.integrationState?.nationalInfluence ?? country.technology), power: ranking((country) => country.integrationState?.powerIndex ?? 0) }, reports: countries.filter((country) => (country.integrationState?.riskFactors.length ?? 0) > 2).slice(0, 3).map((country) => `${country.name}: 위험 요인 ${country.integrationState?.riskFactors.join(', ')}`), history: [`${context.currentDate} · 세계 GDP ${worldGdp.toFixed(0)} · 활동 전쟁 ${worldStateActiveWars(context.wars)}`, ...(previous?.history ?? [])].slice(0, 24) }
  return { countries, worldState }
}

function worldStateActiveWars(wars: WarState[]) { return wars.filter((war) => war.active).length }
