import { useState } from 'react'
import { loadFromSlot } from '../game/save/saveManager'
import { useGameStore } from '../store/gameStore'

export function MainMenu() {
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('world-order-started') !== '1')
  const [settings, setSettings] = useState(false)
  if (!open) return null
  const start = () => { window.localStorage.setItem('world-order-started', '1'); window.localStorage.removeItem('world-order-save'); window.location.reload() }
  const load = () => { const result = loadFromSlot('auto'); if (result.ok && result.data) { useGameStore.setState(result.data.world); window.localStorage.setItem('world-order-started', '1'); setOpen(false) } else { document.querySelector('.save-panel')?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) } }
  return <div className="main-menu-backdrop"><section className="main-menu"><span className="brand-mark">월드</span><h1>WORLD ORDER</h1><p>당신의 선택이 역사를 만든다.</p><button onClick={start}>새 게임</button><button onClick={load}>불러오기</button><button onClick={() => setSettings(true)}>설정</button><small>한국어 · 브라우저 자동 저장 지원</small>{settings && <div className="settings-card"><h2>설정</h2><p>현재 버전은 한국어와 자동 저장을 기본으로 사용합니다.</p><button onClick={() => setSettings(false)}>닫기</button></div>}</section></div>
}
