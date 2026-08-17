import { useGameStore } from '../store/gameStore'
import { normalizeTechnology } from '../game/research/technologyEngine'

export function TechnologyPanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  if (!country) return null
  const technology = normalizeTechnology(country)
  const specializations = Object.entries(technology.specialization).sort((a, b) => b[1] - a[1]).slice(0, 4)
  return <section className="panel technology-panel"><div className="panel-title"><h2>기술 발전</h2><span className="tag">국가 경쟁력 {technology.nationalCapability.toFixed(0)}</span></div><div className="technology-metrics"><span>기술 수준<b>{technology.overallLevel.toFixed(0)}</b></span><span>연구 역량<b>{technology.researchCapacity.toFixed(0)}</b></span><span>활용도<b>{technology.utilization.toFixed(0)}%</b></span><span>기술 격차<b>{technology.technologyGap.toFixed(0)}</b></span><span>자립도<b>{technology.technologySelfSufficiency.toFixed(0)}</b></span></div><div className="section-label">기술 전문화</div><div className="technology-specializations">{specializations.length ? specializations.map(([name, value]) => <span key={name}>{name}<b>{value.toFixed(0)}</b></span>) : <small>연구가 진행되면 국가의 전문 분야가 형성됩니다.</small>}</div></section>
}
