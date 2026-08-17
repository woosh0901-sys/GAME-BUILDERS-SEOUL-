import type { GameState } from '../../types/game'
import { getDateLabel } from '../time'

export const SAVE_VERSION = 29
const SLOT_KEY = (slot: number) => `world-order-slot-${slot}`
const AUTO_KEY = 'world-order-auto'
const BACKUP_KEY = 'world-order-auto-backup'

export interface SaveMetadata { countryName: string; date: string; gdp: number; population: number; savedAt: string; playTime: string }
export interface SaveEnvelope { saveVersion: number; metadata: SaveMetadata; world: Partial<GameState> }
export interface SaveSlotInfo { slot: number | 'auto'; metadata?: SaveMetadata; valid: boolean }

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const storage = () => typeof window === 'undefined' ? null : window.localStorage

function metadata(state: GameState): SaveMetadata {
  const country = state.countries.find((item) => item.id === state.playerCountryId) ?? state.countries[0]
  return { countryName: country?.name ?? '알 수 없음', date: getDateLabel(state.year, state.turn), gdp: country?.gdp ?? 0, population: country?.population ?? 0, savedAt: new Date().toISOString(), playTime: `${Math.max(0, (state.year - 2026) * 12 + state.turn - 1)}개월` }
}

export function createSave(state: GameState): SaveEnvelope { return { saveVersion: SAVE_VERSION, metadata: metadata(state), world: clone({ ...state, saveVersion: SAVE_VERSION }) } }

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }

export function migrateSave(input: unknown): SaveEnvelope | null {
  if (!isObject(input)) return null
  const raw = input as Partial<SaveEnvelope> & { year?: number; countries?: GameState['countries'] }
  const source = (isObject(raw.world) ? raw.world : raw) as Partial<GameState>
  if (!Array.isArray(source.countries) || source.countries.length === 0) return null
  const countryIds = new Set(source.countries.map((country) => country.id).filter((id): id is string => typeof id === 'string'))
  const playerCountryId = typeof source.playerCountryId === 'string' && countryIds.has(source.playerCountryId) ? source.playerCountryId : [...countryIds][0]
  const validCountries = source.countries.filter((country) => isObject(country) && typeof country.id === 'string')
  const cleanWorld: Partial<GameState> = { ...source, countries: validCountries, playerCountryId, selectedCountryId: typeof source.selectedCountryId === 'string' && countryIds.has(source.selectedCountryId) ? source.selectedCountryId : playerCountryId, wars: Array.isArray(source.wars) ? source.wars.filter((war) => isObject(war) && countryIds.has(war.attacker) && countryIds.has(war.defender)) : [], territories: isObject(source.territories) ? Object.fromEntries(Object.entries(source.territories).filter(([id]) => countryIds.has(id))) as GameState['territories'] : {}, eventQueue: Array.isArray(source.eventQueue) ? source.eventQueue.slice(-12) : [], logs: Array.isArray(source.logs) ? source.logs.slice(0, 50) : [], historicalEvents: Array.isArray(source.historicalEvents) ? source.historicalEvents.slice(-500) : [], eventHistory: Array.isArray(source.eventHistory) ? source.eventHistory.slice(-200) : [] }
  return { saveVersion: SAVE_VERSION, metadata: isObject(raw.metadata) ? raw.metadata as SaveMetadata : { countryName: '복구된 저장', date: '알 수 없음', gdp: 0, population: 0, savedAt: new Date().toISOString(), playTime: '알 수 없음' }, world: cleanWorld }
}

export function saveToSlot(state: GameState, slot: number | 'auto'): { ok: boolean; message: string } {
  const target = slot === 'auto' ? AUTO_KEY : SLOT_KEY(slot)
  const store = storage(); if (!store) return { ok: false, message: '브라우저 저장소를 사용할 수 없습니다.' }
  try {
    const serialized = JSON.stringify(createSave(state))
    if (slot === 'auto') { const current = store.getItem(AUTO_KEY); if (current) store.setItem(BACKUP_KEY, current) }
    store.setItem(target, serialized)
    return { ok: true, message: '저장되었습니다.' }
  } catch { return { ok: false, message: '저장 공간이 부족하거나 저장 중 오류가 발생했습니다.' } }
}

export function loadFromSlot(slot: number | 'auto'): { ok: boolean; data?: SaveEnvelope; message: string } {
  const store = storage(); if (!store) return { ok: false, message: '브라우저 저장소를 사용할 수 없습니다.' }
  try { const raw = store.getItem(slot === 'auto' ? AUTO_KEY : SLOT_KEY(slot)); if (!raw) return { ok: false, message: '저장 데이터가 없습니다.' }; const data = migrateSave(JSON.parse(raw)); return data ? { ok: true, data, message: '불러왔습니다.' } : { ok: false, message: '저장 데이터를 불러올 수 없습니다.' } } catch { return { ok: false, message: '저장 데이터가 손상되었습니다.' } }
}

export function deleteSlot(slot: number | 'auto') { storage()?.removeItem(slot === 'auto' ? AUTO_KEY : SLOT_KEY(slot)) }
export function listSlots(): SaveSlotInfo[] { const slots: SaveSlotInfo[] = [1, 2, 3].map((slot) => { const loaded = loadFromSlot(slot); return { slot, metadata: loaded.data?.metadata, valid: loaded.ok } }); const auto = loadFromSlot('auto'); return [...slots, { slot: 'auto', metadata: auto.data?.metadata, valid: auto.ok }] }
