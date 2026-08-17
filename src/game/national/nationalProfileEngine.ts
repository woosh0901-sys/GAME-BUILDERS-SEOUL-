import type { Country, DevelopmentStage, NationalProfile, NationalStrategy } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const identity = (country: Country) => ({ industrialism: clamp(country.industry), militarism: clamp(country.military * 0.55), liberalism: country.politicalState?.liberalism ?? 50, collectivism: country.politicalState?.economicLeft ?? 50, nationalism: country.politicalState?.nationalism ?? 50, internationalism: country.socialState?.socialValues.internationalism ?? 50, technologicalFocus: country.technologyState?.overallLevel ?? country.technology, economicOpenness: country.economicState?.exports ? clamp(country.economicState.exports / Math.max(1, country.gdp) * 500) : country.economy, socialStability: country.stability, diplomaticOrientation: country.diplomaticState?.diplomaticPower ?? 50 })

const countryDefaults: Record<string, Partial<NationalProfile>> = {
  han: { traits: ['기술 선도국', '수출 중심'], weaknesses: ['자원 부족', '무역 의존'], strategy: '수출중심', archetype: '산업·기술국', economicCulture: '무역 중심', diplomaticCulture: '적극적 외교', image: '기술과 제조업의 국가' },
  usa: { traits: ['산업 강국', '해양 국가'], weaknesses: ['높은 지역 격차'], strategy: '기술혁신', archetype: '기술·해양국', economicCulture: '시장 중심', diplomaticCulture: '적극적 외교', image: '세계적 영향력의 국가' },
  japan: { traits: ['기술 선도국', '해양 국가'], weaknesses: ['자원 부족', '인구 고령화'], strategy: '기술혁신', archetype: '기술·무역국', economicCulture: '무역 중심', diplomaticCulture: '다자주의', image: '정밀 제조와 기술의 국가' },
  china: { traits: ['인구 대국', '산업 강국'], weaknesses: ['지역 격차'], strategy: '산업화', archetype: '대륙 산업국', economicCulture: '국가 주도', diplomaticCulture: '지역 패권', image: '거대한 산업국' },
  russia: { traits: ['자원 부국', '군사 강국'], weaknesses: ['기술 의존', '지역 격차'], strategy: '자원개발', archetype: '자원·군사국', economicCulture: '국가 주도', diplomaticCulture: '지역 패권', image: '자원과 군사력의 국가' },
}

export function createNationalProfile(country: Country): NationalProfile {
  const defaults = countryDefaults[country.id] ?? {}
  const values = identity(country)
  return { identity: values, traits: defaults.traits ?? (country.industry > country.economy ? ['산업 강국'] : ['신흥국']), weaknesses: defaults.weaknesses ?? (country.resourceProduction < 35 ? ['자원 부족'] : ['지역 격차']), archetype: defaults.archetype ?? '복합경제국', strategy: defaults.strategy ?? (country.industry > country.economy ? '산업화' : '내수중심'), politicalCulture: defaults.politicalCulture ?? (country.politicalState?.governmentType === '민주주의' ? '경쟁적' : '중앙집권적'), economicCulture: defaults.economicCulture ?? '혼합 경제', diplomaticCulture: defaults.diplomaticCulture ?? '중립주의', developmentStage: '개발도상', resilience: 50, prestige: 40, influence: 30, softPower: 25, image: defaults.image ?? '변화하는 국가', regionalInfluence: {}, projects: [], strategyChangedAt: 0 }
}

export function normalizeNationalProfile(country: Country): NationalProfile { return country.nationalProfile ?? createNationalProfile(country) }

export function updateNationalProfile(country: Country, turn: number): Country {
  const previous = normalizeNationalProfile(country)
  const technology = country.technologyState
  const social = country.socialState
  const economic = country.economicState
  const stageScore = country.gdpPerCapita * 0.025 + country.industry * 0.25 + (social?.education ?? 40) * 0.2 + (technology?.overallLevel ?? country.technology) * 0.3
  const developmentStage: DevelopmentStage = stageScore > 75 ? '기술선도' : stageScore > 60 ? '선진산업' : stageScore > 45 ? '산업화' : stageScore > 25 ? '개발도상' : '저개발'
  const resilience = clamp((country.economicState?.economicResilience ?? 50) * 0.35 + country.stability * 0.25 + (technology?.nationalCapability ?? 40) * 0.2 + (social?.governmentTrust ?? 40) * 0.2)
  const prestige = clamp(country.gdp / 80 + country.military * 0.2 + (technology?.overallLevel ?? country.technology) * 0.35 + (country.diplomaticState?.internationalReputation ?? 0) * 0.2)
  const influence = clamp(country.diplomaticState?.diplomaticPower ?? 30 + prestige * 0.4)
  const softPower = clamp((social?.education ?? 40) * 0.25 + (technology?.overallLevel ?? country.technology) * 0.25 + (country.diplomaticState?.internationalReputation ?? 0) * 0.2 + country.gdpPerCapita * 0.02)
  let strategy = previous.strategy
  let strategyChangedAt = previous.strategyChangedAt
  if (turn - strategyChangedAt > 12) {
    if (country.unemployment > 12) strategy = '산업화'
    else if (country.gdpGrowth < -2) strategy = '내수중심'
    else if ((technology?.technologyGap ?? 50) < 25) strategy = '기술혁신'
    else if (country.military < 35 && country.stability > 60) strategy = '외교확대'
    if (strategy !== previous.strategy) strategyChangedAt = turn
  }
  const projects = previous.projects.map((project) => ({ ...project, progress: Math.min(project.months, project.progress + (country.treasury > 200 ? 1 : 0)) })).filter((project) => project.progress < project.months)
  return { ...country, nationalProfile: { ...previous, identity: identity(country), strategy, strategyChangedAt, developmentStage, resilience, prestige, influence, softPower, projects, image: developmentStage === '기술선도' ? '기술 선도국' : previous.image } }
}
