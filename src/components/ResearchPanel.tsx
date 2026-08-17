import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { technologies } from '../game/research/researchData'
import { getResearchable, createResearchState } from '../game/research/researchUtils'
import type { ResearchCategory } from '../types/game'
import { normalizeTechnology } from '../game/research/technologyEngine'

const categories: ResearchCategory[] = ['산업', '경제', '군사', '과학', '사회', '외교']
export function ResearchPanel() {
  const [category, setCategory] = useState<ResearchCategory>('산업')
  const [selected, setSelected] = useState<string | null>(null)
  const { playerCountryId, countries, startResearch: beginResearch, cancelResearch: stopResearch } = useGameStore()
  const player = countries.find((country) => country.id === playerCountryId) ?? countries[0]
  const research = player.researchState ?? createResearchState(player)
  const technology = normalizeTechnology(player)
  const available = getResearchable(research)
  const nodes = technologies.filter((tech) => tech.category === category)
  const selectedTech = technologies.find((tech) => tech.id === selected)
  const status = (id: string) => research.completedTechnologies.includes(id) ? '완료' : research.activeResearch.includes(id) ? '연구 중' : available.some((tech) => tech.id === id) ? '연구 가능' : '잠김'
  return <section className="research-panel"><div className="panel-heading"><div><span className="eyebrow">국가 발전</span><h2>기술 연구</h2></div><span className="map-status">연구력 {research.researchPoints.toFixed(1)} · 속도 +{research.researchSpeed.toFixed(0)}%</span></div><div className="research-content"><div className="research-slots"><span>연구 슬롯 {research.activeResearch.length} / {research.researchSlots}</span>{research.activeResearch.map((id) => { const tech = technologies.find((item) => item.id === id)!; return <div className="research-progress" key={id}><b>{tech.name}</b><span>{Math.min(100, research.progress[id] ?? 0).toFixed(0)}%</span><i><em style={{ width: `${Math.min(100, research.progress[id] ?? 0)}%` }} /></i><button onClick={() => stopResearch(player.id, id)}>취소</button></div> })}</div><div className="tech-tabs">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="tech-tree">{nodes.map((tech, index) => <button key={tech.id} className={`tech-node ${status(tech.id).replace(' ', '-')}`} onClick={() => setSelected(tech.id)}><strong>{tech.name}</strong><span>{status(tech.id)}</span>{index < nodes.length - 1 && <i>↓</i>}</button>)}</div>{selectedTech && <div className="tech-detail"><div><span className="section-label">기술 상세</span><h3>{selectedTech.name}</h3><p>{selectedTech.description}</p><small>연구 기간 {selectedTech.researchMonths}개월 · 선행 기술 {selectedTech.prerequisites.length ? selectedTech.prerequisites.map((id) => technologies.find((tech) => tech.id === id)?.name).join(', ') : '없음'}</small><div className="tech-effects">{selectedTech.effects.map((effect) => <span key={effect}>◆ {effect}</span>)}</div></div><button className="research-start" disabled={status(selectedTech.id) !== '연구 가능' || research.activeResearch.length >= research.researchSlots} onClick={() => { beginResearch(player.id, selectedTech.id); setSelected(null) }}>연구 시작</button></div>}</div></section>
}
