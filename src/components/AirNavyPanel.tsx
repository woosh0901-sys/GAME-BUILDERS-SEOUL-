import { useGameStore } from '../store/gameStore'
import { airPower } from '../game/air/airForceEngine'
import { fleetPower } from '../game/navy/navyEngine'

export function AirNavyPanel() {
  const countryId = useGameStore((state) => state.playerCountryId)
  const airForces = useGameStore((state) => (state.airForces ?? []).filter((air) => air.countryId === countryId))
  const fleets = useGameStore((state) => (state.fleets ?? []).filter((fleet) => fleet.countryId === countryId))
  const airSuperiority = useGameStore((state) => state.airSuperiority ?? {})
  const navalControl = useGameStore((state) => state.navalControl ?? {})
  const blockades = useGameStore((state) => state.blockades ?? {})
  const seaRegions = useGameStore((state) => state.seaRegions ?? [])
  const operations = useGameStore((state) => (state.amphibiousOperations ?? []).filter((item) => item.countryId === countryId))
  const setAirMission = useGameStore((state) => state.setAirMission)
  const setFleetMission = useGameStore((state) => state.setFleetMission)
  const planAmphibious = useGameStore((state) => state.planAmphibious)
  const aircraft = airForces.reduce((sum, air) => ({ fighters: sum.fighters + air.aircraft.fighters, cas: sum.cas + air.aircraft.cas, bombers: sum.bombers + air.aircraft.bombers, maritimePatrol: sum.maritimePatrol + air.aircraft.maritimePatrol, transports: sum.transports + air.aircraft.transports }), { fighters: 0, cas: 0, bombers: 0, maritimePatrol: 0, transports: 0 })
  const ships = fleets.reduce((sum, fleet) => ({ carriers: sum.carriers + fleet.ships.carriers, battleships: sum.battleships + fleet.ships.battleships, cruisers: sum.cruisers + fleet.ships.cruisers, destroyers: sum.destroyers + fleet.ships.destroyers, submarines: sum.submarines + fleet.ships.submarines, transports: sum.transports + fleet.ships.transports }), { carriers: 0, battleships: 0, cruisers: 0, destroyers: 0, submarines: 0, transports: 0 })
  const ownAirPower = Math.round(airForces.reduce((sum, air) => sum + airPower(air), 0))
  const ownFleetPower = Math.round(fleets.reduce((sum, fleet) => sum + fleetPower(fleet), 0))
  return <section className="air-navy-panel panel-card"><div className="panel-heading"><div><span className="eyebrow">육해공 작전</span><h2>공군 · 해군</h2></div><span className="stat-pill">봉쇄 {blockades[countryId] ?? 0}%</span></div>
    <div className="air-navy-columns"><div><h3>✈ 공군</h3><div className="metric-grid"><span>전투기 <b>{aircraft.fighters}</b></span><span>근접항공지원기 <b>{aircraft.cas}</b></span><span>폭격기 <b>{aircraft.bombers}</b></span><span>수송기 <b>{aircraft.transports}</b></span><span>작전력 <b>{ownAirPower}</b></span></div>{airForces.map((air) => <div className="operation-row" key={air.id}><span>{air.name}<small>준비도 {air.readiness}% · 연료 {air.fuel}%</small></span><select value={air.mission} onChange={(event) => setAirMission(air.id, event.target.value as typeof air.mission)}><option>대기</option><option>제공권 확보</option><option>지상군 지원</option><option>전략 폭격</option><option>정찰</option></select></div>)}</div><div><h3>⚓ 해군</h3><div className="metric-grid"><span>항공모함 <b>{ships.carriers}</b></span><span>순양함 <b>{ships.cruisers}</b></span><span>구축함 <b>{ships.destroyers}</b></span><span>잠수함 <b>{ships.submarines}</b></span><span>함대력 <b>{ownFleetPower}</b></span></div>{fleets.map((fleet) => <div className="operation-row" key={fleet.id}><span>{fleet.name}<small>준비도 {fleet.readiness}% · 연료 {fleet.fuel}%</small></span><select value={fleet.mission} onChange={(event) => setFleetMission(fleet.id, event.target.value as typeof fleet.mission)}><option>해상권 확보</option><option>호송</option><option>해상 봉쇄</option><option>잠수함 작전</option><option>상륙 지원</option><option>대기</option></select></div>)}</div></div>
    <div className="sea-control"><h3>해역 통제</h3>{seaRegions.map((sea) => <span key={sea.id}>{sea.name} <b>{navalControl[sea.id]?.[countryId] ?? 0}%</b></span>)}</div><div className="air-navy-actions"><button className="small-button" onClick={planAmphibious}>상륙작전 준비</button>{operations.map((operation) => <span key={operation.id} className="stat-pill">상륙 준비 {operation.preparation}% · {operation.status}</span>)}</div><p className="muted">제공권과 해상권은 턴 진행 시 계산되어 육군 전투·무역·상륙작전에 반영됩니다.</p>
  </section>
}
