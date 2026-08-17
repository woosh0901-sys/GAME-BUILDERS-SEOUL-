import type { Country, DomesticPolitics2State, WarState } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const createMedia = (country: Country) => [{ id: `${country.id}-public`, name: '공공 언론', orientation: '중도' as const, trust: 62, influence: 55, audience: '전국' }, { id: `${country.id}-economic`, name: '경제 통신', orientation: '경제' as const, trust: 58, influence: 35, audience: '기업·전문직' }]

export function createDomesticPolitics2(country: Country): DomesticPolitics2State { return { inequalityIndex: country.socialState?.inequality ?? 35, wealthConcentration: country.domesticPolitics?.wealthConcentration ?? 35, socialMobility: country.domesticPolitics?.socialMobility ?? 55, civicParticipation: country.socialState?.education ?? 50, generationConflict: 25, regionalConflict: 25, ideologicalConflict: country.politicalSystem?.politicalPolarization ?? 30, policyOpinion: { 복지확대: country.socialState?.publicOpinion.welfareSupport ?? 60, 군비확대: country.socialState?.publicOpinion.militarySpendingSupport ?? 50, 자유무역: country.socialState?.publicOpinion.freeTradeSupport ?? 55, 교육투자: country.socialState?.publicOpinion.technologySupport ?? 60 }, polling: { 정부지지율: country.politicalState?.publicApproval ?? 55, 지도자지지도: country.politicalState?.leader?.popularity ?? 55 }, media: createMedia(country), lobbying: [{ id: 'labor', name: '노동계', influence: 45, transparency: 65, preference: '임금·복지 확대' }, { id: 'industry', name: '산업계', influence: 48, transparency: 55, preference: '투자·규제 완화' }, { id: 'regional', name: '지역세력', influence: 30, transparency: 70, preference: '지역 투자' }], socialConflicts: [], politicalCapital: country.politicalSystem?.politicalCapital ?? 55, legitimacy: country.socialState?.governmentLegitimacy ?? country.stability, policyFatigue: 10, news: [], socialAgreements: [] } }
export function normalizeDomesticPolitics2(country: Country) { return country.domesticPolitics2 ?? createDomesticPolitics2(country) }

export function updateDomesticPolitics2(country: Country, wars: WarState[], turn: number): { country: Country; politics: DomesticPolitics2State; news?: string } {
  const previous = normalizeDomesticPolitics2(country)
  const groups = country.socialState?.populationGroups ?? []
  const average = groups.length ? groups.reduce((sum, group) => sum + group.satisfaction * group.populationShare, 0) / 100 : 55
  const workers = groups.find((group) => group.name === '노동자')?.satisfaction ?? 55
  const entrepreneurs = groups.find((group) => group.name === '기업가')?.satisfaction ?? 60
  const atWar = wars.some((war) => war.active && (war.attacker === country.id || war.defender === country.id))
  const inequalityIndex = clamp((country.economicState?.standardOfLiving ? 45 + Math.max(0, 65 - country.economicState.standardOfLiving) * 0.45 : previous.inequalityIndex) + (country.gdpGrowth < 0 ? 0.3 : -0.08))
  const wealthConcentration = clamp(previous.wealthConcentration + (country.gdpGrowth > 3 ? 0.12 : -0.05) + (country.politicalState?.currentPolicies.economy === 'market' ? 0.08 : 0))
  const socialMobility = clamp(previous.socialMobility + ((country.socialState?.education ?? 50) > 60 ? 0.15 : -0.08) - (inequalityIndex > 60 ? 0.12 : 0))
  const generationConflict = clamp(previous.generationConflict + (inequalityIndex > 55 ? 0.15 : -0.05) + (country.economicState?.standardOfLiving ?? 50) < 45 ? 0.2 : 0)
  const regionalConflict = clamp(previous.regionalConflict + (country.nationalProfile?.weaknesses.includes('지역 격차') ? 0.15 : -0.05) + inequalityIndex * 0.002)
  const ideologicalConflict = clamp(previous.ideologicalConflict + (country.domesticPolitics?.polarization ?? 30) * 0.01 - (country.gdpGrowth > 2 ? 0.08 : 0))
  const politicalCapital = clamp(previous.politicalCapital + (country.gdpGrowth > 1 ? 0.35 : -0.45) + (average > 60 ? 0.25 : -0.15) - (atWar ? 0.15 : 0))
  const legitimacy = clamp(previous.legitimacy + (average - 50) * 0.025 - inequalityIndex * 0.01 - (atWar ? 0.1 : 0))
  const policyOpinion = { ...previous.policyOpinion, 복지확대: clamp(previous.policyOpinion.복지확대 + (workers < 45 ? 0.25 : -0.05)), 군비확대: clamp(previous.policyOpinion.군비확대 + (atWar ? 0.35 : -0.05)), 자유무역: clamp(previous.policyOpinion.자유무역 + (country.economicState?.exports && country.economicState.exports > country.economicState.imports ? 0.15 : -0.1)) }
  const polling = { 정부지지율: clamp((country.domesticPolitics?.governmentApproval ?? country.politicalState?.publicApproval ?? 55) + (average - 50) * 0.04), 지도자지지도: clamp(country.politicalState?.leader?.popularity ?? previous.polling.지도자지지도) }
  const socialConflicts = [{ id: 'class', name: '계층 갈등', intensity: clamp(100 - (workers + entrepreneurs) / 2), sides: ['노동자', '기업가'] }, { id: 'generation', name: '세대 갈등', intensity: generationConflict, sides: ['청년', '노년'] }, { id: 'regional', name: '지역 갈등', intensity: regionalConflict, sides: ['도시', '농촌'] }, { id: 'ideology', name: '이념 갈등', intensity: ideologicalConflict, sides: ['정부', '야당'] }]
  let news: string | undefined
  if (inequalityIndex > 70 && previous.inequalityIndex <= 70) news = `${country.name}의 소득 불평등이 정치적 쟁점으로 부상했습니다.`
  else if (politicalCapital < 20 && previous.politicalCapital >= 20) news = `${country.name} 정부의 정치자본이 크게 감소했습니다.`
  const next: DomesticPolitics2State = { ...previous, inequalityIndex, wealthConcentration, socialMobility, civicParticipation: clamp(previous.civicParticipation + (country.socialState?.education ?? 50) * 0.003 - (country.stability < 35 ? 0.15 : 0)), generationConflict, regionalConflict, ideologicalConflict, policyOpinion, polling, socialConflicts, politicalCapital, legitimacy, policyFatigue: clamp(previous.policyFatigue + (country.politicalState?.policyCooldown ? 0.03 : -0.04)), news: news ? [news, ...previous.news].slice(0, 20) : previous.news, media: previous.media.map((media) => ({ ...media, trust: clamp(media.trust + (country.stability > 60 ? 0.05 : -0.08)), influence: clamp(media.influence + (country.socialState?.education ?? 50) * 0.002) })) }
  return { country: { ...country, domesticPolitics2: next, stability: clamp(country.stability + (legitimacy - country.stability) * 0.03) }, politics: next, news }
}
