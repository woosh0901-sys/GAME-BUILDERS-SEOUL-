import { useGameStore } from '../store/gameStore'
import { getRelation } from '../game/diplomacy/diplomacyUtils'
import type { NegotiationTopic } from '../types/game'

const topics: NegotiationTopic[] = ['무역', '투자', '기술', '공동연구', '안보', '문화교류']

export function DiplomacyPanel() {
  const state = useGameStore()
  const player = state.countries.find((country) => country.id === state.playerCountryId)
  const target = state.countries.find((country) => country.id === state.selectedCountryId)
  if (!player || !target || player.id === target.id) return null
  const relation = getRelation(state.relations, player.id, target.id)
  if (!relation) return null
  const negotiations = (state.diplomacy2?.negotiations ?? []).filter((item) => item.initiatorId === player.id || item.targetId === player.id).filter((item) => item.status !== '합의' && item.status !== '결렬')
  const metric = (label: string, value: number, suffix = '') => <span><small>{label}</small><b>{value.toFixed(0)}{suffix}</b></span>
  return <section className="panel diplomacy-panel">
    <div className="panel-title"><h2>외교 관계 · {target.name}</h2><span className="tag">{relation.relationshipType ?? '중립'}</span></div>
    <div className="diplomacy-metrics">{metric('관계', relation.opinion)}{metric('신뢰', relation.trust ?? 50)}{metric('위협', relation.threat ?? relation.tension)}{metric('경제 의존', relation.economicDependence ?? 0, '%')}{metric('외교 영향력', relation.diplomaticInfluence ?? 0)}</div>
    <div className="diplomacy-details"><p>국제 평판 <b>{player.diplomaticState?.internationalReputation?.toFixed(0) ?? '0'}</b></p><p>세계 긴장도 <b>{player.diplomaticState?.worldTension?.toFixed(0) ?? '0'}</b></p><p>현재 협정 <b>{relation.alliance ? '동맹' : relation.nonAggressionPact ? '불가침 협정' : relation.tradeAgreement ? '무역 협정' : '없음'}</b></p></div>
    <div className="section-label">협상 시작</div><div className="negotiation-topics">{topics.map((topic) => <button key={topic} className="diplomacy-action" onClick={() => state.startNegotiation(target.id, topic)}>{topic} 협상</button>)}</div>
    <div className="section-label">진행 중인 협상</div>{negotiations.length ? negotiations.map((negotiation) => <div className="negotiation-card" key={negotiation.id}><b>{negotiation.topic} · {negotiation.status}</b><small>{negotiation.offer} · {negotiation.round}차 협상</small><div>{negotiation.targetId === player.id ? <><button onClick={() => state.respondNegotiation(negotiation.id, 'accept')}>수락</button><button onClick={() => state.respondNegotiation(negotiation.id, 'counter')}>반대 제안</button><button onClick={() => state.respondNegotiation(negotiation.id, 'reject')}>거절</button></> : <span>상대국 검토 중</span>}</div></div>) : <p className="diplomacy-hint">진행 중인 협상이 없습니다.</p>}
    <div className="section-label">관계 변화 원인</div><div className="diplomacy-reasons">{(relation.lastReasons?.length ? relation.lastReasons : ['현재 관계를 분석 중입니다.']).map((reason) => <span key={reason}>● {reason}</span>)}</div>
  </section>
}
