import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function WorldMap() {
  const selected = useGameStore((state) => state.selectedCountryId)
  const countries = useGameStore((state) => state.countries)
  const selectCountry = useGameStore((state) => state.selectCountry)
  const wars = useGameStore((state) => state.wars ?? [])
  const [mapMode, setMapMode] = useState<'정치' | '경제' | '군사' | '기술' | '외교'>('정치')
  const mapLabels: Record<string, string> = { han: '대한', usa: '미국', china: '중국', japan: '일본', russia: '러시아', germany: '독일', uk: '영국', france: '프랑스', india: '인도', brazil: '브라질' }
  const mapValue = (country: typeof countries[number]) => mapMode === '경제' ? country.gdp : mapMode === '군사' ? country.military : mapMode === '기술' ? country.technology : mapMode === '외교' ? country.diplomaticState?.diplomaticPower ?? 40 : 50
  const maxValue = Math.max(1, ...countries.map(mapValue))
  return <section className="map-panel"><div className="panel-heading"><div><span className="eyebrow">세계 지도 / {mapMode}</span><h2>세계 지도</h2></div><span className="map-status">● 월간 시뮬레이션</span></div><div className="map-mode-bar">{(['정치', '경제', '군사', '기술', '외교'] as const).map((mode) => <button key={mode} className={mapMode === mode ? 'active' : ''} onClick={() => setMapMode(mode)}>{mode} 지도</button>)}</div><div className="map-wrap"><svg viewBox="0 0 900 470" role="img" aria-label={`${mapMode} 세계 지도`}>
    <path className="ocean-grid" d="M0 80H900M0 160H900M0 240H900M0 320H900M0 400H900M100 0V470M200 0V470M300 0V470M400 0V470M500 0V470M600 0V470M700 0V470M800 0V470" />
    <path className="landmass" d="M60 110 L130 55 L250 60 L290 115 L260 160 L205 150 L165 190 L90 170 Z M320 72 L380 58 L410 95 L390 125 L345 115 Z M425 62 L520 48 L640 64 L760 75 L850 120 L800 160 L710 155 L640 135 L565 155 L490 130 L430 112 Z M535 240 L600 245 L645 290 L620 380 L560 415 L500 350 Z M210 245 L300 250 L385 305 L390 390 L330 445 L240 420 L190 340 Z" />
    {countries.map((country) => <g key={country.id} onClick={() => selectCountry(country.id)} className={`country-shape ${selected === country.id ? 'selected' : ''} ${wars.some((war) => war.active && (war.attacker === country.id || war.defender === country.id)) ? 'at-war' : ''}`}><path d={country.mapPath} fill={country.color} style={{ filter: mapMode === '정치' ? undefined : `brightness(${0.65 + mapValue(country) / maxValue * 0.65})` }} /><title>{country.name} · GDP {country.gdp.toFixed(0)} · 인구 {(country.population / 1000).toFixed(1)}M · 군사력 {country.military.toFixed(0)}</title><text x={country.mapLabel.x} y={country.mapLabel.y}>{mapLabels[country.id]}</text></g>)}
  </svg><div className="map-legend"><span><i className="legend-dot player" /> 플레이어 국가</span><span><i className="legend-dot" /> 다른 국가</span></div></div></section>
}
