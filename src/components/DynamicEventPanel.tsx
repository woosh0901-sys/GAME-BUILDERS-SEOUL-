import { useGameStore } from '../store/gameStore'

export function DynamicEventPanel() {
  const state = useGameStore()
  const event = (state.eventQueue ?? []).find((item) => item.availableTurn <= state.turn)
  if (!event) return null
  return <section className={`panel dynamic-event-panel importance-${event.importance}`}><div className="panel-title"><h2>{event.title}</h2><span className="tag">{event.category} · 중요도 {event.importance}</span></div><p className="dynamic-event-description">{event.description}</p><div className="section-label">발생 원인</div><div className="event-cause">{event.cause.map((cause) => <span key={cause}>● {cause}</span>)}</div><div className="dynamic-event-options">{event.options.map((option) => <button key={option.id} className="dynamic-option" onClick={() => state.resolveDynamicEvent(event.id, option.id)}><b>{option.label}</b><span>{option.description}</span>{option.requirement && <small>조건: {option.requirement}</small>}</button>)}</div></section>
}
