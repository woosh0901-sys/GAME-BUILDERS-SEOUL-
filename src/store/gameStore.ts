import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { advanceTime } from '../game/time'
import type { DomesticEvent, GameLogEntry, GameState, PolicyId, UnitType, UnitOrder } from '../types/game'
import { updateWorldEconomy } from '../game/economy/economyEngine'
import { updateEconomicSimulation } from '../game/economy/economicSimulation'
import { updateEconomicDeep } from '../game/economy/economicDeepEngine'
import { updateInnovation } from '../game/research/innovationEngine'
import { integrateWorldState } from '../game/simulation/worldSimulationEngine'
import { runAdaptiveAI } from '../game/ai/adaptiveAI'
import { createBalanceReport } from '../game/simulation/balanceAudit'
import { countries as initialCountries } from '../data/countries'
import { createInitialRelations, relationKey } from '../game/diplomacy/diplomacyUtils'
import { updateDiplomaticRelations } from '../game/diplomacy/diplomacyEngine'
import { runDiplomacyAI } from '../game/diplomacy/diplomacyAI'
import { updateDiplomacy } from '../game/diplomacy/diplomacySystem'
import { updateDomesticPolitics } from '../game/politics/domesticPoliticsEngine'
import { executeDiplomaticAction, type DiplomacyAction } from '../game/diplomacy/diplomacyActions'
import { createInitialTerritories } from '../game/military/territoryEngine'
import { declareWar, advanceWars, activeWarsFor } from '../game/military/warEngine'
import { makePeace } from '../game/military/peaceEngine'
import { runMilitaryAI } from '../game/military/militaryAI'
import { updateMilitary } from '../game/military/militaryEngine'
import { updateResources } from '../game/resources/resourceEngine'
import { advanceConstruction, canBuild } from '../game/regions/regionEngine'
import { buildings } from '../game/buildings/buildingData'
import { runRegionDevelopmentAI } from '../game/ai/regionDevelopmentAI'
import { emptyResources } from '../game/resources/resourceUtils'
import { normalizeRegion } from '../game/regions/regionEngine'
import { createPoliticalState, normalizePolitical, updatePolitics, applyPolicy } from '../game/politics/politicsEngine'
import { advanceFocus, nationalFocuses, startFocus } from '../game/politics/focusEngine'
import { generateDomesticEvent, resolveDomesticEvent } from '../game/politics/politicalEvents'
import { advanceResearch, cancelResearch, normalizeResearch, startResearch } from '../game/research/researchEngine'
import { updateTechnology } from '../game/research/technologyEngine'
import { updateNationalProfile } from '../game/national/nationalProfileEngine'
import { applyEventEffect, createFollowUp, generateDynamicEvent, recordEvent } from '../game/events/dynamicEventEngine'
import { advanceDiplomacy2, createDiplomacy2State, resolveNegotiation, startNegotiation } from '../game/diplomacy/diplomacy2Engine'
import { updateDomesticPolitics2 } from '../game/politics/domesticPolitics2Engine'
import { technologies } from '../game/research/researchData'
import { runResearchAI } from '../game/research/researchAI'
import { initialMilitary, createTraining, setOrder } from '../game/military/unitEngine'
import { createFrontLines } from '../game/military/frontEngine'
import { advanceMilitaryTurn } from '../game/military/militaryTurnEngine'
import { createInitialAirForces, updateAirForces } from '../game/air/airForceEngine'
import { createInitialFleets, createSeaRegions, updateNavies } from '../game/navy/navyEngine'
import { advanceAmphibious } from '../game/amphibious/amphibiousEngine'
import { addNationalMemory, calculateThreat, createMemoryState, decayMemories, memoryKey, recordHistoricalEvent, recordPair, updateThreats, warMemory } from '../game/memory/memoryEngine'
import { createSocialState, updateSociety } from '../game/society/societyEngine'
import { normalizePoliticalSystem, updatePoliticalSystem } from '../game/politics/politicalSystem'
import { startIntelligenceOperation, updateIntelligence } from '../game/intelligence/intelligenceEngine'

