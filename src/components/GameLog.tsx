import { useGameStore } from '../store/gameStore'

const localizeLegacyLog = (text: string) => text.includes('World Order simulation') ? '월드 오더 시뮬레이션이 시작되었습니다.' : text.includes('Turn advanced') ? '턴이 진행되었습니다.' : text
export function GameLog() { const logs = useGameStore((state) => state.logs); return <section className="log-panel"><div className="log-title"><span className="eyebrow">지휘 기록</span><h2>게임 로그</h2></div><div className="logs">{logs.map((log) => <div className="log-entry" key={log.id}><span className={log.type === 'turn' ? 'log-icon turn' : 'log-icon'}>{log.type === 'turn' ? '→' : '◆'}</span><span>{localizeLegacyLog(log.text)}</span></div>)}</div></section> }
