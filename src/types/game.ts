export interface Country {
  id: string
  name: string
  population: number
  economy: number
  gdp: number
  gdpGrowth: number
  gdpPerCapita: number
  treasury: number
  industry: number
  unemployment: number
  inflation: number
  resourceProduction: number
  military: number
  militaryState: MilitaryState
  politicalState: PoliticalState
  researchState: ResearchState
  resourceStockpile: ResourceStockpile
  resourceOutput: ResourceProduction
  constructionQueue: ConstructionProject[]
  technology: number
  stability: number
  government: string
  mapPath: string
  mapLabel: { x: number; y: number }
  color: string
  socialState?: SocialState
  politicalSystem?: PoliticalSystemState
  economicState?: EconomicState
  diplomaticState?: DiplomaticState
  domesticPolitics?: DomesticPoliticsState
  intelligenceState?: IntelligenceState
  technologyState?: TechnologyState
  innovationState?: InnovationState
  nationalProfile?: NationalProfile
  domesticPolitics2?: DomesticPolitics2State
  economicDeepState?: EconomicDeepState
  integrationState?: IntegrationState
  aiState?: AIState
}

export type IntelligenceOperationType = '정보 수집' | '군사 정찰' | '경제 분석' | '정치 분석' | '외교 분석' | '기술 분석' | '방첩' | '정보 검증'
export interface IntelligenceOperation { id: string; type: IntelligenceOperationType; targetCountryId: string; progress: number; duration: number; risk: number; status: '진행 중' | '완료' | '실패' }
export interface IntelligenceReport { id: string; targetCountryId: string; category: string; confidence: number; age: number; estimate: string; actualValue?: number; source: string; assessment: string }
export interface ObservedState { militaryPower?: { min: number; max: number }; gdp?: { min: number; max: number }; stability?: { min: number; max: number }; production?: { min: number; max: number }; confidence: number; lastUpdatedTurn: number }
export interface IntelligenceState { agencyLevel: number; networkLevel: number; collection: number; analysis: number; counterIntelligence: number; budget: number; personnel: number; experience: number; reliability: number; informationSecurity: number; informationWarfare: number; priority: IntelligenceOperationType; operations: IntelligenceOperation[]; reports: IntelligenceReport[]; observations: Record<string, ObservedState> }
export interface TechnologyState { overallLevel: number; researchBudget: number; researchCapacity: number; technologyInfrastructure: number; utilization: number; technologyGap: number; nationalCapability: number; specialization: Record<string, number>; commercialization: Record<string, number>; technologyDependency: number; technologySelfSufficiency: number; brainGain: number; brainDrain: number; obsolescence: number; lastBreakthrough?: string }
export interface ResearchInstitution { id: string; name: string; type: '대학' | '국립연구소' | '기업연구소' | '군사연구소'; capacity: number; researchers: number; budget: number; specialties: string[]; efficiency: number }
export interface ResearchProject { id: string; technologyId: string; name: string; kind: '기초연구' | '응용연구' | '군사연구'; progress: number; funding: number; duration: number; successChance: number; institutionId: string; stage: '연구' | '발견' | '프로토타입' | '상용화' | '확산'; experience: number }
export interface PatentRecord { id: string; technologyId: string; ownerId: string; holder: string; licenseFee: number; expiresInMonths: number; protected: boolean }
export interface InnovationState { institutions: ResearchInstitution[]; researchers: number; publicResearchBudget: number; privateResearchBudget: number; researchEfficiency: number; projects: ResearchProject[]; patents: PatentRecord[]; diffusion: Record<string, number>; innovationCapacity: number; nationalTechPower: number; automationLevel: number; technologySecurity: number; regulation: number; dualUseTechnologies: string[]; technologyStrategy: string; bubbleRisk: number; history: string[] }
export interface IntegrationState { nationalStability: number; nationalCapacity: number; nationalInfluence: number; powerIndex: number; riskFactors: string[]; opportunityFactors: string[]; summary: { economy: string; politics: string; society: string; military: string; diplomacy: string; technology: string }; causes: string[]; history: string[] }
export interface WorldIntegrationState { currentDate: string; worldGdp: number; worldPopulation: number; worldTrade: number; worldTension: number; activeWars: number; rankings: { economic: string[]; military: string[]; technology: string[]; power: string[] }; reports: string[]; history: string[] }
export interface BalanceReport { currentDate: string; averageGdp: number; maxGdp: number; averagePopulation: number; averageMilitary: number; averageTechnology: number; averageInflation: number; averageUnemployment: number; warnings: string[] }
export type AIAction = '경제 투자' | '산업 투자' | 'R&D 투자' | '군사 투자' | '외교 개선' | '무역 확대' | '동맹 강화' | '기술 협력' | '내부 안정' | '교육 투자' | '인프라 투자'
export type AILongTermGoal = '경제대국' | '군사강국' | '기술패권' | '지역패권' | '외교강국' | '내부안정'
export interface AIPersonality { 공격성: number; 방어성: number; 경제중시: number; 기술중시: number; 외교중시: number; 고립주의: number; 팽창주의: number; 안정중시: number; 실용주의: number }
export interface AIActionHistory { turn: number; action: AIAction; score: number; cost: number; reason: string; outcome: string }
export interface AIState { personality: AIPersonality; longTermGoal: AILongTermGoal; currentStrategy: string; priorities: Record<string, number>; threatScores: Record<string, number>; opportunityScores: Record<string, number>; trustScores: Record<string, number>; actionHistory: AIActionHistory[]; lastDecision?: { action: AIAction; reason: string; turn: number }; difficulty: '쉬움' | '보통' | '어려움'; evaluationCooldown: number }
export type NationalStrategy = '산업화' | '기술혁신' | '군사강화' | '경제개방' | '자원개발' | '복지확대' | '내수중심' | '수출중심' | '외교확대'
export type DevelopmentStage = '저개발' | '개발도상' | '산업화' | '선진산업' | '기술선도'
export interface NationalProfile { identity: Record<string, number>; traits: string[]; weaknesses: string[]; archetype: string; strategy: NationalStrategy; politicalCulture: '경쟁적' | '합의 중심' | '권위적' | '분권적' | '중앙집권적'; economicCulture: '시장 중심' | '국가 주도' | '혼합 경제' | '무역 중심' | '내수 중심'; diplomaticCulture: '고립주의' | '중립주의' | '다자주의' | '적극적 외교' | '지역 패권'; developmentStage: DevelopmentStage; resilience: number; prestige: number; influence: number; softPower: number; image: string; regionalInfluence: Record<string, number>; projects: { id: string; name: string; progress: number; months: number; regionId?: string }[]; strategyChangedAt: number }
export interface MediaOutlet { id: string; name: string; orientation: '진보' | '보수' | '중도' | '지역' | '경제'; trust: number; influence: number; audience: string }
export interface LobbyGroup { id: string; name: string; influence: number; transparency: number; preference: string }
export interface DomesticPolitics2State { inequalityIndex: number; wealthConcentration: number; socialMobility: number; civicParticipation: number; generationConflict: number; regionalConflict: number; ideologicalConflict: number; policyOpinion: Record<string, number>; polling: Record<string, number>; media: MediaOutlet[]; lobbying: LobbyGroup[]; socialConflicts: { id: string; name: string; intensity: number; sides: string[] }[]; politicalCapital: number; legitimacy: number; policyFatigue: number; news: string[]; socialAgreements: { id: string; groups: string[]; expiresTurn: number }[] }
export interface CompanyGroup { id: string; name: string; industryId: string; scale: '소기업' | '중견기업' | '대기업'; employees: number; capital: number; revenue: number; expenses: number; profit: number; productivity: number; technologyLevel: number; marketShare: number; investment: number; debt: number; confidence: number; bankruptcyRisk: number }
export interface SupplyChainLink { id: string; input: string; output: string; dependency: number; inventory: number; disruption: number; diversified: number }
export interface HouseholdState { income: number; consumption: number; savings: number; debt: number; assets: number; propensityToConsume: number; consumerConfidence: number; debtBurden: number }
export interface FinancialState { policyRate: number; lendingRate: number; liquidity: number; creditRisk: number; marketConfidence: number; riskPremium: number; corporateDebt: number; householdDebt: number; capitalFlow: number; countryRisk: number }
export interface EconomicDeepState { companies: CompanyGroup[]; supplyChains: SupplyChainLink[]; household: HouseholdState; financial: FinancialState; leadingIndicators: Record<string, number>; laggingIndicators: Record<string, number>; economicObjective: '성장 우선' | '물가 안정' | '고용 우선' | '재정 안정'; shocks: { id: string; type: '수요' | '공급' | '금융' | '외부'; strength: number; monthsRemaining: number }[]; industryShares: Record<string, number>; history: string[] }

