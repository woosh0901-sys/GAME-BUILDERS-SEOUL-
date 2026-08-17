import { getDateLabel } from '../game/time'
import { useGameStore } from '../store/gameStore'

export function Header() {
  const { year, turn, treasury, playerCountryId, countries, nextTurn } = useGameStore()
  const player = countries.find((country) => country.id === playerCountryId)!
  const military = player.militaryState?.army ?? player.military
  return <header className="topbar">
    <div className="brand"><span className="brand-mark">월드</span><div><h1>월드 오더</h1><span>세계 대전략 시뮬레이션</span></div></div>
    <div className="top-stats"><div><small>현재 날짜 / 턴</small><strong>{getDateLabel(year, turn)} <em>{turn}턴</em></strong></div><div><small>플레이어 국가</small><strong>{player.name}</strong></div><div><small>국내총생산</small><strong>{player.gdp.toFixed(0)}</strong></div><div><small>인구</small><strong>{(player.population / 1000).toFixed(1)}M</strong></div><div><small>국고</small><strong className="money">◈ {treasury.toLocaleString()}</strong></div><div><small>안정도 · 군사력</small><strong className="stability">{player.stability}% · {military.toFixed(0)}</strong></div><button onClick={nextTurn}>다음 턴 <span>→</span></button></div>
  </header>
}
