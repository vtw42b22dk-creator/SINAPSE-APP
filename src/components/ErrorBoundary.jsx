import { Component } from 'react'
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from '../lib/theme'

var ACCENT = moduleColor('journal')

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
          position: 'relative',
          overflow: 'hidden',
          '--mc': ACCENT,
        }}>
          <style>{MODULE_GLOW_CSS}</style>
          <div className="mod-glow" style={{ top: -60, right: '8%', background: moduleGlow(ACCENT) }} aria-hidden="true" />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", color: '#C08C8C', fontSize: 11, letterSpacing: 1 }}>
            ERRO NA APP
          </p>
          <h1 style={{ fontSize: 20, margin: '8px 0 16px', color: ACCENT }}>Algo correu mal ao carregar</h1>
          <pre style={{
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            padding: '16px 0',
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
              padding: '10px 0',
              border: 'none',
              borderBottom: '1px solid ' + ACCENT,
              background: 'transparent',
              color: ACCENT,
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
