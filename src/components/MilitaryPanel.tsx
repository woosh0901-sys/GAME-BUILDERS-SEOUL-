import { useGameStore } from '../store/gameStore'
import type { UnitType } from '../types/game'

const recruitable: UnitType[] = ['보병', '기계화', '전차', '산악', '공수', '해병']

export function MilitaryPanel() {
  const playerId = useGameStore((state) => state.playerCountryId)
  const units = useGameStore((state) => state.militaryUnits ?? [])
  const armies = useGameStore((state) => state.armies ?? [])
  const commanders = useGameStore((state) => state.commanders ?? [])
  const pools = useGameStore((state) => state.manpowerPools ?? {})
  const queue = useGameStore((state) => state.unitTrainingQueue ?? [])
  const supply = useGameStore((state) => state.supplyStates ?? {})
  const selected = useGameStore((state) => state.selectedUnitId)
  const selectUnit = useGameStore((state) => state.selectUnit)
  const recruitUnit = useGameStore((state) => state.recruitUnit)
  const setUnitOrder = useGameStore((state) => state.setUnitOrder)
  const ownUnits = units.filter((unit) => unit.countryId === playerId)
  const selectedUnit = ownUnits.find((unit) => unit.id === selected) ?? ownUnits[0]
  const ownArmy = armies.find((army) => army.countryId === playerId)
  const commander = commanders.find((item) => item.id === ownArmy?.commanderId)

  return <section className="military-panel panel-card">
    <div className="panel-heading"><div><span className="eyebrow">군사</span><h2>{playerId === 'han' ? '대한민국 육군' : '국가 육군'}</h2></div><span className="stat-pill">가용 인력 {(pools[playerId] ?? 0).toLocaleString()}명</span></div>
    <div className="military-overview"><span>군대 {armies.filter((army) => army.countryId === playerId).length}</span><span>사단 {ownUnits.length}</span><span>지휘관 {commander?.name ?? '없음'}</span></div>
    <div className="military-recruit"><strong>새 사단 편성</strong><div className="button-row">{recruitable.map((type) => <button key={type} className="small-button" onClick={() => recruitUnit(type)}>{type}</button>)}</div></div>
    {queue.filter((item) => item.countryId === playerId).map((item) => <div className="training-row" key={item.id}><span>{item.name} 훈련 중</span><span>{Math.max(0, item.monthsTotal - item.monthsRemaining)}/{item.monthsTotal}개월</span></div>)}
    <div className="unit-list">{ownUnits.map((unit) => <button key={unit.id} className={`unit-row ${selectedUnit?.id === unit.id ? 'selected' : ''}`} onClick={() => selectUnit(unit.id)}><span><strong>{unit.name}</strong><small>{unit.type} · {unit.regionId}</small></span><span>병력 {unit.manpower.toLocaleString()}<small>보급 {Math.round((supply[unit.id]?.ratio ?? 1) * 100)}%</small></span></button>)}</div>
    {selectedUnit && <div className="unit-detail"><div className="panel-heading"><strong>{selectedUnit.name}</strong><span>{selectedUnit.status}</span></div><div className="metric-grid"><span>조직력 <b>{Math.round(selectedUnit.organization)}%</b></span><span>사기 <b>{Math.round(selectedUnit.morale)}%</b></span><span>훈련도 <b>{Math.round(selectedUnit.training)}%</b></span><span>장비 충족 <b>{Math.round(selectedUnit.equipmentRatio * 100)}%</b></span><span>공격력 <b>{Math.round(selectedUnit.combatPower)}</b></span><span>방어력 <b>{Math.round(selectedUnit.defensePower)}</b></span></div><div className="button-row"><button className="small-button" onClick={() => setUnitOrder(selectedUnit.id, '공격')}>공격</button><button className="small-button" onClick={() => setUnitOrder(selectedUnit.id, '방어')}>방어</button><button className="small-button" onClick={() => setUnitOrder(selectedUnit.id, '대기')}>대기</button></div></div>}
  </section>
}
