import type { Country, PoliticalFaction, PoliticalState, WarState } from '../../types/game'
import { clamp } from '../economy/clamp'
import { clampPolitical, defaultPolicies, policyLabels } from './politicsUtils'

export function createPoliticalState(country: Country): PoliticalState {
  const governmentType = country.id === 'china' ? '사회주의' : country.id === 'russia' ? '권위주의' : country.id === 'uk' ? '왕정' : '민주주의'
  const factions: PoliticalFaction[] = governmentType === '민주주의' ? [{ id: 'conservative', name: '보수파', support: 30 }, { id: 'reformist', name: '개혁파', support: 25 }, { id: 'progressive', name: '진보파', support: 20 }, { id: 'liberal', name: '자유주의파', support: 25 }] : [{ id: 'loyalist', name: '정부 충성파', support: 45 }, { id: 'military', name: '군부', support: 25 }, { id: 'nationalist', name: '민족주의자', support: 20 }, { id: 'reformist', name: '개혁파', support: 10 }]
  return { governmentType, politicalStability: country.stability, publicApproval: Math.min(90, country.stability - 4), freedom: governmentType === '민주주의' ? 72 : governmentType === '왕정' ? 58 : 35, nationalism: country.id === 'russia' ? 72 : country.id === 'china' ? 62 : 45, militarism: country.id === 'russia' ? 76 : country.id === 'han' ? 58 : 40, pacifism: governmentType === '민주주의' ? 55 : 30, liberalism: governmentType === '민주주의' ? 70 : 25, authoritarianism: governmentType === '권위주의' || governmentType === '사회주의' ? 72 : 25, economicLeft: governmentType === '사회주의' ? 78 : 42, economicRight: governmentType === '민주주의' ? 58 : 38, currentPolicies: defaultPolicies(), policyCooldown: 0, politicalPower: 60, warExhaustion: 0, politicalConflict: 18, factions, rulingFactionId: factions[0].id, leader: { name: `${country.name} 국가원수`, ideology: governmentType, popularity: 62, trait: country.id === 'han' ? '개혁가' : '경제 전문가' } }
}

export function normalizePolitical(country: Country): PoliticalState {
  const fallback = createPoliticalState(country)
  return { ...fallback, ...(country.politicalState ?? {}), factions: country.politicalState?.factions?.length ? country.politicalState.factions : fallback.factions, leader: country.politicalState?.leader ?? fallback.leader, politicalPower: country.politicalState?.politicalPower ?? fallback.politicalPower, warExhaustion: country.politicalState?.warExhaustion ?? fallback.warExhaustion, politicalConflict: country.politicalState?.politicalConflict ?? fallback.politicalConflict, rulingFactionId: country.politicalState?.rulingFactionId ?? fallback.rulingFactionId }
}

export function applyPolicy(country: Country, policy: import('../../types/game').PolicyId, category: string) {
  const political = country.politicalState ?? createPoliticalState(country)
  const politicalPower = political.politicalPower ?? 60
  if (political.policyCooldown > 0) return { country, error: `정책 변경까지 ${political.policyCooldown}개월이 남았습니다.` }
  if (country.treasury < 10) return { country, error: '정책 변경 비용 10이 필요합니다.' }
  if (politicalPower < 10) return { country, error: '정치력이 부족합니다.' }
  const nextPolitical = { ...political, currentPolicies: { ...political.currentPolicies, [category]: policy }, policyCooldown: 3, politicalPower: politicalPower - 10 }
  return { country: { ...country, treasury: country.treasury - 10, politicalState: nextPolitical }, message: `${country.name} 정부가 ${policyLabels[policy]} 정책을 시행했습니다.` }
}

