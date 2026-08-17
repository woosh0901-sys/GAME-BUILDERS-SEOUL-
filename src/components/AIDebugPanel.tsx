import { useGameStore } from '../store/gameStore'

export function AIDebugPanel() {
  if (!import.meta.env.DEV) return null
  const countries = useGameStore((state) => state.countries)
  const playerId = useGameStore((state) => state.playerCountryId)
  const aiCountries = countries.filter((country) => country.id !== playerId && country.aiState)
  if (!aiCountries.length) return null
  return <section className="panel ai-debug-panel"><div className="panel-title"><h2>AI 국가 판단</h2><span className="tag">월간 적응형 의사결정</span></div><div className="ai-debug-grid">{aiCountries.slice(0, 6).map((country) => { const ai = country.aiState!; const decision = ai.lastDecision; return <div className="ai-card" key={country.id}><h3>{country.name}</h3><p>목표 <b>{ai.longTermGoal}</b></p><p>전략 <b>{ai.currentStrategy}</b></p><p>성향 <b>{ai.personality.경제중시 >= ai.personality.공격성 ? '경제·실용형' : '안보·경쟁형'}</b></p><p>최근 판단 <b>{decision?.action ?? '분석 중'}</b></p>{decision && <small>{decision.reason}</small>}<div className="ai-history">{ai.actionHistory.slice(0, 3).map((item) => <span key={`${item.turn}-${item.action}`}>{item.action}</span>)}</div></div> })}</div></section>
}
