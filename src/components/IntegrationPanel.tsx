import { useGameStore } from '../store/gameStore'

export function IntegrationPanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  const world = useGameStore((state) => state.worldIntegration)
  if (!country?.integrationState) return null
  const state = country.integrationState
  return <section className="panel integration-panel">
    <div className="panel-title"><h2>국가 상황 요약</h2><span className="tag">종합 국력 {state.powerIndex.toFixed(0)}</span></div>
    <div className="integration-summary">{Object.entries(state.summary).map(([name, value]) => <span key={name}>{name}<b>{value}</b></span>)}</div>
    <div className="integration-columns"><div><h3>현재 위험</h3>{state.riskFactors.length ? state.riskFactors.map((item) => <p key={item}>⚠ {item}</p>) : <p>주요 위험 요소 없음</p>}</div><div><h3>현재 기회</h3>{state.opportunityFactors.length ? state.opportunityFactors.map((item) => <p key={item}>◆ {item}</p>) : <p>주요 기회 탐색 중</p>}</div><div><h3>변화 원인</h3>{state.causes.map((item) => <p key={item}>{item}</p>)}</div></div>
    {world && <div className="world-report"><h3>세계 통합 보고</h3><span>세계 GDP {world.worldGdp.toFixed(0)}</span><span>세계 무역 {world.worldTrade.toFixed(0)}</span><span>활동 전쟁 {world.activeWars}</span><span>세계 긴장도 {world.worldTension.toFixed(0)}</span></div>}
  </section>
}
