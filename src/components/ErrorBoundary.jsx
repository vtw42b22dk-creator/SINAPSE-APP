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
          background: '#0A0A0F',
          color: '#fff',
          padding: 24,
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FF3D8A', fontSize: 11, letterSpacing: 1 }}>
            ERRO NA APP
          </p>
          <h1 style={{ fontSize: 20, margin: '8px 0 16px' }}>Algo correu mal ao carregar</h1>
          <pre style={{
            background: 'rgba(255,255,255,0.05)',
            padding: 16,
            borderRadius: 12,
            overflow: 'auto',
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
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
              border: '1px solid rgba(0,255,200,0.4)',
              background: 'rgba(0,255,200,0.1)',
              color: '#00FFC8',
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
