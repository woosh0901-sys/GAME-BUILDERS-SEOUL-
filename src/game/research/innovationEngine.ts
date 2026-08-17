import type { Country, InnovationState, PatentRecord, ResearchInstitution, ResearchProject } from '../../types/game'
import { technologies } from './researchData'
import { normalizeTechnology } from './technologyEngine'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

const institutionTemplates: { type: ResearchInstitution['type']; name: string; specialty: string }[] = [
  { type: '대학', name: '국립대학 연구단', specialty: '과학' },
  { type: '국립연구소', name: '국가 응용연구소', specialty: '산업' },
  { type: '기업연구소', name: '민간 혁신 연구소', specialty: '경제' },
  { type: '군사연구소', name: '국방 기술연구소', specialty: '군사' },
]

function createInstitutions(country: Country): ResearchInstitution[] {
  return institutionTemplates.map((template, index) => ({ id: `${country.id}-institution-${index}`, name: `${country.name} ${template.name}`, type: template.type, capacity: clamp(country.technology * 0.65 + country.industry * 0.2 + index * 3), researchers: Math.max(1, country.population * (template.type === '대학' ? 0.004 : 0.002)), budget: Math.max(1, country.gdp * (template.type === '기업연구소' ? 0.003 : 0.002)), specialties: [template.specialty], efficiency: clamp(45 + country.stability * 0.25 + country.technology * 0.25) }))
}

function createInnovationState(country: Country): InnovationState {
  const technology = normalizeTechnology(country)
  const institutions = createInstitutions(country)
  return { institutions, researchers: institutions.reduce((sum, item) => sum + item.researchers, 0), publicResearchBudget: country.gdp * 0.01, privateResearchBudget: country.gdp * 0.008, researchEfficiency: clamp(country.technology * 0.45 + country.stability * 0.2 + 35), projects: [], patents: [], diffusion: {}, innovationCapacity: clamp(country.technology * 0.35 + country.industry * 0.2 + technology.technologyInfrastructure * 0.2 + (country.socialState?.education ?? 50) * 0.25), nationalTechPower: technology.nationalCapability, automationLevel: country.researchState.completedTechnologies.includes('automation') ? 35 : 8, technologySecurity: clamp(country.stability * 0.35 + country.technology * 0.45), regulation: 35, dualUseTechnologies: ['electronics', 'computers', 'artificial_intelligence'], technologyStrategy: '균형 혁신', bubbleRisk: 0, history: [] }
}

export const normalizeInnovation = (country: Country) => country.innovationState ?? createInnovationState(country)

function projectFor(country: Country, technologyId: string, state: InnovationState): ResearchProject {
  const technology = technologies.find((item) => item.id === technologyId)
  const institution = state.institutions.find((item) => item.specialties.includes(technology?.category ?? '과학')) ?? state.institutions[0]
  const progress = country.researchState.progress[technologyId] ?? 0
  const stage: ResearchProject['stage'] = progress < 25 ? '연구' : progress < 50 ? '발견' : progress < 75 ? '프로토타입' : '상용화'
  return { id: `${country.id}-project-${technologyId}`, technologyId, name: technology?.name ?? technologyId, kind: technology?.category === '군사' ? '군사연구' : technology?.category === '산업' || technology?.category === '경제' ? '응용연구' : '기초연구', progress, funding: state.publicResearchBudget + state.privateResearchBudget, duration: technology?.researchMonths ?? 12, successChance: clamp(state.researchEfficiency * 0.6 + (institution?.efficiency ?? 50) * 0.4), institutionId: institution?.id ?? '', stage, experience: progress * 0.2 }
}

