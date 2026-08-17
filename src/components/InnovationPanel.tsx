import { normalizeInnovation } from '../game/research/innovationEngine'
import { useGameStore } from '../store/gameStore'

export function InnovationPanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  if (!country) return null
  const innovation = normalizeInnovation(country)
  const technology = country.technologyState
  return <section className="panel innovation-panel">
    <div className="panel-title"><h2>기술혁신 생태계</h2><span className="tag">기술 경쟁력 {innovation.nationalTechPower.toFixed(0)}</span></div>
    <div className="technology-metrics"><span>혁신 역량<b>{innovation.innovationCapacity.toFixed(0)}</b></span><span>연구인력<b>{innovation.researchers.toFixed(0)}</b></span><span>연구 효율<b>{innovation.researchEfficiency.toFixed(0)}</b></span><span>자동화<b>{innovation.automationLevel.toFixed(0)}%</b></span><span>특허<b>{innovation.patents.length}</b></span></div>
    <div className="innovation-columns"><div><h3>연구기관</h3>{innovation.institutions.map((institution) => <p key={institution.id}><span>{institution.name}</span><b>{institution.capacity.toFixed(0)} · {institution.efficiency.toFixed(0)}</b></p>)}</div><div><h3>연구 프로젝트</h3>{innovation.projects.length ? innovation.projects.map((project) => <p key={project.id}><span>{project.name} · {project.stage}</span><b>{project.progress.toFixed(0)}% · 성공 {project.successChance.toFixed(0)}%</b></p>) : <small>현재 진행 중인 확장 연구 프로젝트가 없습니다.</small>}</div></div>
    <div className="innovation-footer"><span>기술 도입·상용화 {technology ? Object.values(technology.commercialization).filter((value) => value > 0).length : 0}개</span><span>기술 보안 {innovation.technologySecurity.toFixed(0)}</span><span>기술 투자 과열 위험 {innovation.bubbleRisk.toFixed(0)}</span></div>
  </section>
}
