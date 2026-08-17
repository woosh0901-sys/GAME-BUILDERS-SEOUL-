import type { Country, IntelligenceOperation, IntelligenceOperationType, IntelligenceReport, IntelligenceState, ObservedState } from '../../types/game'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const range = (value: number, accuracy: number) => ({ min: Math.max(0, value * (1 - accuracy)), max: value * (1 + accuracy) })

export function createIntelligenceState(country: Country): IntelligenceState {
  const level = clamp(country.technology * 0.55 + country.stability * 0.2)
  return { agencyLevel: level, networkLevel: clamp(level * 0.8), collection: level, analysis: clamp(level * 0.9), counterIntelligence: clamp(country.stability * 0.5 + country.technology * 0.3), budget: 30, personnel: 40, experience: 25, reliability: 65, informationSecurity: clamp(country.technology * 0.6 + country.stability * 0.25), informationWarfare: clamp(country.technology * 0.45), priority: '정보 수집', operations: [], reports: [], observations: {} }
}

export function normalizeIntelligence(country: Country): IntelligenceState { return country.intelligenceState ?? createIntelligenceState(country) }

export function startIntelligenceOperation(country: Country, targetCountryId: string, type: IntelligenceOperationType): Country {
  const state = normalizeIntelligence(country)
  if (country.id === targetCountryId || state.operations.some((operation) => operation.status === '진행 중' && operation.targetCountryId === targetCountryId && operation.type === type)) return country
  const duration = type === '정치 분석' || type === '경제 분석' ? 2 : type === '군사 정찰' ? 1 : 3
  const operation: IntelligenceOperation = { id: `intel-${Date.now()}-${targetCountryId}`, type, targetCountryId, progress: 0, duration, risk: type === '방첩' || type === '정보 검증' ? 5 : 12, status: '진행 중' }
  return { ...country, intelligenceState: { ...state, operations: [...state.operations, operation].slice(-12) } }
}

function reportFor(country: Country, target: Country, operation: IntelligenceOperation, state: IntelligenceState, turn: number): IntelligenceReport {
  const targetIntel = normalizeIntelligence(target)
  const defensivePenalty = targetIntel.counterIntelligence * 0.35
  const accuracy = clamp(state.collection * 0.35 + state.analysis * 0.3 + state.networkLevel * 0.2 + state.experience * 0.1 + state.reliability * 0.05 - defensivePenalty, 8, 94)
  const error = Math.max(0.04, (100 - accuracy) / 100)
  const category = operation.type === '군사 정찰' ? '군사정보' : operation.type === '경제 분석' ? '경제정보' : operation.type === '정치 분석' ? '정치정보' : operation.type === '외교 분석' ? '외교정보' : operation.type === '기술 분석' ? '기술정보' : '종합정보'
  const actual = operation.type === '군사 정찰' ? target.military : operation.type === '경제 분석' ? target.gdp : operation.type === '정치 분석' ? target.stability : target.military + target.gdp / 20
  const estimate = range(actual, error)
  return { id: `report-${Date.now()}-${target.id}`, targetCountryId: target.id, category, confidence: Number(accuracy.toFixed(1)), age: 0, estimate: `${estimate.min.toFixed(0)}~${estimate.max.toFixed(0)}`, actualValue: actual, source: state.networkLevel > 60 ? '다중 정보망' : '제한된 정보원', assessment: accuracy > 70 ? '높은 신뢰도의 분석입니다.' : accuracy > 45 ? '추정치에 상당한 불확실성이 있습니다.' : '정보 부족으로 오판 가능성이 높습니다.' }
}

export function updateIntelligence(countries: Country[], turn: number): { countries: Country[]; messages: string[] } {
  const messages: string[] = []
  const next = countries.map((country) => {
    const state = normalizeIntelligence(country)
    const operations = state.operations.map((operation) => operation.status === '진행 중' ? { ...operation, progress: Math.min(operation.duration, operation.progress + 1) } : operation)
    const reports = [...state.reports].map((report) => ({ ...report, age: report.age + 1, confidence: clamp(report.confidence - (report.age > 6 ? 2 : 0)) }))
    let reliability = clamp(state.reliability + (reports.some((report) => report.confidence < 20) ? -0.2 : 0.05))
    const completed = operations.filter((operation) => operation.status === '진행 중' && operation.progress >= operation.duration)
    const finished = operations.map((operation) => completed.some((item) => item.id === operation.id) ? { ...operation, status: '완료' as const } : operation)
    completed.forEach((operation) => {
      const target = countries.find((item) => item.id === operation.targetCountryId)
      if (!target) return
      const report = reportFor(country, target, operation, state, turn)
      reports.unshift(report)
      messages.push(`${country.name}의 ${target.name} 대상 ${operation.type} 보고서가 작성되었습니다.`)
      if (report.confidence < 35) reliability = clamp(reliability - 1)
    })
    const observations: Record<string, ObservedState> = { ...state.observations }
    reports.slice(0, 20).forEach((report) => {
      const existing = observations[report.targetCountryId] ?? { confidence: 0, lastUpdatedTurn: turn }
      const target = countries.find((item) => item.id === report.targetCountryId)
      if (!target) return
      observations[report.targetCountryId] = { ...existing, confidence: Math.max(existing.confidence, report.confidence), lastUpdatedTurn: turn, ...(report.category === '군사정보' ? { militaryPower: range(target.military, (100 - report.confidence) / 100) } : {}), ...(report.category === '경제정보' ? { gdp: range(target.gdp, (100 - report.confidence) / 100) } : {}), ...(report.category === '정치정보' ? { stability: range(target.stability, (100 - report.confidence) / 100) } : {}) }
    })
    return { ...country, intelligenceState: { ...state, experience: clamp(state.experience + (completed.length ? 0.2 : 0)), reliability, operations: finished, reports: reports.slice(0, 30), observations } }
  })
  return { countries: next, messages }
}
