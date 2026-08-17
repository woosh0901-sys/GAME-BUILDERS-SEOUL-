import type { Country, DiplomaticAgreement, DiplomaticNegotiation, Diplomacy2State, NegotiationTopic } from '../../types/game'
import { relationKey, updateRelation } from './diplomacyUtils'

export function createDiplomacy2State(): Diplomacy2State { return { negotiations: [], agreements: [], promises: [], blocs: [], history: [] } }
export function normalizeDiplomacy2(state?: Diplomacy2State): Diplomacy2State { return state ?? createDiplomacy2State() }

export function startNegotiation(state: Diplomacy2State, initiatorId: string, targetId: string, topic: NegotiationTopic, turn: number, countries: Country[]) {
  const existing = state.negotiations.some((item) => item.status !== '합의' && item.status !== '결렬' && item.initiatorId === initiatorId && item.targetId === targetId && item.topic === topic)
  if (!countries.some((country) => country.id === initiatorId) || !countries.some((country) => country.id === targetId) || existing) return state
  const negotiation: DiplomaticNegotiation = { id: `negotiation-${Date.now()}`, initiatorId, targetId, topic, status: '제안', round: 1, expiresTurn: turn + 6, offer: `${topic} 협력을 제안합니다.` }
  return { ...state, negotiations: [...state.negotiations, negotiation].slice(-20) }
}

export function resolveNegotiation(state: Diplomacy2State, negotiationId: string, response: 'accept' | 'counter' | 'reject', turn: number, relations: Record<string, import('../../types/game').DiplomaticRelation>) {
  const negotiation = state.negotiations.find((item) => item.id === negotiationId)
  if (!negotiation) return { state, relations }
  if (response === 'counter' && negotiation.round < 3) return { state: { ...state, negotiations: state.negotiations.map((item) => item.id === negotiationId ? { ...item, status: '반대 제안' as const, round: item.round + 1, counterOffer: `${item.topic} 협력 조건을 조정해 재협상합니다.` } : item) }, relations }
  const accepted = response === 'accept'
  const key = relationKey(negotiation.initiatorId, negotiation.targetId)
  const relation = relations[key]
  const nextRelations = relation ? { ...relations, [key]: { ...updateRelation(relation, accepted ? 5 : -2, accepted ? -2 : 1), ...(accepted && negotiation.topic === '무역' ? { tradeAgreement: true } : {}) } } : relations
  if (!accepted) return { state: { ...state, negotiations: state.negotiations.map((item) => item.id === negotiationId ? { ...item, status: '결렬' as const } : item), history: [`${negotiation.topic} 협상이 결렬되었습니다.`, ...state.history].slice(0, 30) }, relations: nextRelations }
  const agreement: DiplomaticAgreement = { id: `agreement-${Date.now()}`, type: negotiation.topic, members: [negotiation.initiatorId, negotiation.targetId], startTurn: turn, endTurn: turn + (negotiation.topic === '공동연구' ? 24 : 12), terms: [`${negotiation.topic} 협력`, '상호 신뢰 강화'], active: true }
  return { state: { ...state, negotiations: state.negotiations.map((item) => item.id === negotiationId ? { ...item, status: '합의' as const } : item), agreements: [...state.agreements, agreement].slice(-30), history: [`${negotiation.topic} 협정이 체결되었습니다.`, ...state.history].slice(0, 30) }, relations: nextRelations }
}

export function advanceDiplomacy2(state: Diplomacy2State, turn: number) {
  const agreements = state.agreements.map((agreement) => agreement.endTurn && turn >= agreement.endTurn ? { ...agreement, active: false } : agreement)
  const negotiations = state.negotiations.map((negotiation) => negotiation.status !== '합의' && negotiation.status !== '결렬' && turn >= negotiation.expiresTurn ? { ...negotiation, status: '결렬' as const } : negotiation)
  return { ...state, agreements, negotiations }
}
