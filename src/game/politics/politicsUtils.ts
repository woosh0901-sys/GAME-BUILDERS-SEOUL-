import type { GovernmentType, PolicyId } from '../../types/game'
import { clamp } from '../economy/clamp'

export const policyLabels: Record<PolicyId, string> = { market: '시장경제 강화', industry: '산업 육성', austerity: '긴축 재정', welfareUp: '복지 확대', welfareDown: '복지 축소', defense: '국방 강화', disarmament: '군비 축소', freedom: '자유 확대', control: '사회 통제 강화' }
export const governmentLabels: Record<GovernmentType, string> = { 민주주의: '민주주의', 권위주의: '권위주의', 군사정권: '군사정권', 사회주의: '사회주의', 왕정: '왕정' }
export const clampPolitical = (value: number) => clamp(Math.round(value * 10) / 10, 0, 100)
export const defaultPolicies = (): Record<string, PolicyId> => ({ economy: 'market', welfare: 'welfareDown', military: 'defense', society: 'freedom' })
