import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { NotFoundPage } from './pages/NotFound';
import { UnitsPage } from './pages/units/Units';
import { PlasmasPage } from './pages/plasmas/Plasmas';
import { CyclesPage } from './pages/cycles/Cycles';
import { FeedStock } from './pages/feed/FeedStock';
import { FeedTypesPage } from './pages/feed/FeedTypes';
import { FeedBrandsPage } from './pages/feed/FeedBrands';
import { FeedProductsPage } from './pages/feed/FeedProducts';
import { Performance } from './pages/reports/Performance';
import { StockResume } from './pages/reports/StockResume';
import { DailyRecording } from './pages/recordings/DailyRecording';
import { AuditLog } from './pages/admin/AuditLog';
import { RbacManager } from './pages/rbac/RbacManager';
import { UsersPage } from './pages/admin/Users';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/plasmas" element={<PlasmasPage />} />
        <Route path="/cycles" element={<CyclesPage />} />
        <Route path="/recordings" element={<DailyRecording />} />
        <Route path="/feed" element={<FeedStock />} />
        <Route path="/feed/types" element={<FeedTypesPage />} />
        <Route path="/feed/brands" element={<FeedBrandsPage />} />
        <Route path="/feed/products" element={<FeedProductsPage />} />
        <Route path="/reports" element={<div>Reports (coming in Phase 9)</div>} />
        <Route path="/reports/performance" element={<Performance />} />
        <Route path="/reports/stock-resume" element={<StockResume />} />
        <Route path="/reports/audit" element={<AuditLog />} />
        <Route path="/rbac" element={<RbacManager />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
