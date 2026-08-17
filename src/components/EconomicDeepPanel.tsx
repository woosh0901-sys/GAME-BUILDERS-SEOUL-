import { normalizeEconomicDeep } from '../game/economy/economicDeepEngine'
import { useGameStore } from '../store/gameStore'

const format = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}K` : value.toFixed(1)
const percent = (value: number) => `${value.toFixed(0)}%`

export function EconomicDeepPanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  if (!country) return null
  const deep = normalizeEconomicDeep(country)
  const totalProfit = deep.companies.reduce((sum, company) => sum + company.profit, 0)
  const totalInvestment = deep.companies.reduce((sum, company) => sum + company.investment, 0)
  return <section className="panel economic-deep-panel">
    <div className="panel-title"><h2>경제 심화</h2><span className="tag">{country.economicState?.economicCycle ?? '안정'}</span></div>
    <div className="economy-deep-grid">
      <div className="deep-card"><h3>기업군</h3><p>산업 대표 기업군 <b>{deep.companies.length}</b></p><p>총이익 <b>{format(totalProfit)}</b></p><p>총투자 <b>{format(totalInvestment)}</b></p><p>파산 위험 기업 <b>{deep.companies.filter((company) => company.bankruptcyRisk > 60).length}</b></p></div>
      <div className="deep-card"><h3>가계</h3><p>소득 <b>{format(deep.household.income)}</b></p><p>소비 <b>{format(deep.household.consumption)}</b></p><p>저축 <b>{format(deep.household.savings)}</b></p><p>부채 부담 <b>{percent(deep.household.debtBurden)}</b></p><p>소비자 신뢰 <b>{percent(deep.household.consumerConfidence)}</b></p></div>
      <div className="deep-card"><h3>금융시장</h3><p>기준금리 <b>{deep.financial.policyRate.toFixed(2)}%</b></p><p>대출금리 <b>{deep.financial.lendingRate.toFixed(2)}%</b></p><p>유동성 <b>{percent(deep.financial.liquidity)}</b></p><p>신용위험 <b>{percent(deep.financial.creditRisk)}</b></p><p>국가위험도 <b>{percent(deep.financial.countryRisk)}</b></p></div>
    </div>
    <div className="economy-deep-columns">
      <div><h3>산업 구조</h3><div className="economy-industry-grid">{Object.entries(deep.industryShares).map(([name, share]) => <span key={name}>{name}<b>{share.toFixed(1)}%</b></span>)}</div></div>
      <div><h3>공급망</h3>{deep.supplyChains.map((chain) => <p className="supply-chain-row" key={chain.id}><span>{chain.input} → {chain.output}</span><b>의존 {chain.dependency}% · 재고 {chain.inventory}%</b></p>)}</div>
    </div>
    <div className="deep-indicators"><h3>경기 지표</h3>{Object.entries(deep.leadingIndicators).map(([name, value]) => <span key={name}>선행 {name}<b>{value.toFixed(0)}</b></span>)}{Object.entries(deep.laggingIndicators).map(([name, value]) => <span key={name}>후행 {name}<b>{value.toFixed(1)}</b></span>)}</div>
  </section>
}
