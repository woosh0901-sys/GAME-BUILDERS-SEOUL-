import type { Country, DomesticEvent, PoliticalState } from '../../types/game'

export function generateDomesticEvent(country: Country, political: PoliticalState): DomesticEvent | null {
  const roll = Math.random()
  if (political.publicApproval < 25 && political.politicalStability < 30) return { id: 'government-crisis', title: '정부 위기', description: '정부에 대한 국민의 신뢰가 크게 하락했습니다.', category: '정치', priority: 'CRITICAL', choices: [{ id: 'reform', label: '개혁 추진' }, { id: 'control', label: '강경 통치' }, { id: 'election', label: '국민에게 호소' }] }
  if ((political.warExhaustion ?? 0) > 70 && roll < 0.22) return { id: 'war-protest', title: '전쟁 반대 시위', description: '전쟁이 길어지며 시민들이 종전을 요구하고 있습니다.', category: '사회', priority: 'HIGH', choices: [{ id: 'negotiate', label: '평화 협상 추진' }, { id: 'continue', label: '전쟁 지속 선언' }] }
  if (country.unemployment > 8 && roll < 0.18) return { id: 'strike', title: '노동자 파업', description: '전국적으로 대규모 파업이 발생했습니다.', category: '산업', priority: 'HIGH', choices: [{ id: 'raise', label: '임금 인상 수용' }, { id: 'hardline', label: '강경 대응' }, { id: 'negotiate', label: '협상' }] }
  if (country.inflation > 5 && roll < 0.16) return { id: 'prices', title: '물가 상승', description: '생활 물가가 빠르게 상승하고 있습니다.', choices: [{ id: 'subsidy', label: '생활 보조금 지급' }, { id: 'market', label: '시장에 맡기기' }] }
  if (country.gdpGrowth < 0 && roll < 0.2) return { id: 'recession', title: '경제 불황', description: '생산과 소비가 동시에 위축되고 있습니다.', choices: [{ id: 'stimulus', label: '경기 부양' }, { id: 'austerity', label: '긴축 유지' }] }
  if (country.gdpGrowth > 5 && roll < 0.14) return { id: 'boom', title: '산업 호황', description: '산업 생산과 고용이 크게 늘고 있습니다.', choices: [{ id: 'invest', label: '성장에 투자' }, { id: 'save', label: '재정 비축' }] }
  if (political.liberalism > 65 && roll < 0.1) return { id: 'reform-demand', title: '사회 개혁 요구', description: '시민들이 더 큰 자유와 권리를 요구하고 있습니다.', choices: [{ id: 'accept', label: '개혁 수용' }, { id: 'delay', label: '논의 연기' }] }
  return null
}

export function resolveDomesticEvent(event: DomesticEvent, choice: string, country: Country, political: PoliticalState) {
  let approval = 0; let stability = 0; let treasury = 0; let growth = 0; let unemployment = 0
  if (event.id === 'strike') { if (choice === 'raise') { approval = 3; treasury = -10; unemployment = -0.4 } else if (choice === 'hardline') { approval = -3; stability = -2 } else { approval = 1; stability = 1; treasury = -4 } }
  if (event.id === 'government-crisis') { if (choice === 'reform') { approval = 5; stability = 3; } else if (choice === 'control') { stability = 2; approval = -3; } else { approval = 2; stability = -1 } }
  if (event.id === 'recession') { if (choice === 'stimulus') { approval = 2; treasury = -12; growth = 0.6 } else { approval = -2; treasury = 5; growth = -0.2 } }
  if (event.id === 'boom') { approval = choice === 'invest' ? 4 : 2; growth = choice === 'invest' ? 0.6 : 0.2; treasury = choice === 'save' ? 8 : -5 }
  if (event.id === 'prices') { approval = choice === 'subsidy' ? 2 : -2; treasury = choice === 'subsidy' ? -8 : 3 }
  if (event.id === 'reform-demand') { approval = choice === 'accept' ? 3 : -1; stability = choice === 'accept' ? 1 : -1 }
  return { country: { ...country, stability: Math.max(0, Math.min(100, country.stability + stability)), treasury: Math.max(0, country.treasury + treasury), gdpGrowth: country.gdpGrowth + growth, unemployment: Math.max(0, country.unemployment + unemployment) }, political: { ...political, publicApproval: Math.max(0, Math.min(100, political.publicApproval + approval)), politicalStability: Math.max(0, Math.min(100, political.politicalStability + stability)) } }
}
