import { useGameStore } from '../store/gameStore'

const format = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}K` : value.toFixed(1)

export function EconomyPanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  if (!country) return null
  const economic = country.economicState
  if (!economic) return <section className="panel economy-panel"><h2>경제</h2><p>다음 턴부터 경제 지표가 집계됩니다.</p></section>
  const debtRatio = economic.nationalDebt / Math.max(1, country.gdp) * 100
  return <section className="panel economy-panel">
    <div className="panel-title"><h2>경제</h2><span className="tag">{economic.economicCycle}</span></div>
    <div className="economy-metrics">
      <div><span>GDP</span><strong>{format(country.gdp)}</strong><small>{country.gdpGrowth.toFixed(2)}%</small></div>
      <div><span>물가</span><strong>{country.inflation.toFixed(1)}%</strong><small>인플레이션</small></div>
      <div><span>실업률</span><strong>{country.unemployment.toFixed(1)}%</strong><small>고용 {format(economic.employment)}</small></div>
      <div><span>생활 수준</span><strong>{economic.standardOfLiving.toFixed(0)}</strong><small>실질임금 {economic.realWage.toFixed(1)}</small></div>
    </div>
    <div className="economy-columns">
      <div><h3>국민·기업</h3><p>가계소득 <b>{format(economic.householdIncome)}</b></p><p>소비 <b>{format(economic.householdConsumption)}</b></p><p>민간 투자 <b>{format(economic.privateInvestment)}</b></p><p>기업 신뢰 <b>{economic.businessConfidence.toFixed(0)}</b></p></div>
      <div><h3>국가 재정</h3><p>정부지출 <b>{format(economic.governmentSpending)}</b></p><p>세수 <b>{format(economic.taxRevenue)}</b></p><p>국가부채 <b>{format(economic.nationalDebt)}</b></p><p>부채/GDP <b>{debtRatio.toFixed(0)}%</b></p></div>
      <div><h3>무역</h3><p>수출 <b>{format(economic.exports)}</b></p><p>수입 <b>{format(economic.imports)}</b></p><p>무역수지 <b>{economic.tradeBalance >= 0 ? '+' : ''}{format(economic.tradeBalance)}</b></p><p>환율 <b>{economic.exchangeRate.toFixed(1)}</b></p></div>
    </div>
    <h3>시장 가격</h3><div className="economy-price-grid">{Object.entries(economic.marketPrices).map(([name, price]) => <span key={name}>{name}<b>{price.toFixed(0)}</b></span>)}</div>
    <h3>산업 생산</h3><div className="economy-industry-grid">{Object.entries(economic.industries).map(([name, output]) => <span key={name}>{name}<b>{output.toFixed(0)}</b></span>)}</div>
  </section>
}
