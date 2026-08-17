import type { Country, EconomicCycleState, EconomicState } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export function createEconomicState(country: Country): EconomicState {
  const gdp = Math.max(1, country.gdp)
  return {
    employment: Math.max(0, country.population * (1 - country.unemployment / 100)),
    wages: Math.max(1, country.gdpPerCapita / 1000),
    realWage: Math.max(1, country.gdpPerCapita / 1000 / (1 + country.inflation / 100)),
    householdIncome: gdp * 0.62,
    householdConsumption: gdp * 0.42,
    privateInvestment: gdp * 0.16,
    governmentSpending: gdp * 0.18,
    exports: gdp * 0.12,
    imports: gdp * 0.1,
    tradeBalance: gdp * 0.02,
    nationalDebt: gdp * 0.45,
    taxRevenue: gdp * 0.018,
    businessProfit: gdp * 0.08,
    consumerConfidence: clamp(country.stability),
    businessConfidence: clamp(country.stability),
    interestRate: 3,
    exchangeRate: 100,
    foreignInvestment: gdp * 0.01,
    standardOfLiving: clamp(country.gdpPerCapita / 900),
    economicResilience: 55,
    economicCycle: '안정',
    production: Math.max(1, country.industry),
    marketPrices: { 식량: 100, 석유: 100, 철강: 100, 자동차: 100, 전자제품: 100, 서비스: 100 },
    industries: {
      농업: 55,
      광업: 60,
      제조업: country.industry,
      건설업: country.industry * 0.8,
      서비스업: country.economy,
      금융업: country.technology * 0.8,
      기술산업: country.technology,
      군수산업: country.military,
    },
  }
}

export function normalizeEconomic(country: Country): EconomicState {
  return country.economicState ?? createEconomicState(country)
}

export function updateEconomicSimulation(country: Country, atWar = false): {
  country: Country
  economic: EconomicState
  summary: string
} {
  const previous = normalizeEconomic(country)
  const baseGdp = Math.max(1, country.gdp)
  const employment = Math.max(0, country.population * (1 - country.unemployment / 100))
  const confidence = clamp(previous.consumerConfidence + country.gdpGrowth * 0.35 - country.inflation * 0.25 - country.unemployment * 0.12)
  const businessConfidence = clamp(previous.businessConfidence + country.gdpGrowth * 0.45 - country.inflation * 0.12 - (country.stability < 40 ? 1 : 0))
  const householdIncome = baseGdp * (0.58 + confidence / 1000)
  const consumption = householdIncome * (0.58 + confidence / 250)
  const debtRatio = previous.nationalDebt / baseGdp
  const debtDrag = Math.max(0, debtRatio - 0.6) * 0.08
  const investment = Math.max(0, baseGdp * (0.1 + businessConfidence / 500) * (1 - previous.interestRate / 100 - debtDrag) * (atWar ? 0.82 : 1))
  const governmentSpending = baseGdp * (0.16 + (country.politicalState?.currentPolicies.welfare === 'welfareUp' ? 0.04 : 0) + (atWar ? 0.05 : 0))
  const production = Math.max(1, country.industry * (0.7 + confidence / 250) * (1 - country.unemployment / 300) * (atWar ? 0.9 : 1))
  const exports = baseGdp * (0.1 + country.resourceProduction / 1000)
  const imports = baseGdp * (0.09 + Math.max(0, 60 - country.resourceProduction) / 1000)
  const tradeBalance = exports - imports
  const activity = (consumption * 0.45 + investment * 0.2 + governmentSpending * 0.2 + tradeBalance * 0.15) / baseGdp
  const growth = clamp((activity - 0.82) * 8 + country.gdpGrowth * 0.25 - debtDrag * 100 - (atWar ? 0.8 : 0), -8, 12)
  const gdp = Math.max(1, baseGdp * (1 + growth / 100 / 12))
  const pricePressure = (consumption / baseGdp - 0.6) * 4 + (production < country.industry ? 0.5 : -0.15)
  const inflation = clamp(country.inflation + pricePressure * 0.08 + (atWar ? 0.18 : 0))
  const unemployment = clamp(country.unemployment - growth * 0.04 + (production < country.industry ? 0.1 : -0.05))
  const cycle: EconomicCycleState = growth > 5 && inflation > 5 ? '호황' : growth > 2 ? '확장' : growth < -3 ? '침체' : growth < 0 ? '둔화' : '안정'
  const prices = Object.fromEntries(Object.entries(previous.marketPrices).map(([key, value]) => [key, Math.max(60, Math.min(180, value * (1 + pricePressure * 0.01)))]))
  const next: EconomicState = {
    ...previous,
    employment,
    wages: Math.max(1, householdIncome / Math.max(1, employment) * 10),
    realWage: Math.max(1, previous.wages / (1 + inflation / 100)),
    householdIncome,
    householdConsumption: consumption,
    privateInvestment: investment,
    governmentSpending,
    exports,
    imports,
    tradeBalance,
    nationalDebt: Math.max(0, previous.nationalDebt + governmentSpending - exports * 0.4),
    taxRevenue: gdp * 0.018,
    businessProfit: Math.max(0, production * 0.08 - investment * 0.02),
    consumerConfidence: confidence,
    businessConfidence,
    interestRate: clamp(previous.interestRate + (inflation > 5 ? 0.1 : inflation < 1 ? -0.1 : 0), 0.5, 20),
    exchangeRate: Math.max(50, Math.min(180, previous.exchangeRate - tradeBalance * 0.001)),
    foreignInvestment: Math.max(0, baseGdp * businessConfidence / 10000),
    standardOfLiving: clamp(previous.standardOfLiving + (growth - inflation) * 0.08),
    economicCycle: cycle,
    production,
    marketPrices: prices,
    industries: {
      ...previous.industries,
      제조업: country.industry * (0.8 + country.technology / 500),
      서비스업: country.economy * (0.8 + confidence / 500),
      기술산업: country.technology * (0.8 + (country.researchState?.researchSpeed ?? 1) / 300),
    },
  }
  const summary = cycle === '침체' ? `${country.name}의 경제가 침체 국면에 진입했습니다.` : `${country.name}의 경제가 ${cycle} 국면에서 움직이고 있습니다.`
  return {
    country: {
      ...country,
      economicState: next,
      gdp,
      gdpGrowth: Number(growth.toFixed(2)),
      unemployment: Number(unemployment.toFixed(2)),
      inflation: Number(inflation.toFixed(2)),
      gdpPerCapita: Number((gdp * 1000 / Math.max(0.1, country.population)).toFixed(2)),
    },
    economic: next,
    summary,
  }
}
