import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/AppShell'
import Overview from './pages/Overview'
import Insights from './pages/Insights'
import Experiments from './pages/Experiments'
import Lifecycle from './pages/Lifecycle'
import WorkflowDetail from './pages/WorkflowDetail'
import Capabilities from './pages/Capabilities'
import Roadmap from './pages/Roadmap'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/lifecycle" element={<Lifecycle />} />
          <Route path="/workflow-detail" element={<WorkflowDetail />} />
          <Route path="/capabilities" element={<Capabilities />} />
          <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