export type EconomicCycleState = '호황' | '확장' | '안정' | '둔화' | '침체' | '불황'
export interface EconomicState { employment: number; wages: number; realWage: number; householdIncome: number; householdConsumption: number; privateInvestment: number; governmentSpending: number; exports: number; imports: number; tradeBalance: number; nationalDebt: number; taxRevenue: number; businessProfit: number; consumerConfidence: number; businessConfidence: number; interestRate: number; exchangeRate: number; foreignInvestment: number; standardOfLiving: number; economicResilience: number; economicCycle: EconomicCycleState; production: number; marketPrices: Record<string, number>; industries: Record<string, number> }

export type PopulationGroupType = '노동자' | '농민' | '중산층' | '기업가' | '전문직' | '관료' | '군인'
export interface PopulationGroup { id: string; name: PopulationGroupType; populationShare: number; wealth: number; education: number; satisfaction: number; needs: string[] }
export interface SocialValues { individualism: number; collectivism: number; traditionalism: number; progressivism: number; militarism: number; pacifism: number; nationalism: number; internationalism: number; openness: number; isolationism: number; economicLiberalism: number; economicControl: number }
export interface PublicOpinion { warSupport: number; peaceSupport: number; freeTradeSupport: number; protectionismSupport: number; militarySpendingSupport: number; welfareSupport: number; technologySupport: number }
export interface NationalIdentity { unity: number; patriotism: number; culturalCohesion: number; institutionalTrust: number; historicalIdentity: number }
export interface SocialState { populationGroups: PopulationGroup[]; socialValues: SocialValues; publicOpinion: PublicOpinion; nationalIdentity: NationalIdentity; socialUnrest: number; inequality: number; urbanization: number; education: number; industrialization: number; governmentLegitimacy: number; governmentTrust: number; cultureExchange: number; regionalOpinion: Record<string, number>; generationValues: { young: number; adult: number; middle: number; elder: number } }
export interface PoliticalFactionSystem { id: string; name: string; support: number; ideology: Record<string, number>; influence: number; organization: number; leadership: number; popularity: number; regionalSupport: Record<string, number>; leader: { id: string; name: string; popularity: number; competence: number; charisma: number; integrity: number } }
export interface ParliamentState { seats: Record<string, number>; totalSeats: number; majority: boolean; deadlock: number }
export interface GovernmentState { leaderId: string; rulingFactionId: string; coalitionFactionIds: string[]; legitimacy: number; trust: number; stability: number; termStart: string; termEnd?: string; coalitionTension: number }
export interface ElectionState { id: string; date: string; cycleMonths: number; turnout: number; nextTurn: number; results: Record<string, number>; completed: boolean; electoralSystem: '비례대표' | '지역구' | '혼합형' }
export interface PoliticalCrisisState { active: boolean; type?: '정부 붕괴' | '의회 교착' | '연립정부 붕괴' | '헌정 위기'; risk: number; startedAt?: string }
export interface PoliticalSystemState { factions: PoliticalFactionSystem[]; parliament: ParliamentState; government: GovernmentState; election: ElectionState; politicalCapital: number; politicalPolarization: number; militaryInfluence: number; civilMilitaryRelation: number; emergencyPower: number; crisis: PoliticalCrisisState; history: string[] }

