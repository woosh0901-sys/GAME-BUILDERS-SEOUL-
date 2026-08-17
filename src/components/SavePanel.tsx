import { useEffect, useState } from 'react'
import { deleteSlot, listSlots, loadFromSlot, saveToSlot, type SaveSlotInfo } from '../game/save/saveManager'
import { useGameStore } from '../store/gameStore'

function SaveBridge() {
  const year = useGameStore((state) => state.year)
  const turn = useGameStore((state) => state.turn)
  useEffect(() => { if (turn === 1) saveToSlot(useGameStore.getState(), 'auto') }, [year, turn])
  useEffect(() => { const save = () => saveToSlot(useGameStore.getState(), 'auto'); window.addEventListener('beforeunload', save); return () => window.removeEventListener('beforeunload', save) }, [])
  return null
}

export function SavePanel() {
  const [slots, setSlots] = useState<SaveSlotInfo[]>(() => listSlots())
  const [status, setStatus] = useState('')
  const refresh = () => setSlots(listSlots())
  const save = (slot: number) => { if (slots.find((item) => item.slot === slot)?.valid && !window.confirm('기존 저장 데이터를 덮어쓰시겠습니까?')) return; const result = saveToSlot(useGameStore.getState(), slot); setStatus(result.message); refresh() }
  const load = (slot: number | 'auto') => { const result = loadFromSlot(slot); if (!result.ok || !result.data) { setStatus(result.message); return } useGameStore.setState(result.data.world); setStatus(result.message); refresh() }
  const remove = (slot: number | 'auto') => { if (!window.confirm('이 저장 데이터를 삭제하시겠습니까?')) return; deleteSlot(slot); refresh(); setStatus('저장 데이터를 삭제했습니다.') }
  return <><SaveBridge /><section className="panel save-panel"><div className="panel-title"><h2>저장 · 불러오기</h2><span className="tag">자동 저장 연 1회</span></div><div className="save-slots">{slots.map((slot) => <div className="save-slot" key={String(slot.slot)}><div><strong>{slot.slot === 'auto' ? '자동 저장' : `저장 슬롯 ${slot.slot}`}</strong>{slot.metadata ? <small>{slot.metadata.countryName} · {slot.metadata.date} · GDP {slot.metadata.gdp.toFixed(0)}</small> : <small>저장 데이터 없음</small>}</div><div className="save-actions">{slot.slot !== 'auto' && <button onClick={() => save(slot.slot as number)}>저장</button>}<button disabled={!slot.valid} onClick={() => load(slot.slot)}>불러오기</button>{slot.valid && <button onClick={() => remove(slot.slot)}>삭제</button>}</div></div>)}</div>{status && <p className="save-status">{status}</p>}</section></>
}
