import type { AIAction, AILongTermGoal, AIPersonality, AIState, Country, DiplomaticRelation, WarState } from '../../types/game'
import { executeDiplomaticAction } from '../diplomacy/diplomacyActions'
import { relationKey } from '../diplomacy/diplomacyUtils'

const clamp = (value: number, min = 0, max = 100) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min
const personalities: AIPersonality[] = [
  { 공격성: 75, 방어성: 25, 경제중시: 45, 기술중시: 40, 외교중시: 35, 고립주의: 25, 팽창주의: 80, 안정중시: 30, 실용주의: 55 },
  { 공격성: 25, 방어성: 75, 경제중시: 55, 기술중시: 45, 외교중시: 65, 고립주의: 35, 팽창주의: 20, 안정중시: 80, 실용주의: 70 },
  { 공격성: 35, 방어성: 45, 경제중시: 80, 기술중시: 55, 외교중시: 55, 고립주의: 30, 팽창주의: 25, 안정중시: 65, 실용주의: 80 },
  { 공격성: 30, 방어성: 40, 경제중시: 50, 기술중시: 85, 외교중시: 65, 고립주의: 20, 팽창주의: 20, 안정중시: 55, 실용주의: 75 },
]

function baseState(country: Country): AIState {
  const index = Math.abs(country.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % personalities.length
  const personality = personalities[index]
  const strategy = country.nationalProfile?.strategy
  const longTermGoal: AILongTermGoal = strategy === '군사강화' ? '군사강국' : strategy === '기술혁신' ? '기술패권' : strategy === '외교확대' ? '외교강국' : strategy === '내수중심' || strategy === '복지확대' ? '내부안정' : strategy === '수출중심' || strategy === '산업화' ? '경제대국' : personality.팽창주의 > 65 ? '지역패권' : '경제대국'
  return { personality, longTermGoal, currentStrategy: '상황 분석', priorities: { 경제: 25, 군사: 15, 기술: 20, 외교: 15, 교육: 10, 인프라: 10, 안정: 5 }, threatScores: {}, opportunityScores: {}, trustScores: {}, actionHistory: [], difficulty: '보통', evaluationCooldown: 0 }
}

export const normalizeAI = (country: Country) => country.aiState ?? baseState(country)

function evaluateAction(action: AIAction, country: Country, state: AIState, highestThreat: number, war: boolean): { score: number; cost: number; reason: string } {
  const deep = country.economicDeepState
  const integration = country.integrationState
  const crisis = (integration?.riskFactors.length ?? 0) + (deep?.financial.creditRisk ?? 0) / 25
  const scores: Record<AIAction, number> = { '경제 투자': state.personality.경제중시 + (country.gdpGrowth < 1 ? 25 : 0) + (country.unemployment > 8 ? 12 : 0), '산업 투자': state.personality.경제중시 + (country.industry < 60 ? 18 : 0) + (country.gdpGrowth < 0 ? 10 : 0), 'R&D 투자': state.personality.기술중시 + (country.technology < 65 ? 22 : 0) + (state.longTermGoal === '기술패권' ? 28 : 0), '군사 투자': state.personality.공격성 * 0.35 + state.personality.방어성 * 0.3 + highestThreat * 0.45 + (war ? 25 : 0), '외교 개선': state.personality.외교중시 + highestThreat * 0.18 + (state.longTermGoal === '외교강국' ? 22 : 0), '무역 확대': state.personality.경제중시 * 0.7 + state.personality.외교중시 * 0.25, '동맹 강화': state.personality.외교중시 + state.personality.방어성 * 0.35 + highestThreat * 0.25, '기술 협력': state.personality.기술중시 * 0.6 + state.personality.외교중시 * 0.3, '내부 안정': state.personality.안정중시 + crisis * 8 + (country.stability < 45 ? 25 : 0), '교육 투자': state.personality.기술중시 * 0.6 + (country.socialState?.education ?? 50) < 45 ? 28 : 10, '인프라 투자': state.personality.경제중시 * 0.6 + (country.industry < 50 ? 20 : 0) }
  const cost: Record<AIAction, number> = { '경제 투자': 3, '산업 투자': 4, 'R&D 투자': 3, '군사 투자': 6, '외교 개선': 1, '무역 확대': 1, '동맹 강화': 2, '기술 협력': 2, '내부 안정': 2, '교육 투자': 3, '인프라 투자': 4 }
  const reason = action === '군사 투자' ? `최대 위협도 ${highestThreat.toFixed(0)}` : action === '내부 안정' ? `국가 안정도 ${integration?.nationalStability.toFixed(0) ?? '확인 중'}` : action === 'R&D 투자' ? `기술 수준 ${country.technology.toFixed(0)} 및 ${state.longTermGoal} 목표` : `국가 목표 ${state.longTermGoal}와 경제 상황`
  return { score: scores[action] - (action === '군사 투자' && country.gdpGrowth < 0 ? 12 : 0), cost: cost[action], reason }
}

export function runAdaptiveAI(countries: Country[], relations: Record<string, DiplomaticRelation>, wars: WarState[], playerId: string, turn: number) {
  let nextCountries = countries
  let nextRelations = relations
  const messages: string[] = []
  countries.filter((country) => country.id !== playerId).forEach((country) => {
    const previous = normalizeAI(country)
    const others = countries.filter((item) => item.id !== country.id)
    const threatScores = Object.fromEntries(others.map((other) => { const relation = nextRelations[relationKey(country.id, other.id)]; return [other.id, clamp((other.military / Math.max(1, country.military)) * 42 + (relation?.tension ?? 0) * 0.35 + (relation?.historicalTension ?? 0) * 0.2)] }))
    const opportunityScores = Object.fromEntries(others.map((other) => { const relation = nextRelations[relationKey(country.id, other.id)]; return [other.id, clamp((other.gdp > country.gdp ? 8 : 25) + (relation?.economicDependence ?? 0) * 0.45 + (other.technology > country.technology ? 18 : 0))] }))
    const highestThreat = Math.max(0, ...Object.values(threatScores))
    let longTermGoal = previous.longTermGoal
    if ((country.integrationState?.nationalStability ?? country.stability) < 35) longTermGoal = '내부안정'
    else if ((country.technologyState?.technologyGap ?? 0) > 55) longTermGoal = '기술패권'
    else if (highestThreat > 75) longTermGoal = '군사강국'
    const candidates: AIAction[] = ['경제 투자', '산업 투자', 'R&D 투자', '군사 투자', '외교 개선', '무역 확대', '동맹 강화', '기술 협력', '내부 안정', '교육 투자', '인프라 투자']
    const scored = candidates.map((action) => ({ action, ...evaluateAction(action, country, { ...previous, longTermGoal }, highestThreat, wars.some((war) => war.active && (war.attacker === country.id || war.defender === country.id))) })).sort((a, b) => b.score - a.score)
    const chosen = scored[0]
    if (!chosen) return
    const available = Math.max(0, country.treasury)
    const affordable = chosen.cost <= Math.max(1, available / Math.max(1, country.gdp) * 100)
    const action = affordable ? chosen.action : '내부 안정'
    const outcome = action === '산업 투자' || action === '경제 투자' ? '산업 투자와 성장 여력 증가' : action === 'R&D 투자' || action === '교육 투자' ? '연구 기반 강화' : action === '군사 투자' ? '군사 대비 태세 강화' : action === '내부 안정' ? '정치·사회 안정 우선' : '외교·협력 활동 강화'
    const updated = { ...country, treasury: Math.max(0, country.treasury - chosen.cost), aiState: { ...previous, longTermGoal, currentStrategy: action, priorities: { ...previous.priorities, [action]: chosen.score }, threatScores, opportunityScores, lastDecision: { action, reason: chosen.reason, turn }, evaluationCooldown: 1, actionHistory: [{ turn, action, score: chosen.score, cost: chosen.cost, reason: chosen.reason, outcome }, ...previous.actionHistory].slice(0, 24) } }
    const economicallyUpdated = action === '산업 투자' || action === '경제 투자' ? { ...updated, industry: Math.max(1, updated.industry + 0.15), gdpGrowth: updated.gdpGrowth + 0.03 } : action === '군사 투자' ? { ...updated, military: Math.max(1, updated.military + 0.12) } : action === 'R&D 투자' ? { ...updated, technologyState: updated.technologyState ? { ...updated.technologyState, researchBudget: Math.min(8, updated.technologyState.researchBudget + 0.08) } : updated.technologyState } : updated
    nextCountries = nextCountries.map((item) => item.id === country.id ? economicallyUpdated : item)
    messages.push(`${country.name}: ${action} 선택 — ${chosen.reason}`)
    const target = others.sort((a, b) => (opportunityScores[b.id] ?? 0) - (opportunityScores[a.id] ?? 0))[0]
    if (target && (action === '외교 개선' || action === '무역 확대' || action === '동맹 강화' || action === '기술 협력')) {
      const diplomacyAction = action === '무역 확대' ? 'trade' : action === '동맹 강화' ? 'alliance' : action === '외교 개선' ? 'improve' : 'mission'
      const result = executeDiplomaticAction(diplomacyAction, country.id, target.id, nextCountries, nextRelations)
      if (!result.error) { nextCountries = result.countries; nextRelations = result.relations }
    }
  })
  return { countries: nextCountries, relations: nextRelations, messages }
}
