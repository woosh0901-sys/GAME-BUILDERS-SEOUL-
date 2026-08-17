import type { CompanyGroup, Country, EconomicDeepState, FinancialState, HouseholdState, SupplyChainLink } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const industryNames = ['농업', '광업', '제조업', '건설업', '서비스업', '금융업', '기술산업', '군수산업']

function createCompanies(country: Country): CompanyGroup[] { return industryNames.map((name, index) => ({ id: `${country.id}-company-${index}`, name: `${name} 대표 기업군`, industryId: name, scale: index < 2 ? '중견기업' : index === 2 || index === 4 ? '대기업' : '중견기업', employees: Math.max(1, country.population * (index === 4 ? 0.02 : 0.01)), capital: country.gdp * (0.03 + index * 0.005), revenue: country.gdp * 0.04, expenses: country.gdp * 0.035, profit: country.gdp * 0.005, productivity: clamp(country.industry * 0.7 + country.technology * 0.3), technologyLevel: country.technology, marketShare: 12.5, investment: country.gdp * 0.003, debt: country.gdp * 0.01, confidence: country.stability, bankruptcyRisk: 8 })) }
function createSupplyChains(country: Country): SupplyChainLink[] { return [{ id: 'energy-manufacturing', input: '에너지', output: '제조업', dependency: 65, inventory: 70, disruption: 0, diversified: 35 }, { id: 'steel-machinery', input: '철강', output: '기계·자동차', dependency: 58, inventory: 62, disruption: 0, diversified: 42 }, { id: 'electronics-consumer', input: '전자부품', output: '소비재', dependency: country.technology > 60 ? 70 : 35, inventory: 55, disruption: 0, diversified: 30 }] }

export function createEconomicDeepState(country: Country): EconomicDeepState { const gdp = Math.max(1, country.gdp); return { companies: createCompanies(country), supplyChains: createSupplyChains(country), household: { income: gdp * 0.62, consumption: gdp * 0.42, savings: gdp * 0.12, debt: gdp * 0.35, assets: gdp * 1.4, propensityToConsume: 0.68, consumerConfidence: country.stability, debtBurden: 28 }, financial: { policyRate: country.economicState?.interestRate ?? 3, lendingRate: (country.economicState?.interestRate ?? 3) + 2.2, liquidity: 72, creditRisk: 22, marketConfidence: country.stability, riskPremium: 2, corporateDebt: gdp * 0.25, householdDebt: gdp * 0.35, capitalFlow: 0, countryRisk: 35 }, leadingIndicators: { 투자: 50, 기업신뢰: country.economicState?.businessConfidence ?? 55, 소비자신뢰: country.economicState?.consumerConfidence ?? 55, 주문: 50, 고용: 50 }, laggingIndicators: { 실업률: country.unemployment, 물가: country.inflation, 임금: country.economicState?.wages ?? 50, 기업파산: 5 }, economicObjective: '성장 우선', shocks: [], industryShares: Object.fromEntries(industryNames.map((name) => [name, 100 / industryNames.length])), history: [] } }
export function normalizeEconomicDeep(country: Country) { return country.economicDeepState ?? createEconomicDeepState(country) }