export type GovernmentType = '민주주의' | '권위주의' | '군사정권' | '사회주의' | '왕정'
export type PolicyId = 'market' | 'industry' | 'austerity' | 'welfareUp' | 'welfareDown' | 'defense' | 'disarmament' | 'freedom' | 'control'

export type ResearchCategory = '산업' | '경제' | '군사' | '과학' | '사회' | '외교'
export interface ResearchState {
  researchPoints: number
  researchSpeed: number
  activeResearch: string[]
  progress: Record<string, number>
  completedTechnologies: string[]
  researchSlots: number
}

export interface PoliticalState {
  governmentType: GovernmentType
  politicalStability: number
  publicApproval: number
  freedom: number
  nationalism: number
  militarism: number
  pacifism: number
  liberalism: number
  authoritarianism: number
  economicLeft: number
  economicRight: number
  currentPolicies: Record<string, PolicyId>
  policyCooldown: number
  politicalPower?: number
  warExhaustion?: number
  politicalConflict?: number
  factions?: PoliticalFaction[]
  rulingFactionId?: string
  leader?: PoliticalLeader
}

export interface PoliticalFaction { id: string; name: string; support: number }
export interface PoliticalLeader { name: string; ideology: string; popularity: number; trait: string }
export interface NationalFocusState { activeId: string | null; progress: number; completed: string[] }
export type HistoricalEventType = '전쟁' | '평화' | '영토 변화' | '동맹' | '배신' | '무역' | '경제 위기' | '정치 변화' | '혁명' | '정부 변화' | '대규모 재해' | '기술 발전' | '외교 사건'
export type MemoryType = '우호적 지원' | '경제 지원' | '무역' | '동맹' | '배신' | '침공' | '영토 점령' | '전쟁' | '평화' | '원조' | '제재' | '외교적 모욕' | '협정 위반'
export interface HistoricalEvent { id: string; date: string; type: HistoricalEventType; title: string; description: string; countries: string[]; regions?: string[]; importance: number; tags: string[]; causeEventId?: string }
export interface MemoryRecord { id: string; date: string; type: MemoryType; strength: number; description: string; sourceEventId?: string; decayRate: number }
export interface NationalMemory { id: string; ownerCountryId: string; targetCountryId: string; memories: MemoryRecord[]; sentiment: number; trust: number; fear: number; respect: number; grudge: number; threat: number }
export interface RelationshipMemoryState { records: Record<string, NationalMemory>; lastDecayTurn: number }
export interface ScheduledEvent { id: string; eventId: string; countryId: string; dueTurn: number; sourceEventId?: string }

