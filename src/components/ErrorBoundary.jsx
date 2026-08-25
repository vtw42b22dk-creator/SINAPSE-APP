import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error: error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0A0A0B',
          color: '#EDEDEF',
          padding: 24,
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", color: '#C08C8C', fontSize: 11, letterSpacing: 1 }}>
            ERRO NA APP
          </p>
          <h1 style={{ fontSize: 20, margin: '8px 0 16px' }}>Algo correu mal ao carregar</h1>
          <pre style={{
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: 16,
            borderRadius: 12,
            overflow: 'auto',
            fontSize: 12,
            color: '#A0A0A8',
          }}>
            {String(this.state.error.message || this.state.error)}
          </pre>
          <button
            type="button"
            onClick={function() { window.location.reload() }}
            style={{
              marginTop: 16,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.14)',
              background: '#1A1A1D',
              color: '#EDEDEF',
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
