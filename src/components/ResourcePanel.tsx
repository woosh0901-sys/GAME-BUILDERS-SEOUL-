import { useGameStore } from '../store/gameStore'
import { emptyResources, resourceLabels } from '../game/resources/resourceUtils'
import type { ResourceProduction } from '../types/game'

export function ResourcePanel() {
  const country = useGameStore((state) => state.countries.find((item) => item.id === state.playerCountryId))
  if (!country) return null
  const stock = country.resourceStockpile ?? emptyResources()
  const output = country.resourceOutput ?? emptyResources()
  const keys = Object.keys(resourceLabels) as (keyof ResourceProduction)[]
  return <section className="resource-panel"><div className="panel-heading"><div><span className="eyebrow">국가 경제 / 전략 자원</span><h2>자원 비축</h2></div><span className="map-status">매월 생산·소비</span></div><div className="resource-grid">{keys.map((key) => <div className={stock[key] <= 0 ? 'resource-card shortage' : 'resource-card'} key={key}><span>{resourceLabels[key]}</span><strong>{stock[key].toFixed(0)}</strong><small>+{output[key].toFixed(1)} /월</small>{stock[key] <= 0 && <em>부족</em>}</div>)}</div></section>
}