export interface DomesticEvent {
  id: string
  title: string
  description: string
  choices: { id: string; label: string }[]
  category?: '정치' | '경제' | '군사' | '외교' | '사회' | '자연재해' | '과학' | '산업'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
}

export interface EventEffect { treasury?: number; stability?: number; approval?: number; gdpGrowth?: number; unemployment?: number; inflation?: number; socialUnrest?: number; researchPoints?: number; reputation?: number }
export interface DynamicEventOption { id: string; label: string; description: string; requirement?: string; effects: EventEffect; followUp?: { id: string; delay: number; title: string; description: string; category: string } }
export interface DynamicEvent { id: string; title: string; description: string; category: string; importance: 1 | 2 | 3 | 4 | 5; cause: string[]; options: DynamicEventOption[]; availableTurn: number; cooldown: number; chainDepth: number; scope: '국가' | '국제' | '세계' }
export interface EventHistoryRecord { id: string; turn: number; countryId: string; title: string; category: string; cause: string[]; result: string; importance: number }

export interface MilitaryState {
  manpower: number
  army: number
  navy: number
  airForce: number
  militaryIndustry: number
  equipment: number
  organization: number
  morale: number
}

export interface RegionState {
  id: string
  name: string
  capital: boolean
  originalOwner: string
  ownerCountryId: string
  population: number
  development: number
  infrastructure: number
  industrialCapacity: number
  civilianFactories: number
  militaryFactories: number
  researchFacilities: number
  resourceProduction: ResourceProduction
  buildings: BuildingState[]
  isBorderRegion: boolean
  infrastructureDamage: number
}