export function updateInnovation(country: Country, turn = 0): Country {
  const previous = normalizeInnovation(country)
  const technology = normalizeTechnology(country)
  const completed = country.researchState.completedTechnologies
  const projects = country.researchState.activeResearch.map((id) => projectFor(country, id, previous))
  const education = country.socialState?.education ?? country.technology * 0.75
  const researchers = Math.max(1, previous.researchers * (1 + (education > 60 ? 0.004 : -0.002) + (country.stability < 35 ? -0.006 : 0)))
  const brainDrain = country.stability < 35 || country.inflation > 15 ? clamp(previous.researchers * 0.01) : 0
  const brainGain = country.stability > 65 && country.diplomaticState?.internationalReputation && country.diplomaticState.internationalReputation > 50 ? 0.5 : 0
  const researchEfficiency = clamp(previous.researchEfficiency + (education > 60 ? 0.15 : -0.08) + (country.gdpGrowth > 0 ? 0.1 : -0.15))
  const commercialization = { ...technology.commercialization }
  completed.forEach((id) => { commercialization[id] = clamp((commercialization[id] ?? 0) + technology.utilization * 0.025) })
  const patents = [...previous.patents]
  completed.forEach((id) => { if (!patents.some((patent) => patent.technologyId === id)) patents.push({ id: `${country.id}-patent-${id}`, technologyId: id, ownerId: country.id, holder: country.name, licenseFee: 1 + technology.overallLevel / 30, expiresInMonths: 240, protected: true }) })
  const diffusion = Object.fromEntries(completed.map((id) => [id, clamp((previous.diffusion[id] ?? 0) + 0.4 + (country.economicState?.foreignInvestment ?? 0) / 1000)]))
  const automationLevel = clamp(previous.automationLevel + (completed.includes('automation') ? 0.45 : 0) + (completed.includes('artificial_intelligence') ? 0.25 : 0))
  const innovationCapacity = clamp(previous.innovationCapacity + (researchEfficiency - 50) * 0.01 + (brainGain - brainDrain) * 0.1)
  const breakthrough = projects.length > 0 && researchEfficiency > 65 && ((Math.floor(country.gdp) + turn) % 100 < 3)
  const next: InnovationState = { ...previous, researchers: Math.max(1, researchers - brainDrain + brainGain), publicResearchBudget: country.gdp * (technology.researchBudget / 100), privateResearchBudget: country.economicDeepState ? country.economicDeepState.companies.reduce((sum, company) => sum + company.revenue * 0.01, 0) : country.gdp * 0.008, researchEfficiency, projects, patents: patents.map((patent) => ({ ...patent, expiresInMonths: Math.max(0, patent.expiresInMonths - 1), protected: patent.expiresInMonths > 0 })), diffusion, innovationCapacity, nationalTechPower: clamp(technology.nationalCapability + innovationCapacity * 0.12), automationLevel, technologySecurity: clamp(previous.technologySecurity + (country.stability > 50 ? 0.1 : -0.2)), regulation: previous.regulation, dualUseTechnologies: previous.dualUseTechnologies, technologyStrategy: previous.technologyStrategy, bubbleRisk: clamp(previous.bubbleRisk + (projects.length > 2 ? 0.4 : -0.2)), history: [`${projects.length}개 연구 프로젝트 · 혁신 역량 ${innovationCapacity.toFixed(0)}`, ...previous.history].slice(0, 18) }
  if (breakthrough) next.history = [`연구 돌파구: ${projects[0].name}`, ...next.history].slice(0, 18)
  const updatedTechnology = { ...technology, commercialization, brainDrain: clamp(brainDrain * 10), brainGain: clamp(brainGain * 10), lastBreakthrough: breakthrough ? projects[0].name : technology.lastBreakthrough }
  const deep = country.economicDeepState
  const updatedDeep = deep ? { ...deep, companies: deep.companies.map((company) => ({ ...company, technologyLevel: clamp(company.technologyLevel + technology.utilization * 0.008), productivity: clamp(company.productivity + (company.industryId === '기술산업' ? commercialization['artificial_intelligence'] ?? 0 : 0) * 0.002), investment: company.investment * (1 + innovationCapacity / 1000) })) } : undefined
  return { ...country, technologyState: updatedTechnology, innovationState: next, ...(updatedDeep ? { economicDeepState: updatedDeep } : {}) }
}
