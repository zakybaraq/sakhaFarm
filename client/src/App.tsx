import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { NotFoundPage } from './pages/NotFound'
import { FeedStock } from './pages/feed/FeedStock'
import { Performance } from './pages/reports/Performance'
import { StockResume } from './pages/reports/StockResume'
import { DailyRecording } from './pages/recordings/DailyRecording'
import { AuditLog } from './pages/admin/AuditLog'
import { RbacManager } from './pages/rbac/RbacManager'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/units" element={<div>Units (coming in Phase 9)</div>} />
        <Route path="/plasmas" element={<div>Plasmas (coming in Phase 9)</div>} />
        <Route path="/cycles" element={<div>Cycles (coming in Phase 9)</div>} />
        <Route path="/recordings" element={<DailyRecording />} />
        <Route path="/feed" element={<FeedStock />} />
        <Route path="/reports" element={<div>Reports (coming in Phase 9)</div>} />
        <Route path="/reports/performance" element={<Performance />} />
        <Route path="/reports/stock-resume" element={<StockResume />} />
        <Route path="/reports/audit" element={<AuditLog />} />
        <Route path="/rbac" element={<RbacManager />} />
        <Route path="/users" element={<div>Users (coming in Phase 9)</div>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}