export function updateEconomicDeep(country: Country): Country {
  const previous = normalizeEconomicDeep(country)
  const economic = country.economicState
  const gdp = Math.max(1, country.gdp)
  const demandFactor = economic ? economic.householdConsumption / gdp : 0.42
  const confidence = economic?.businessConfidence ?? country.stability
  const companies = previous.companies.map((company) => {
    const revenue = gdp * (0.025 + company.marketShare / 1000) * (0.9 + demandFactor)
    const wageCost = company.employees * (economic?.wages ?? 1) / Math.max(1, country.population) * gdp * 0.3
    const expenses = revenue * (0.72 + country.inflation / 500) + wageCost
    const profit = revenue - expenses
    const investment = Math.max(0, profit * 0.25 * (confidence / 100) * (1 - (economic?.interestRate ?? 3) / 30))
    const productivity = clamp(company.productivity + (country.technologyState?.utilization ?? 50) * 0.002 + (profit > 0 ? 0.1 : -0.15))
    const bankruptcyRisk = clamp(company.bankruptcyRisk + (profit < 0 ? 1.2 : -0.4) + (company.debt > gdp * 0.08 ? 0.5 : 0))
    return { ...company, revenue, expenses, profit, investment, productivity, confidence: clamp(company.confidence + (profit > 0 ? 0.2 : -0.5)), debt: Math.max(0, company.debt + (profit < 0 ? Math.abs(profit) * 0.05 : -investment * 0.02)), bankruptcyRisk }
  })
  const householdIncome = economic?.householdIncome ?? previous.household.income
  const householdDebt = Math.max(0, previous.household.debt + ((economic?.interestRate ?? 3) > 6 ? gdp * 0.002 : -gdp * 0.0005))
  const household: HouseholdState = { ...previous.household, income: householdIncome, consumption: economic?.householdConsumption ?? previous.household.consumption, savings: Math.max(0, previous.household.savings + (economic?.householdIncome ?? 0) - (economic?.householdConsumption ?? 0)), debt: householdDebt, assets: Math.max(0, previous.household.assets * (1 + (country.gdpGrowth / 1000))), propensityToConsume: clamp(previous.household.propensityToConsume * 100 + (confidence - 50) * 0.01, 45, 85) / 100, consumerConfidence: economic?.consumerConfidence ?? previous.household.consumerConfidence, debtBurden: clamp(householdDebt / Math.max(1, householdIncome) * 100) }
  const creditRisk = clamp(previous.financial.creditRisk + (household.debtBurden > 50 ? 0.5 : -0.2) + (companies.filter((company) => company.bankruptcyRisk > 60).length * 0.8))
  const marketConfidence = clamp(previous.financial.marketConfidence + (country.gdpGrowth > 0 ? 0.2 : -0.4) - creditRisk * 0.02)
  const liquidity = clamp(previous.financial.liquidity + (country.gdpGrowth > 0 ? 0.25 : -0.5) - creditRisk * 0.02)
  const financial: FinancialState = { ...previous.financial, policyRate: economic?.interestRate ?? previous.financial.policyRate, lendingRate: (economic?.interestRate ?? previous.financial.policyRate) + 2 + creditRisk / 25, liquidity, creditRisk, marketConfidence, riskPremium: 1 + creditRisk / 20, corporateDebt: companies.reduce((sum, company) => sum + company.debt, 0), householdDebt: household.debt, capitalFlow: economic?.foreignInvestment ?? 0, countryRisk: clamp(100 - (marketConfidence * 0.45 + (country.nationalProfile?.resilience ?? 50) * 0.35 + liquidity * 0.2)) }
  const shocks = previous.shocks.map((shock) => ({ ...shock, monthsRemaining: shock.monthsRemaining - 1 })).filter((shock) => shock.monthsRemaining > 0)
  const leadingIndicators = { 투자: clamp((economic?.privateInvestment ?? 0) / gdp * 250), 기업신뢰: confidence, 소비자신뢰: household.consumerConfidence, 주문: clamp(demandFactor * 100), 고용: clamp(100 - country.unemployment) }
  const laggingIndicators = { 실업률: country.unemployment, 물가: country.inflation, 임금: economic?.wages ?? 0, 기업파산: companies.filter((company) => company.bankruptcyRisk > 60).length }
  const industryShares = Object.fromEntries(industryNames.map((name, index) => [name, clamp(previous.industryShares[name] + (name === '서비스업' || name === '기술산업' ? 0.08 : index === 0 ? -0.05 : 0), 1, 60)]))
  const totalShares = Object.values(industryShares).reduce((sum, value) => sum + value, 0)
  Object.keys(industryShares).forEach((name) => { industryShares[name] = industryShares[name] / totalShares * 100 })
  const cycle = country.economicState?.economicCycle ?? '안정'
  return { ...country, economicDeepState: { ...previous, companies, household, financial, shocks, leadingIndicators, laggingIndicators, industryShares, history: [`${cycle} · 신용위험 ${creditRisk.toFixed(0)} · 기업투자 ${companies.reduce((sum, company) => sum + company.investment, 0).toFixed(0)}`, ...previous.history].slice(0, 24) } }
}
