import { useGameStore } from '../store/gameStore'
import { buildings } from '../game/buildings/buildingData'
import { regionSlots } from '../game/regions/regionEngine'
import type { BuildingId } from '../types/game'
import { normalizeRegion } from '../game/regions/regionEngine'

export function RegionPanel() {
  const { selectedCountryId, selectedRegionId, countries, territories, selectRegion, constructBuilding } = useGameStore()
  const regions = (territories[selectedCountryId] ?? []).map(normalizeRegion)
  const selected = regions.find((region) => region.id === selectedRegionId) ?? regions[0]
  if (!selected) return null
  const build = (id: BuildingId) => constructBuilding(id)
  return <section className="region-panel"><div className="panel-heading"><div><span className="eyebrow">지역 개발 / 산업 기반</span><h2>지역 개발</h2></div><span className="map-status">{regions.length}개 지역</span></div><div className="region-content"><div className="region-list">{regions.map((region) => <button className={region.id === selected.id ? 'region-row active' : 'region-row'} key={region.id} onClick={() => selectRegion(region.id)}><span>{region.name}{region.capital ? ' · 수도' : ''}</span><em>개발도 {region.development}</em><b>산업 {region.industrialCapacity}</b></button>)}</div><div className="region-detail"><div className="region-detail-head"><h3>{selected.name}</h3><span>{selected.capital ? '수도 지역' : '일반 지역'}</span></div><div className="region-stats"><span>인구 <b>{selected.population.toFixed(1)}백만</b></span><span>개발도 <b>{selected.development}</b></span><span>인프라 <b>{selected.infrastructure}</b></span><span>건물 슬롯 <b>{selected.buildings.length} / {regionSlots(selected)}</b></span></div><div className="building-list">{selected.buildings.length ? selected.buildings.map((building) => <div key={building.id}><span>{buildings.find((item) => item.id === building.id)?.name ?? building.id}</span><b>Lv.{building.level}</b></div>) : <p>건설된 건물이 없습니다.</p>}</div><div className="build-options"><div className="section-label">건물 건설</div>{buildings.slice(0, 8).map((building) => <button key={building.id} className="build-button" onClick={() => build(building.id)}><strong>{building.name}</strong><small>{building.months}개월 · 비용 {building.cost}</small></button>)}</div></div></div></section>
}