export interface ResourceProduction { oil: number; iron: number; coal: number; aluminum: number; rareMaterials: number; uranium: number }
export interface ResourceStockpile extends ResourceProduction {}
export type BuildingId = 'civilian_factory' | 'military_factory' | 'research_lab' | 'university' | 'mine' | 'oil_refinery' | 'port' | 'airport' | 'railway' | 'fort'
export interface BuildingState { id: BuildingId; level: number }
export interface ConstructionProject { id: string; regionId: string; buildingId: BuildingId; monthsTotal: number; monthsRemaining: number; cost: number }

export type UnitType = '보병' | '기계화' | '전차' | '산악' | '공수' | '해병'
export type UnitStatus = '대기' | '이동 중' | '공격' | '방어' | '훈련' | '후퇴'
export type UnitOrder = '대기' | '이동' | '공격' | '방어'
export interface EquipmentStock { rifles: number; support: number; artillery: number; vehicles: number; tanks: number; transport: number; airSupport: number }
export interface DivisionTemplate { infantry: number; mechanized: number; tanks: number; artillery: number }
export interface MilitaryUnit {
  id: string; countryId: string; name: string; type: UnitType; manpower: number; maxManpower: number
  organization: number; maxOrganization: number; morale: number; training: number; experience: number
  equipment: EquipmentStock; combatPower: number; defensePower: number; speed: number; supplyUsage: number
  equipmentRatio: number; regionId: string; commanderId?: string; armyId?: string; status: UnitStatus
  order: UnitOrder; targetRegionId?: string
}
export interface Army { id: string; countryId: string; name: string; unitIds: string[]; commanderId?: string }
export interface Commander { id: string; countryId: string; name: string; attack: number; defense: number; planning: number; logistics: number; command: number; trait: string }
export interface UnitTrainingProject { id: string; countryId: string; name: string; type: UnitType; regionId: string; monthsTotal: number; monthsRemaining: number }
export interface FrontLine { id: string; warId: string; attackerCountryId: string; defenderCountryId: string; regionIds: string[]; attackerUnits: string[]; defenderUnits: string[]; status: 'active' | 'broken' | 'inactive' }
export interface SupplyState { unitId: string; ratio: number; supplyUsage: number; supplyReceived: number; status: '정상 보급' | '부족' | '심각한 부족' }

export type AircraftType = '전투기' | '근접항공지원기' | '폭격기' | '해상초계기' | '수송기'
export type AirMission = '제공권 확보' | '지상군 지원' | '전략 폭격' | '해상 공격' | '정찰' | '대기'
export interface AircraftStock { fighters: number; cas: number; bombers: number; maritimePatrol: number; transports: number }
export interface AirForce { id: string; countryId: string; name: string; aircraft: AircraftStock; baseRegionId: string; operationRegionIds: string[]; commanderId?: string; mission: AirMission; readiness: number; training: number; experience: number; fuel: number }
export type NavalMission = '해상권 확보' | '호송' | '해상 봉쇄' | '잠수함 작전' | '상륙 지원' | '정찰' | '대기'
export interface ShipStock { carriers: number; battleships: number; cruisers: number; destroyers: number; submarines: number; transports: number }
export interface Fleet { id: string; countryId: string; name: string; ships: ShipStock; homePortRegionId: string; operationSeaIds: string[]; mission: NavalMission; readiness: number; training: number; experience: number; fuel: number }
export interface SeaRegion { id: string; name: string; coastalRegionIds: string[]; navalControl: Record<string, number> }
export interface AmphibiousOperation { id: string; countryId: string; sourcePortRegionId: string; targetRegionId: string; unitIds: string[]; preparation: number; status: '준비 중' | '상륙 중' | '교두보 확보' | '실패' }

export interface WarState {
  id: string
  attacker: string
  defender: string
  startDate: string
  warScoreAttacker: number
  warScoreDefender: number
  active: boolean
  months: number
}

export interface GameLogEntry {
  id: number
  text: string
  type: 'system' | 'turn'
}

export interface DiplomaticRelation {
  countryA: string
  countryB: string
  opinion: number
  tradeAgreement: boolean
  nonAggressionPact: boolean
  alliance: boolean
  diplomaticMission: boolean
  tension: number
  trust?: number
  threat?: number
  diplomaticInfluence?: number
  economicDependence?: number
  militaryDependence?: number
  ideologicalCompatibility?: number
  historicalTension?: number
  borderTension?: number
  strategicValue?: number
  internationalReputation?: number
  relationshipType?: '적대' | '긴장' | '냉각' | '중립' | '우호' | '협력' | '동맹' | '종속' | '전략적 동반자'
  lastReasons?: string[]
}

