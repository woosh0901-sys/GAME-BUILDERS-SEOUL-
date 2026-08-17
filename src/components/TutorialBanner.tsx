import { useState } from 'react'

export function TutorialBanner() {
  const [visible, setVisible] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('world-order-tutorial-seen') !== '1')
  if (!visible) return null
  const close = () => { window.localStorage.setItem('world-order-tutorial-seen', '1'); setVisible(false) }
  return <section className="tutorial-banner"><div><b>첫 플레이 안내</b><p>다음 턴으로 세계를 움직이고, 연구·경제·외교·군사를 차례로 확인해 보세요. 국가 상황 요약에서 현재 위험과 기회를 확인할 수 있습니다.</p></div><div><button onClick={close}>확인</button><button onClick={close}>건너뛰기</button></div></section>
}