interface GameStore extends GameState {
  selectCountry: (id: string) => void
  nextTurn: () => void
  diplomaticAction: (action: DiplomacyAction, targetId: string) => void
  declareWar: (targetId: string) => void
  makePeace: (warId: string) => void
  changePolicy: (countryId: string, category: string, policy: PolicyId) => void
  resolveEvent: (eventId: string, choiceId: string) => void
  selectRegion: (id: string) => void
  constructBuilding: (buildingId: import('../types/game').BuildingId) => void
  startResearch: (countryId: string, techId: string) => void
  cancelResearch: (countryId: string, techId: string) => void
  selectUnit: (id: string | null) => void
  recruitUnit: (type: UnitType) => void
  setUnitOrder: (unitId: string, order: UnitOrder, targetRegionId?: string) => void
  setAirMission: (airId: string, mission: import('../types/game').AirMission) => void
  setFleetMission: (fleetId: string, mission: import('../types/game').NavalMission) => void
  planAmphibious: () => void
  startFocus: (focusId: string) => void
  startIntelligence: (targetId: string, type: import('../types/game').IntelligenceOperationType) => void
  resolveDynamicEvent: (eventId: string, optionId: string) => void
  startNegotiation: (targetId: string, topic: import('../types/game').NegotiationTopic) => void
  respondNegotiation: (negotiationId: string, response: 'accept' | 'counter' | 'reject') => void
}

