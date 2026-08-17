import type { FrontLine, MilitaryUnit, RegionState, SupplyState, WarState } from '../../types/game'
import { resolveCombat } from './combatEngine'
import { calculateSupply } from './supplyEngine'
import { completeTraining, setOrder } from './unitEngine'

export function advanceMilitaryTurn(units: MilitaryUnit[], trainingQueue: import('../../types/game').UnitTrainingProject[], wars: WarState[], territories: Record<string, RegionState[]>, manpowerPools: Record<string, number>, fronts: FrontLine[]) {
  const completed: MilitaryUnit[] = []; const queue = trainingQueue.map((item) => ({ ...item, monthsRemaining: item.monthsRemaining - 1 }))
  queue.forEach((item, index) => { if (item.monthsRemaining <= 0) completed.push(completeTraining(item, index)) })
  const nextQueue = queue.filter((item) => item.monthsRemaining > 0)
  let nextUnits = [...units, ...completed].map((unit) => ({ ...unit }))
  const messages: string[] = []
  for (const unit of nextUnits) {
    if (unit.order === '이동' && unit.targetRegionId) { unit.regionId = unit.targetRegionId; unit.status = '대기'; messages.push(`${unit.name}이(가) ${unit.targetRegionId} 지역으로 이동했습니다.`) }
  }
  for (const front of fronts) {
    const war = wars.find((item) => item.id === front.warId); if (!war) continue
    const target = territories[war.defender]?.find((region) => front.regionIds.includes(region.id) && region.ownerCountryId === war.defender)
    if (!target) continue
    const attackers = nextUnits.filter((unit) => unit.countryId === war.attacker && unit.order === '공격')
    const defenders = nextUnits.filter((unit) => unit.countryId === war.defender && unit.regionId === target.id)
    if (!attackers.length || !defenders.length) continue
    const result = resolveCombat(attackers, defenders, target); messages.push(`${target.name} 전투: ${result.result}입니다.`)
    const loss = result.result === '공격 승리' ? 0.06 : result.result === '방어 승리' ? 0.04 : 0.025
    attackers.forEach((unit) => { unit.manpower = Math.max(100, Math.floor(unit.manpower * (1 - loss))); unit.organization = Math.max(0, unit.organization - 8); unit.experience = Math.min(100, unit.experience + 2); if (result.result === '공격 승리') { unit.regionId = target.id; unit.order = '대기'; unit.status = '대기' } })
    defenders.forEach((unit) => { unit.manpower = Math.max(100, Math.floor(unit.manpower * (1 - loss * 1.2))); unit.organization = Math.max(0, unit.organization - 10); if (result.result === '방어 승리') unit.status = '방어' })
    if (result.result === '공격 승리') { target.ownerCountryId = war.attacker; target.infrastructureDamage = Math.min(80, target.infrastructureDamage + 5); war.warScoreAttacker = Math.min(100, war.warScoreAttacker + 10); messages.push(`${war.attacker}이(가) ${target.name}을(를) 점령했습니다.`) }
    else if (result.result === '방어 승리') war.warScoreDefender = Math.min(100, war.warScoreDefender + 6)
  }
  const allRegions = Object.values(territories).flat(); const supplyStates = calculateSupply(nextUnits, allRegions)
  nextUnits = nextUnits.map((unit) => { const supply = supplyStates[unit.id]; const ratio = supply?.ratio ?? 1; return { ...unit, equipmentRatio: Math.max(0.35, Math.min(1, unit.equipmentRatio * 0.98 + ratio * 0.02)), organization: Math.min(unit.maxOrganization, unit.organization + (ratio > 0.7 ? 3 : 1)), combatPower: unit.combatPower } })
  return { units: nextUnits, trainingQueue: nextQueue, supplyStates, territories, manpowerPools, fronts, messages }
}
