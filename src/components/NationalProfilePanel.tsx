import { useGameStore } from '../store/gameStore'
import { normalizeNationalProfile } from '../game/national/nationalProfileEngine'

export function NationalProfilePanel() {
  const state = useGameStore()
  const country = state.countries.find((item) => item.id === state.selectedCountryId) ?? state.countries[0]
  if (!country) return null
  const profile = normalizeNationalProfile(country)
  return <section className="panel national-profile-panel"><div className="panel-title"><h2>{country.name} 국가 프로필</h2><span className="tag">{profile.developmentStage}</span></div><div className="national-head"><b>{profile.archetype}</b><span>{profile.image}</span></div><div className="national-columns"><div><h3>국가 특성</h3>{profile.traits.map((trait) => <span className="national-chip good" key={trait}>◆ {trait}</span>)}</div><div><h3>국가 약점</h3>{profile.weaknesses.map((weakness) => <span className="national-chip bad" key={weakness}>◆ {weakness}</span>)}</div></div><div className="national-metrics"><span>현재 전략<b>{profile.strategy}</b></span><span>회복력<b>{profile.resilience.toFixed(0)}</b></span><span>국가 명성<b>{profile.prestige.toFixed(0)}</b></span><span>영향력<b>{profile.influence.toFixed(0)}</b></span><span>소프트파워<b>{profile.softPower.toFixed(0)}</b></span></div><div className="section-label">국가 정체성</div><div className="identity-bars">{Object.entries(profile.identity).slice(0, 6).map(([name, value]) => <span key={name}>{name}<b>{value.toFixed(0)}</b><i><em style={{ width: `${value}%` }} /></i></span>)}</div></section>
}
