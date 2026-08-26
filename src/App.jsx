import { HashRouter, Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Projects from './pages/Projects'
import ProjectWorkspace from './pages/ProjectWorkspace'
import Synapse from './pages/Synapse'
import Calendar from './pages/Calendar'
import Tasks from './pages/Tasks'
import Journal from './pages/Journal'
import Wishlist from './pages/Wishlist'
import Finance from './pages/Finance'
import Focus from './pages/Focus'
import AuthGate from './components/AuthGate'
import RouteAccent from './lib/RouteAccent'
import { AuthProvider } from './lib/AuthContext'
import { ThemeProvider } from './lib/ThemeContext'
import { MOBILE_GLOBAL_CSS } from './lib/mobileUi'
import { MODULE_ACCENT_CSS } from './lib/theme'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <RouteAccent />
          <style>{MOBILE_GLOBAL_CSS + MODULE_ACCENT_CSS}</style>
          <AuthGate>
            <Routes>
              <Route path="/" element={<Hub />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
              <Route path="/projects/:projectId/:moduleId" element={<ProjectWorkspace />} />
              <Route path="/synapse" element={<Projects />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/focus" element={<Focus />} />
            </Routes>
          </AuthGate>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