export interface DiplomaticState {
  diplomaticPower: number
  foreignPolicy: '고립' | '균형' | '동맹 중심' | '무역 중심' | '군사 확장' | '패권 추구'
  internationalReputation: number
  worldTension: number
  regionalTension: Record<string, number>
  influence: Record<string, number>
  activeTreaties: { id: string; type: '무역' | '불가침' | '방위' | '군사' | '경제'; members: string[]; expiresTurn?: number }[]
}

export interface DomesticConflict { id: string; name: string; intensity: number; sides: string[]; cause: string }
export interface DomesticPoliticsState {
  governmentApproval: number
  leaderApproval: number
  politicalStability: number
  polarization: number
  corruption: number
  incomeInequality: number
  wealthConcentration: number
  socialMobility: number
  radicalization: number
  protestRisk: number
  strikeRisk: number
  conflicts: DomesticConflict[]
  activeProtest?: string
  activeStrike?: string
  politicalMemory: string[]
}

export interface AIProfile {
  aggressiveness: number
  diplomacy: number
  economicFocus: number
  alliancePreference: number
}

export interface GameState {
  year: number
  turn: number
  treasury: number
  playerCountryId: string
  selectedCountryId: string
  selectedRegionId: string | null
  logs: GameLogEntry[]
  countries: Country[]
  lastChanges: Record<string, { gdpDelta: number; gdpPercent: number; treasuryDelta: number }>
  relations: Record<string, DiplomaticRelation>
  diplomaticState?: DiplomaticState
  wars: WarState[]
  territories: Record<string, RegionState[]>
  domesticEvents: DomesticEvent[]
  militaryUnits: MilitaryUnit[]
  armies: Army[]
  commanders: Commander[]
  frontLines: FrontLine[]
  supplyStates: Record<string, SupplyState>
  manpowerPools: Record<string, number>
  equipmentStocks: Record<string, EquipmentStock>
  unitTrainingQueue: UnitTrainingProject[]
  selectedUnitId: string | null
  airForces: AirForce[]
  fleets: Fleet[]
  seaRegions: SeaRegion[]
  airSuperiority: Record<string, Record<string, number>>
  navalControl: Record<string, Record<string, number>>
  blockades: Record<string, number>
  amphibiousOperations: AmphibiousOperation[]
  nationalFocus: Record<string, NationalFocusState>
  historicalEvents: HistoricalEvent[]
  nationalMemories: Record<string, NationalMemory>
  scheduledEvents: ScheduledEvent[]
  eventQueue: DynamicEvent[]
  eventHistory: EventHistoryRecord[]
  diplomacy2: Diplomacy2State
  worldIntegration?: WorldIntegrationState
  balanceReport?: BalanceReport
  saveVersion?: number
  randomSeed?: number
}

export type NegotiationTopic = '무역' | '투자' | '기술' | '공동연구' | '안보' | '문화교류' | '중재'
export interface DiplomaticPromise { id: string; fromCountryId: string; toCountryId: string; text: string; expiresTurn: number; fulfilled: boolean }
export interface DiplomaticNegotiation { id: string; initiatorId: string; targetId: string; topic: NegotiationTopic; status: '제안' | '검토 중' | '반대 제안' | '합의' | '결렬'; round: number; expiresTurn: number; offer: string; counterOffer?: string }
export interface DiplomaticAgreement { id: string; type: NegotiationTopic; members: string[]; startTurn: number; endTurn?: number; terms: string[]; active: boolean }
export interface DiplomaticBloc { id: string; name: string; type: '경제' | '기술' | '안보' | '정치' | '지역'; leaderId: string; members: string[]; influence: Record<string, number> }
export interface Diplomacy2State { negotiations: DiplomaticNegotiation[]; agreements: DiplomaticAgreement[]; promises: DiplomaticPromise[]; blocs: DiplomaticBloc[]; history: string[] }
