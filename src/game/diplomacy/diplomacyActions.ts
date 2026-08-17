import type { Country, DiplomaticRelation } from '../../types/game'
import { clamp } from '../economy/clamp'
import { getRelation, relationKey, updateRelation } from './diplomacyUtils'

export type DiplomacyAction = 'improve' | 'worsen' | 'mission' | 'withdrawMission' | 'trade' | 'nonAggression' | 'alliance' | 'endTrade' | 'endNonAggression' | 'endAlliance'
export interface ActionResult { countries: Country[]; relations: Record<string, DiplomaticRelation>; message: string; error?: string }

const costs: Partial<Record<DiplomacyAction, number>> = { improve: 10, mission: 5, trade: 5, nonAggression: 5, alliance: 10 }

export function canDiplomaticAction(action: DiplomacyAction, relation: DiplomaticRelation, treasury: number) {
  const cost = costs[action] ?? 0
  if (treasury < cost) return '국고가 부족합니다.'
  if (action === 'mission' && relation.diplomaticMission) return '이미 외교관이 파견되어 있습니다.'
  if (action === 'withdrawMission' && !relation.diplomaticMission) return '파견된 외교관이 없습니다.'
  if (action === 'trade' && (relation.opinion < 20 || relation.tradeAgreement)) return relation.tradeAgreement ? '이미 무역 협정을 체결한 국가입니다.' : `무역 협정에는 관계도 20 이상이 필요합니다. 현재 관계도: ${relation.opinion}`
  if (action === 'nonAggression' && (relation.opinion < 30 || relation.nonAggressionPact)) return relation.nonAggressionPact ? '이미 불가침 협정을 체결한 국가입니다.' : `불가침 협정에는 관계도 30 이상이 필요합니다. 현재 관계도: ${relation.opinion}`
  if (action === 'alliance' && (relation.opinion < 60 || !relation.tradeAgreement || !relation.nonAggressionPact || relation.alliance)) return relation.alliance ? '이미 동맹을 체결한 국가입니다.' : relation.opinion < 60 ? `동맹에는 관계도 60 이상이 필요합니다. 현재 관계도: ${relation.opinion}` : '동맹에는 무역 협정과 불가침 협정이 필요합니다.'
  return undefined
}

export function executeDiplomaticAction(action: DiplomacyAction, actorId: string, targetId: string, countries: Country[], relations: Record<string, DiplomaticRelation>): ActionResult {
  const key = relationKey(actorId, targetId)
  const relation = getRelation(relations, actorId, targetId)
  const actor = countries.find((country) => country.id === actorId)!
  const target = countries.find((country) => country.id === targetId)!
  const error = canDiplomaticAction(action, relation, actor.treasury)
  if (error) return { countries, relations, message: '', error }
  const nextRelations = { ...relations, [key]: { ...relation } }
  const next = nextRelations[key]
  const nextCountries = countries.map((country) => ({ ...country }))
  const actorNext = nextCountries.find((country) => country.id === actorId)!
  const targetNext = nextCountries.find((country) => country.id === targetId)!
  const spend = costs[action] ?? 0
  actorNext.treasury = Math.max(0, actorNext.treasury - spend)
  let message = ''
  switch (action) {
    case 'improve': nextRelations[key] = updateRelation(next, 10 + (actor.researchState?.completedTechnologies.includes('diplomacy') ? 2 : 0)); message = `${actor.name}이(가) ${target.name}과의 관계 개선을 추진했습니다.`; break
    case 'worsen': nextRelations[key] = updateRelation(next, -10, 4); message = `${actor.name}이(가) ${target.name}에 외교적 압박을 가했습니다.`; break
    case 'mission': next.diplomaticMission = true; message = `${actor.name}이(가) ${target.name}에 외교관을 파견했습니다.`; break
    case 'withdrawMission': next.diplomaticMission = false; nextRelations[key] = updateRelation(next, -2); message = `${actor.name}이(가) ${target.name} 주재 외교관을 철수했습니다.`; break
    case 'trade': next.tradeAgreement = true; nextRelations[key] = updateRelation(next, 2); actorNext.gdpGrowth = clamp(actorNext.gdpGrowth + 0.2, -4, 10); targetNext.gdpGrowth = clamp(targetNext.gdpGrowth + 0.2, -4, 10); message = `${actor.name}과(와) ${target.name}이(가) 무역 협정을 체결했습니다.`; break
    case 'nonAggression': next.nonAggressionPact = true; nextRelations[key] = updateRelation(next, 1, -10); message = `${actor.name}과(와) ${target.name}이(가) 불가침 협정을 체결했습니다.`; break
    case 'alliance': next.alliance = true; nextRelations[key] = updateRelation(next, 10, -5); actorNext.stability = clamp(actorNext.stability + 2, 0, 100); targetNext.stability = clamp(targetNext.stability + 2, 0, 100); actorNext.gdpGrowth = clamp(actorNext.gdpGrowth + 0.1, -4, 10); targetNext.gdpGrowth = clamp(targetNext.gdpGrowth + 0.1, -4, 10); message = `${actor.name}과(와) ${target.name}이(가) 동맹을 체결했습니다.`; break
    case 'endTrade': next.tradeAgreement = false; nextRelations[key] = updateRelation(next, -5); message = `${actor.name}이(가) ${target.name}과의 무역 협정을 종료했습니다.`; break
    case 'endNonAggression': next.nonAggressionPact = false; nextRelations[key] = updateRelation(next, -8, 5); message = `${actor.name}이(가) ${target.name}과의 불가침 협정을 종료했습니다.`; break
    case 'endAlliance': next.alliance = false; nextRelations[key] = updateRelation(next, -15, 8); message = `${actor.name}이(가) ${target.name}과의 동맹을 종료했습니다.`; break
  }
  return { countries: nextCountries, relations: nextRelations, message }
}
