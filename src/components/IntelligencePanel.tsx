import { useGameStore } from '../store/gameStore'
import { normalizeIntelligence } from '../game/intelligence/intelligenceEngine'
import type { IntelligenceOperationType } from '../types/game'

const operationTypes: IntelligenceOperationType[] = ['군사 정찰', '경제 분석', '정치 분석', '외교 분석', '기술 분석']

export function IntelligencePanel() {
  const state = useGameStore()
  const country = state.countries.find((item) => item.id === state.playerCountryId)
  const target = state.countries.find((item) => item.id === state.selectedCountryId)
  if (!country || !target || country.id === target.id) return null
  const intelligence = normalizeIntelligence(country)
  const observation = intelligence.observations[target.id]
  const reports = intelligence.reports.filter((report) => report.targetCountryId === target.id).slice(0, 3)
  return <section className="panel intelligence-panel">
    <div className="panel-title"><h2>정보 분석 · {target.name}</h2><span className="tag">신뢰도 {observation?.confidence?.toFixed(0) ?? '0'}%</span></div>
    <div className="intelligence-metrics"><span>정보기관<b>{intelligence.agencyLevel.toFixed(0)}</b></span><span>정보망<b>{intelligence.networkLevel.toFixed(0)}</b></span><span>방첩<b>{intelligence.counterIntelligence.toFixed(0)}</b></span><span>정보 보안<b>{intelligence.informationSecurity.toFixed(0)}</b></span></div>
    <div className="intelligence-observed"><p>군사력 <b>{observation?.militaryPower ? `${observation.militaryPower.min.toFixed(0)}~${observation.militaryPower.max.toFixed(0)}` : '미확인'}</b></p><p>GDP <b>{observation?.gdp ? `${observation.gdp.min.toFixed(0)}~${observation.gdp.max.toFixed(0)}` : '미확인'}</b></p><p>정치 안정도 <b>{observation?.stability ? `${observation.stability.min.toFixed(0)}~${observation.stability.max.toFixed(0)}` : '미확인'}</b></p></div>
    <div className="section-label">정보 작전</div><div className="intelligence-actions">{operationTypes.map((type) => <button key={type} className="diplomacy-action" onClick={() => state.startIntelligence(target.id, type)}>{type}</button>)}</div>
    <div className="section-label">최근 보고서</div>{reports.length ? reports.map((report) => <div className="intelligence-report" key={report.id}><b>{report.category} · {report.confidence.toFixed(0)}%</b><span>{report.estimate}</span><small>{report.assessment} · {report.age}개월 전</small></div>) : <p className="diplomacy-hint">정보 작전을 시작하면 분석 보고서가 생성됩니다.</p>}
  </section>
}
