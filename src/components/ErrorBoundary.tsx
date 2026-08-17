import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { if (import.meta.env.DEV) console.error('게임 화면 오류', error, info) }
  render() { return this.state.failed ? <main className="error-screen"><h1>게임 화면을 불러오지 못했습니다.</h1><p>최근 저장 데이터는 유지됩니다. 페이지를 새로고침하거나 다시 시작해 주세요.</p><button onClick={() => window.location.reload()}>새로고침</button></main> : this.props.children }
}