export function updatePolitics(country: Country, political: PoliticalState, wars: WarState[]) {
  const atWar = wars.some((war) => war.active && (war.attacker === country.id || war.defender === country.id))
  const warCount = wars.filter((war) => war.active && (war.attacker === country.id || war.defender === country.id)).length
  const warExhaustion = Math.min(100, (political.warExhaustion ?? 0) + (atWar ? 0.8 + warCount * 0.2 : -1.2))
  const policies = Object.values(political.currentPolicies)
  let approvalDelta = country.gdpGrowth * 0.35 - country.unemployment * 0.08 - country.inflation * 0.1 - warExhaustion * 0.025 + (country.treasury > 100 ? 0.08 : -0.25)
  let stabilityDelta = country.gdpGrowth * 0.12 - country.unemployment * 0.04 - (atWar ? 0.55 + warCount * 0.1 : 0) - warExhaustion * 0.012 + (political.governmentType === '민주주의' ? 0.08 : 0)
  if (policies.includes('welfareUp')) { approvalDelta += 0.55; stabilityDelta += 0.25 }
  if (policies.includes('welfareDown')) { approvalDelta -= 0.18; stabilityDelta -= 0.1 }
  if (policies.includes('austerity')) { approvalDelta -= 0.35; stabilityDelta -= 0.08 }
  if (policies.includes('control')) { stabilityDelta += 0.25; approvalDelta -= 0.2; }
  if (policies.includes('freedom') && political.liberalism > 50) approvalDelta += 0.25
  if (policies.includes('defense') && political.militarism > 50) approvalDelta += 0.12
  const researchStability = (country.researchState?.completedTechnologies.includes('welfare_administration') ? 0.12 : 0) + (country.researchState?.completedTechnologies.includes('public_health') ? 0.12 : 0)
  const factionShift = (political.factions ?? []).map((faction, index) => ({ ...faction, support: faction.support + (policies.includes('defense') && faction.id === 'military' ? 0.8 : policies.includes('welfareUp') && faction.id === 'progressive' ? 0.8 : index === 0 ? 0.1 : -0.1) }))
  const totalSupport = factionShift.reduce((sum, faction) => sum + faction.support, 0) || 1
  const normalizedFactions = factionShift.map((faction) => ({ ...faction, support: faction.support / totalSupport * 100 }))
  const next: PoliticalState = { ...political, publicApproval: clampPolitical(political.publicApproval + clamp(approvalDelta, -4, 4)), politicalStability: clampPolitical(political.politicalStability + clamp(stabilityDelta + researchStability, -3, 3)), policyCooldown: Math.max(0, political.policyCooldown - 1), politicalPower: Math.min(200, (political.politicalPower ?? 60) + (political.politicalStability > 60 ? 2.5 : 1)), warExhaustion, politicalConflict: clampPolitical((political.politicalConflict ?? 18) + (atWar ? 0.5 : -0.3) + (political.publicApproval < 35 ? 0.4 : 0)), factions: normalizedFactions, leader: political.leader ?? { name: `${country.name} 국가원수`, ideology: political.governmentType, popularity: 60, trait: '경제 전문가' }, rulingFactionId: political.rulingFactionId ?? normalizedFactions[0]?.id ?? 'government' }
  const economicPolicy = political.currentPolicies.economy
  const effects = { gdpGrowth: economicPolicy === 'market' ? 0.08 : economicPolicy === 'industry' ? 0.05 : economicPolicy === 'austerity' ? -0.12 : 0, industry: economicPolicy === 'industry' ? 0.18 : 0, treasury: economicPolicy === 'austerity' ? 8 : economicPolicy === 'industry' ? -6 : economicPolicy === 'welfareUp' ? -5 : 0, unemployment: policies.includes('welfareUp') ? -0.08 : policies.includes('welfareDown') ? 0.04 : 0, military: policies.includes('defense') ? 0.18 : policies.includes('disarmament') ? -0.18 : 0 }
  return { political: next, country: { ...country, stability: next.politicalStability, gdpGrowth: country.gdpGrowth + effects.gdpGrowth, industry: Math.max(0, country.industry + effects.industry), treasury: Math.max(0, country.treasury + effects.treasury), unemployment: clamp(country.unemployment + effects.unemployment, 0, 100), military: Math.max(0, country.military + effects.military) }, effects }
}
