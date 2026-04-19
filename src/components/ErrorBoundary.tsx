import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-6 text-center px-6">
          <div className="w-16 h-16 rounded-full border border-crimson/30 flex items-center justify-center">
            <span className="font-serif text-2xl text-crimson-bright">!</span>
          </div>
          <div>
            <p className="font-serif text-2xl text-marble mb-2">Signal Lost</p>
            <p className="text-marble/40 text-sm max-w-xs">Something went wrong. Refresh to reconnect.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="micro-caps text-sm px-8 py-3 rounded-full border border-white/20 text-marble/60 hover:text-marble hover:border-white/40 transition-all"
          >
            Reconnect
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
