import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AuditLogs from './pages/AuditLogs';
import TeamInsights from './pages/TeamInsights';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <><SignedIn><Dashboard /></SignedIn><SignedOut><Navigate to="/auth" /></SignedOut></>
        } />
        <Route path="/audit-logs" element={
          <><SignedIn><AuditLogs /></SignedIn><SignedOut><Navigate to="/auth" /></SignedOut></>
        } />
        <Route path="/team-insights" element={
          <><SignedIn><TeamInsights /></SignedIn><SignedOut><Navigate to="/auth" /></SignedOut></>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
