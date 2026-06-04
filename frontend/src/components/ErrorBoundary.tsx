import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[QingLu] UI error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#2d3d0e] px-6 text-center text-white">
          <h1 className="text-lg font-semibold">页面加载出错</h1>
          <p className="max-w-md text-sm text-white/80">
            {this.state.error.message || '未知错误'}
          </p>
          <button
            type="button"
            className="rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-emerald-950"
            onClick={() => window.location.assign('/')}
          >
            返回首页
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
