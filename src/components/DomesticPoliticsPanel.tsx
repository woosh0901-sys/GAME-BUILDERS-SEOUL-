import { useGameStore } from '../store/gameStore'
import { createDomesticPolitics } from '../game/politics/domesticPoliticsEngine'

export function DomesticPoliticsPanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  if (!country) return null
  const politics = country.domesticPolitics ?? createDomesticPolitics(country)
  const social = country.socialState
  return <section className="panel domestic-politics-panel">
    <div className="panel-title"><h2>국내 정치 2.0</h2><span className="tag">{politics.politicalStability.toFixed(0)} 안정</span></div>
    <div className="domestic-metrics"><span>정부 지지율<b>{politics.governmentApproval.toFixed(0)}%</b></span><span>지도자 지지도<b>{politics.leaderApproval.toFixed(0)}%</b></span><span>정치 양극화<b>{politics.polarization.toFixed(0)}</b></span><span>부패<b>{politics.corruption.toFixed(0)}</b></span><span>급진화<b>{politics.radicalization.toFixed(0)}</b></span></div>
    <div className="section-label">사회 세력</div><div className="domestic-groups">{(social?.populationGroups ?? []).map((group) => <span key={group.id}>{group.name}<b>{group.satisfaction.toFixed(0)}</b><small>{group.populationShare}%</small></span>)}</div>
    <div className="section-label">주요 갈등</div><div className="domestic-conflicts">{politics.conflicts.map((conflict) => <span key={conflict.id}>{conflict.name}<b>{conflict.intensity.toFixed(0)}</b></span>)}</div>
    <div className="domestic-alerts">{politics.activeProtest && <span>⚠ {politics.activeProtest}</span>}{politics.activeStrike && <span>⚠ {politics.activeStrike}</span>}{!politics.activeProtest && !politics.activeStrike && <span>현재 대규모 사회 행동 없음</span>}</div>
  </section>
}