const initialMilitaryData = initialMilitary(initialCountries, createInitialTerritories(initialCountries))
const initialTerritoryData = createInitialTerritories(initialCountries)
const initialAirData = createInitialAirForces(initialCountries, initialTerritoryData)
const initialFleetData = createInitialFleets(initialCountries, initialTerritoryData)
export const useGameStore = create<GameStore>()(persist((set) => ({
  year: 2026, turn: 1, treasury: 1200, playerCountryId: 'han', selectedCountryId: 'han', selectedRegionId: null, saveVersion: 29, randomSeed: 20260813,
  logs: [{ id: 0, text: '월드 오더 시뮬레이션이 시작되었습니다.', type: 'system' }],
  countries: initialCountries,
  lastChanges: {},
  relations: createInitialRelations(initialCountries),
  wars: [],
  territories: createInitialTerritories(initialCountries),
  domesticEvents: [],
  militaryUnits: initialMilitaryData.units,
  armies: initialMilitaryData.armies,
  commanders: initialMilitaryData.commanders,
  frontLines: [],
  supplyStates: {},
  manpowerPools: initialMilitaryData.manpowerPools,
  equipmentStocks: initialMilitaryData.equipmentStocks,
  unitTrainingQueue: [],
  selectedUnitId: null,
  airForces: initialAirData,
  fleets: initialFleetData,
  seaRegions: createSeaRegions(),
  airSuperiority: {},
  navalControl: {},
  blockades: {},
  amphibiousOperations: [],
  historicalEvents: [],
  nationalMemories: createMemoryState(initialCountries),
  scheduledEvents: [],
  eventQueue: [],
  eventHistory: [],
  diplomacy2: createDiplomacy2State(),
  nationalFocus: Object.fromEntries(initialCountries.map((country) => [country.id, { activeId: null, progress: 0, completed: [] }])),
  selectCountry: (id) => set({ selectedCountryId: id }),
  selectRegion: (id) => set({ selectedRegionId: id }),
  selectUnit: (id) => set({ selectedUnitId: id }),
  recruitUnit: (type) => set((state) => { const country = state.countries.find((item) => item.id === state.playerCountryId); const regionId = state.territories?.[state.playerCountryId]?.[0]?.id; if (!country || !regionId) return state; const result = createTraining(state.playerCountryId, type, regionId, state.manpowerPools ?? {}, state.equipmentStocks ?? {}); if (result.error) return { logs: [{ id: Date.now(), text: result.error, type: 'system' as const }, ...state.logs].slice(0, 8) }; return { manpowerPools: result.manpowerPools, equipmentStocks: result.stocks, unitTrainingQueue: [...(state.unitTrainingQueue ?? []), result.project!], logs: [{ id: Date.now(), text: `${type} 사단 편성 훈련을 시작했습니다.`, type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  setUnitOrder: (unitId, order, targetRegionId) => set((state) => ({ militaryUnits: (state.militaryUnits ?? []).map((unit) => unit.id === unitId ? setOrder(unit, order, targetRegionId) : unit), logs: [{ id: Date.now(), text: order === '공격' ? '부대에 공격 명령을 내렸습니다.' : order === '방어' ? '부대에 방어 명령을 내렸습니다.' : '부대 명령을 변경했습니다.', type: 'system' as const }, ...state.logs].slice(0, 8) })),
  setAirMission: (airId, mission) => set((state) => ({ airForces: (state.airForces ?? []).map((air) => air.id === airId ? { ...air, mission } : air) })),
  setFleetMission: (fleetId, mission) => set((state) => ({ fleets: (state.fleets ?? []).map((fleet) => fleet.id === fleetId ? { ...fleet, mission } : fleet) })),
  planAmphibious: () => set((state) => { const unit = (state.militaryUnits ?? []).find((item) => item.countryId === state.playerCountryId && item.type === '해병'); const target = state.selectedRegionId; const port = state.territories?.[state.playerCountryId]?.find((region) => region.buildings.some((building) => building.id === 'port')); if (!unit || !target || !port) return { logs: [{ id: Date.now(), text: '상륙작전에는 해병 사단, 목표 지역, 출발 항구가 필요합니다.', type: 'system' as const }, ...state.logs].slice(0, 8) }; return { amphibiousOperations: [...(state.amphibiousOperations ?? []), { id: `invasion-${Date.now()}`, countryId: state.playerCountryId, sourcePortRegionId: port.id, targetRegionId: target, unitIds: [unit.id], preparation: 0, status: '준비 중' as const }], logs: [{ id: Date.now(), text: '상륙작전 준비를 시작했습니다.', type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  startFocus: (focusId) => set((state) => { const country = state.countries.find((item) => item.id === state.playerCountryId); if (!country) return state; const result = startFocus(state.nationalFocus?.[country.id] ?? { activeId: null, progress: 0, completed: [] }, focusId, normalizePolitical(country)); if (result.error || !result.political) return { logs: [{ id: Date.now(), text: result.error ?? '국가 중점을 시작할 수 없습니다.', type: 'system' as const }, ...state.logs].slice(0, 8) }; return { countries: state.countries.map((item) => item.id === country.id ? { ...item, politicalState: result.political } : item), nationalFocus: { ...(state.nationalFocus ?? {}), [country.id]: result.current }, logs: [{ id: Date.now(), text: `${nationalFocuses.find((item) => item.id === focusId)?.name ?? '국가 중점'}을 시작했습니다.`, type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  startIntelligence: (targetId, type) => set((state) => { const country = state.countries.find((item) => item.id === state.playerCountryId); const target = state.countries.find((item) => item.id === targetId); if (!country || !target || country.id === target.id) return state; const updated = startIntelligenceOperation(country, target.id, type); return { countries: state.countries.map((item) => item.id === country.id ? updated : item), logs: [{ id: Date.now(), text: `${target.name} 대상 ${type} 작전을 시작했습니다.`, type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  resolveDynamicEvent: (eventId, optionId) => set((state) => { const event = (state.eventQueue ?? []).find((item) => item.id === eventId); const country = state.countries.find((item) => item.id === state.playerCountryId); if (!event || !country) return state; const option = event.options.find((item) => item.id === optionId); if (!option) return state; const updated = applyEventEffect(country, option.effects); const followUp = createFollowUp(event, optionId, state.turn); const history = recordEvent(state.eventHistory ?? [], event, country.id, option.label, state.turn); return { countries: state.countries.map((item) => item.id === country.id ? updated : item), eventQueue: [...(state.eventQueue ?? []).filter((item) => item.id !== eventId), ...(followUp ? [followUp] : [])].slice(-12), eventHistory: history, treasury: updated.treasury, logs: [{ id: Date.now(), text: `${event.title}: ${option.label}을 선택했습니다.`, type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  startNegotiation: (targetId, topic) => set((state) => { if (targetId === state.playerCountryId) return state; const next = startNegotiation(state.diplomacy2 ?? createDiplomacy2State(), state.playerCountryId, targetId, topic, state.turn, state.countries); return { diplomacy2: next, logs: [{ id: Date.now(), text: `${state.countries.find((country) => country.id === targetId)?.name ?? '상대국'}에 ${topic} 협상을 제안했습니다.`, type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  respondNegotiation: (negotiationId, response) => set((state) => { const result = resolveNegotiation(state.diplomacy2 ?? createDiplomacy2State(), negotiationId, response, state.turn, state.relations); return { diplomacy2: result.state, relations: result.relations, logs: [{ id: Date.now(), text: response === 'accept' ? '외교 협상이 타결되었습니다.' : response === 'counter' ? '상대국에 반대 제안을 보냈습니다.' : '외교 협상이 결렬되었습니다.', type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  constructBuilding: (buildingId) => set((state) => { const regions = state.territories[state.selectedCountryId] ?? []; const region = regions.find((item) => item.id === state.selectedRegionId); const definition = buildings.find((item) => item.id === buildingId); if (!region || !definition) return state; const error = canBuild(region, buildingId); if (error) return { logs: [{ id: Date.now(), text: error, type: 'system' as const }, ...state.logs].slice(0, 8) }; const country = state.countries.find((item) => item.id === state.selectedCountryId)!; if (country.treasury < definition.cost) return { logs: [{ id: Date.now(), text: '국고가 부족합니다.', type: 'system' as const }, ...state.logs].slice(0, 8) }; const updated = { ...country, treasury: country.treasury - definition.cost, constructionQueue: [...(country.constructionQueue ?? []), { id: `${country.id}-${region.id}-${buildingId}-${Date.now()}`, regionId: region.id, buildingId, monthsTotal: definition.months, monthsRemaining: definition.months, cost: definition.cost }] }; return { countries: state.countries.map((item) => item.id === country.id ? updated : item), treasury: country.id === state.playerCountryId ? updated.treasury : state.treasury, logs: [{ id: Date.now(), text: `${region.name}에 ${definition.name} 건설을 시작했습니다.`, type: 'system' as const }, ...state.logs].slice(0, 8) } }),
  diplomaticAction: (action, targetId) => set((state) => {
    if (targetId === state.playerCountryId) return state
    const result = executeDiplomaticAction(action, state.playerCountryId, targetId, state.countries, state.relations)
    const text = result.error ?? result.message
    const entry: GameLogEntry = { id: Date.now(), text, type: 'system' }
    if (result.error) return { logs: [entry, ...state.logs].slice(0, 8) }
    const actor = state.countries.find((country) => country.id === state.playerCountryId)!; const target = state.countries.find((country) => country.id === targetId)!; const memoryType = action === 'trade' ? '무역' : action === 'alliance' ? '동맹' : action === 'worsen' ? '외교적 모욕' : action === 'mission' ? '우호적 지원' : action === 'nonAggression' ? '평화' : '외교적 모욕'; const historical = recordHistoricalEvent(state.historicalEvents ?? [], `${state.year}년 ${state.turn}월`, '외교 사건', result.message, result.message, [actor.id, target.id], action === 'alliance' ? 55 : 35); return { countries: result.countries, relations: result.relations, nationalMemories: recordPair(state.nationalMemories ?? createMemoryState(state.countries), actor.id, target.id, memoryType, result.message, action === 'worsen' ? 12 : 6, historical.event.id), historicalEvents: historical.events, treasury: result.countries.find((country) => country.id === state.playerCountryId)?.treasury ?? state.treasury, logs: [entry, ...state.logs].slice(0, 8) }
  }),
  declareWar: (targetId) => set((state) => {
    const result = declareWar(state.playerCountryId, targetId, state.countries, state.wars ?? [], state.relations, state.territories ?? createInitialTerritories(state.countries), `${state.year}년 ${state.turn}월`)
    const entry: GameLogEntry = { id: Date.now(), text: result.error ?? result.message!, type: 'system' }
    const nextCountries = result.countries ?? state.countries
    if (result.error) return { logs: [entry, ...state.logs].slice(0, 8) }
    const historical = recordHistoricalEvent(state.historicalEvents ?? [], `${state.year}년 ${state.turn}월`, '전쟁', result.message!, result.message!, [state.playerCountryId, targetId], 85); const memories = recordPair(state.nationalMemories ?? createMemoryState(state.countries), state.playerCountryId, targetId, state.relations[relationKey(state.playerCountryId, targetId)]?.nonAggressionPact ? '협정 위반' : '침공', result.message!, 30, historical.event.id)
    return { countries: nextCountries, relations: result.relations, wars: [...(state.wars ?? []), result.war!], territories: result.territories, historicalEvents: historical.events, nationalMemories: memories, treasury: nextCountries.find((country) => country.id === state.playerCountryId)?.treasury ?? state.treasury, logs: [entry, ...state.logs].slice(0, 8) }
  }),
  makePeace: (warId) => set((state) => {
    const savedWars = state.wars ?? []
    const war = savedWars.find((item) => item.id === warId)
    if (!war) return state
    const result = makePeace(war, state.countries, state.territories ?? createInitialTerritories(state.countries))
    const entry: GameLogEntry = { id: Date.now(), text: result.message, type: 'system' }
    const winner = war.warScoreAttacker >= war.warScoreDefender ? war.attacker : war.defender; const memories = warMemory(state.nationalMemories ?? createMemoryState(state.countries), war, winner); const historical = recordHistoricalEvent(state.historicalEvents ?? [], `${state.year}년 ${state.turn}월`, '평화', result.message, result.message, [war.attacker, war.defender], 70); return { wars: savedWars.map((item) => item.id === warId ? result.wars : item), nationalMemories: memories, historicalEvents: historical.events, logs: [entry, ...state.logs].slice(0, 8) }
  }),
  changePolicy: (countryId, category, policy) => set((state) => {
    const target = state.countries.find((country) => country.id === countryId)
    if (!target) return state
    const result = applyPolicy({ ...target, politicalState: normalizePolitical(target) }, policy, category)
    const entry: GameLogEntry = { id: Date.now(), text: result.error ?? result.message!, type: 'system' }
    return result.error ? { logs: [entry, ...state.logs].slice(0, 8) } : { countries: state.countries.map((country) => country.id === countryId ? result.country : country), treasury: countryId === state.playerCountryId ? result.country.treasury : state.treasury, logs: [entry, ...state.logs].slice(0, 8) }
  }),
  resolveEvent: (eventId, choiceId) => set((state) => {
    const event = state.domesticEvents.find((item) => item.id === eventId)
    if (!event) return state
    const target = state.countries.find((country) => country.id === state.playerCountryId)!
    const result = resolveDomesticEvent(event, choiceId, target, normalizePolitical(target))
    const entry: GameLogEntry = { id: Date.now(), text: `${event.title}에 대응했습니다: ${event.choices.find((choice) => choice.id === choiceId)?.label ?? '선택'}`, type: 'system' }
    return { countries: state.countries.map((country) => country.id === target.id ? { ...result.country, politicalState: result.political } : country), treasury: result.country.treasury, domesticEvents: state.domesticEvents.filter((item) => item.id !== eventId), logs: [entry, ...state.logs].slice(0, 8) }
  }),
  startResearch: (countryId, techId) => set((state) => {
    const target = state.countries.find((country) => country.id === countryId)
    if (!target) return state
    const result = startResearch(target, techId)
    const entry: GameLogEntry = { id: Date.now(), text: result.error ?? `${target.name}에서 ${technologies.find((tech) => tech.id === techId)?.name ?? '기술'} 연구를 시작했습니다.`, type: 'system' }
    return result.error ? { logs: [entry, ...state.logs].slice(0, 8) } : { countries: state.countries.map((country) => country.id === countryId ? result.country : country), logs: [entry, ...state.logs].slice(0, 8) }
  }),
  cancelResearch: (countryId, techId) => set((state) => {
    const target = state.countries.find((country) => country.id === countryId)
    if (!target) return state
    const updated = cancelResearch(target, techId)
    const entry: GameLogEntry = { id: Date.now(), text: '연구를 취소했습니다. 진행도가 일부 감소했습니다.', type: 'system' }
    return { countries: state.countries.map((country) => country.id === countryId ? updated : country), logs: [entry, ...state.logs].slice(0, 8) }
  }),
  nextTurn: () => set((state) => {
    const time = advanceTime(state.year, state.turn)
    const world = state.countries?.length ? state.countries : initialCountries
    const safeWorld = world.map((country) => ({ ...country, militaryState: country.militaryState ?? initialCountries.find((item) => item.id === country.id)!.militaryState, politicalState: normalizePolitical(country), researchState: normalizeResearch(country), resourceStockpile: country.resourceStockpile ?? emptyResources(), resourceOutput: country.resourceOutput ?? emptyResources(), constructionQueue: country.constructionQueue ?? [] }))
    const safeWars = state.wars ?? []
    const result = updateWorldEconomy(safeWorld)
    const economicResult = result.countries.map((country) => updateEconomicSimulation(country, activeWarsFor(safeWars, country.id).length > 0))
    const economicCountries = economicResult.map((item) => updateEconomicDeep(item.country))
    const militaryResult = economicCountries.map((country) => updateMilitary({ ...country, militaryState: country.militaryState ?? initialCountries.find((item) => item.id === country.id)!.militaryState }, activeWarsFor(safeWars, country.id).length > 0).country)
    const updatedRelations = updateDiplomaticRelations(militaryResult, Object.keys(state.relations ?? {}).length ? state.relations : createInitialRelations(militaryResult))
    const diplomacyUpdate = updateDiplomacy(militaryResult, updatedRelations, safeWars)
    const aiResult = runDiplomacyAI(diplomacyUpdate.countries, diplomacyUpdate.relations, state.playerCountryId)
    const warResult = advanceWars(aiResult.countries, safeWars, state.territories ?? createInitialTerritories(aiResult.countries))
    const militaryAIResult = runMilitaryAI(warResult.countries, warResult.wars, aiResult.relations, warResult.territories, state.playerCountryId, `${time.year}년 ${time.turn}월`)
    let diplomacy2 = advanceDiplomacy2(state.diplomacy2 ?? createDiplomacy2State(), state.turn)
    let diplomacyRelations = militaryAIResult.relations
    diplomacy2.negotiations.filter((negotiation) => negotiation.status === '제안' && negotiation.targetId !== state.playerCountryId).forEach((negotiation) => {
      const opinion = diplomacyRelations[relationKey(negotiation.initiatorId, negotiation.targetId)]?.opinion ?? 0
      const response = opinion >= 45 ? 'accept' : opinion >= 15 ? 'counter' : 'reject'
      const resolved = resolveNegotiation(diplomacy2, negotiation.id, response, state.turn, diplomacyRelations)
      diplomacy2 = resolved.state
      diplomacyRelations = resolved.relations
    })
    const currentTerritories = Object.fromEntries(Object.entries(state.territories ?? createInitialTerritories(militaryAIResult.countries)).map(([id, regions]) => [id, regions.map(normalizeRegion)]))
    const regionResults = militaryAIResult.countries.map((country) => { const regions = currentTerritories[country.id] ?? []; const resources = updateResources(country, regions); return advanceConstruction(resources.country, regions) })
    const regionAI = runRegionDevelopmentAI(regionResults.map((item) => item.country), Object.fromEntries(regionResults.map((item) => [item.country.id, item.regions])), state.playerCountryId)
    const researchResult = regionAI.countries.map((country) => advanceResearch({ ...country, researchState: normalizeResearch(country) }))
    const researchAIResult = runResearchAI(researchResult.map((item) => item.country), state.playerCountryId)
    const technologyCountries = researchAIResult.countries.map((country) => updateInnovation(updateTechnology(country), state.turn))
    const nationalCountries = technologyCountries.map((country) => updateNationalProfile(country, state.turn))
    const focusResults = nationalCountries.map((country) => advanceFocus(country, normalizePolitical(country), state.nationalFocus?.[country.id] ?? { activeId: null, progress: 0, completed: [] }))
    const safeUnits = state.militaryUnits ?? initialMilitaryData.units
    const fronts = createFrontLines(militaryAIResult.wars, militaryAIResult.territories, safeUnits)
    const allRegions = Object.values(militaryAIResult.territories).flat()
    const airResult = updateAirForces(state.airForces ?? initialAirData, allRegions, militaryAIResult.wars)
    const navyResult = updateNavies(state.fleets ?? initialFleetData, state.seaRegions ?? createSeaRegions(), militaryAIResult.wars, researchAIResult.countries)
    const amphibiousResult = advanceAmphibious(state.amphibiousOperations ?? [], navyResult.fleets, safeUnits, allRegions)
    const militaryTurn = advanceMilitaryTurn(safeUnits, state.unitTrainingQueue ?? [], militaryAIResult.wars, militaryAIResult.territories, state.manpowerPools ?? initialMilitaryData.manpowerPools, fronts)
    const fadedMemories = decayMemories(state.nationalMemories ?? createMemoryState(militaryAIResult.countries)); const nextMemories = updateThreats(fadedMemories, militaryAIResult.countries)
    const politicalResult = focusResults.map((item) => { const navalCountry = navyResult.countries.find((country) => country.id === item.country.id) ?? item.country; return updatePolitics({ ...navalCountry, politicalState: item.political }, item.political, militaryAIResult.wars) })
    const socialResult = politicalResult.map((item) => updateSociety(item.country, militaryAIResult.wars, nextMemories))
    const politicalSystemResult = socialResult.map((item) => { const updated = updatePoliticalSystem(item.country, normalizePoliticalSystem(item.country, state.turn), item.social.socialUnrest, militaryAIResult.wars, state.turn); return { ...item, country: { ...item.country, politicalSystem: updated.system }, politicalSystem: updated } })
    const domesticPoliticsResult = politicalSystemResult.map((item) => { const updated = updateDomesticPolitics(item.country, militaryAIResult.wars); return { ...item, country: updated.country, domesticPolitics: updated } })
    const intelligenceResult = updateIntelligence(domesticPoliticsResult.map((item) => item.country), state.turn)
    const domesticPolitics2Result = intelligenceResult.countries.map((country) => updateDomesticPolitics2(country, militaryAIResult.wars, state.turn))
    const integrated = integrateWorldState({ currentDate: `${time.year}년 ${time.turn}월`, countries: domesticPolitics2Result.map((item) => item.country), wars: militaryAIResult.wars, relations: diplomacyRelations, worldState: state.worldIntegration })
    const adaptive = runAdaptiveAI(integrated.countries, diplomacyRelations, militaryAIResult.wars, state.playerCountryId, state.turn)
    const integratedCountries = adaptive.countries
    const player = integratedCountries.find((country) => country.id === state.playerCountryId) ?? integratedCountries[0]
    const generatedEvent = generateDynamicEvent(player, state.turn, state.eventQueue ?? [])
    const nextEventQueue = [...(state.eventQueue ?? []), ...(generatedEvent ? [generatedEvent] : [])].filter((item, index, queue) => queue.findIndex((candidate) => candidate.id === item.id) === index).slice(-12)
    const change = result.changes[player.id]
    const monthLog: GameLogEntry = { id: Date.now(), text: `${time.year}년 ${time.turn}월 — ${player.name}의 GDP가 ${change.gdpPercent >= 0 ? '증가' : '감소'}했습니다 (${Math.abs(change.gdpPercent).toFixed(2)}%).`, type: 'turn' }
    const annualLog: GameLogEntry | null = time.turn === 1 ? { id: Date.now() + 1, text: `${time.year}년 — 연간 인구 및 경제 전망이 새롭게 계산되었습니다.`, type: 'system' } : null
    const event = generateDomesticEvent(player, player.politicalState)
    const completedLogs = researchResult.flatMap((item) => item.completed.map((id) => `${item.country.name}의 ${technologies.find((tech) => tech.id === id)?.name ?? '기술'} 연구가 완료되었습니다.`)).slice(0, 3)
    const constructionLogs = regionResults.flatMap((item) => item.completed).slice(0, 3)
    const focusLogs = focusResults.flatMap((item) => item.completed ? [`${item.country.name}의 국가 중점 '${item.completed.name}'이(가) 완료되었습니다.`] : [])
    const socialLogs = [...socialResult.flatMap((item) => item.socialEvent && item.country.id === state.playerCountryId ? [item.socialEvent] : []), ...politicalSystemResult.flatMap((item) => item.politicalSystem.electionHeld ? [`${item.country.name}에서 선거가 실시되었습니다.`] : item.politicalSystem.system.crisis.active && item.country.id === state.playerCountryId ? ['정치 위기 위험도가 높아졌습니다.'] : []), ...domesticPoliticsResult.flatMap((item) => item.domesticPolitics.event && item.country.id === state.playerCountryId ? [item.domesticPolitics.event] : []), ...domesticPolitics2Result.flatMap((item) => item.news && item.country.id === state.playerCountryId ? [item.news] : []), ...intelligenceResult.messages.filter((message) => message.startsWith(player.name))]
    const eventTexts = [...constructionLogs, ...regionAI.messages, ...completedLogs, ...focusLogs, ...socialLogs, ...researchAIResult.messages, ...adaptive.messages, ...warResult.messages, ...militaryAIResult.messages, ...militaryTurn.messages, ...(airResult.activeCountries.size > 0 ? ['공군이 작전 지역의 제공권을 갱신했습니다.'] : []), ...amphibiousResult.messages, ...aiResult.messages, ...(event ? [`국내 사건 발생: ${event.title}`] : [])].slice(0, 5)
    const eventLogs = eventTexts.map((text, index): GameLogEntry => ({ id: Date.now() + index + 2, text, type: 'system' }))
    const nextTerritories = { ...militaryAIResult.territories, ...Object.fromEntries(regionResults.map((item) => [item.country.id, item.regions])) }
    const historicalEvents = state.historicalEvents ?? []; return { ...time, countries: integratedCountries, worldIntegration: integrated.worldState, balanceReport: createBalanceReport(integratedCountries, `${time.year}년 ${time.turn}월`), relations: adaptive.relations, wars: militaryAIResult.wars, territories: nextTerritories, treasury: player.treasury, domesticEvents: event ? [event, ...(state.domesticEvents ?? [])].slice(0, 2) : state.domesticEvents ?? [], eventQueue: nextEventQueue, diplomacy2, lastChanges: result.changes, militaryUnits: militaryTurn.units, unitTrainingQueue: militaryTurn.trainingQueue, supplyStates: militaryTurn.supplyStates, frontLines: createFrontLines(militaryAIResult.wars, nextTerritories, militaryTurn.units), manpowerPools: militaryTurn.manpowerPools, airForces: airResult.airForces, fleets: navyResult.fleets, seaRegions: state.seaRegions ?? createSeaRegions(), airSuperiority: airResult.airSuperiority, navalControl: navyResult.navalControl, blockades: navyResult.blockades, amphibiousOperations: amphibiousResult.operations, nationalFocus: Object.fromEntries(domesticPoliticsResult.map((item) => [item.country.id, focusResults.find((focus) => focus.country.id === item.country.id)?.focus ?? { activeId: null, progress: 0, completed: [] }])), nationalMemories: nextMemories, historicalEvents, logs: [monthLog, ...eventLogs, ...(annualLog ? [annualLog] : []), ...state.logs].slice(0, 8) }
  }),
}), { name: 'world-order-save' }))
