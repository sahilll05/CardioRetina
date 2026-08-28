import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { PatientList } from '@/pages/Patients/PatientList';
import { PatientDetail } from '@/pages/Patients/PatientDetail';
import { NewAnalysisWizard } from '@/pages/Analysis/NewAnalysisWizard';
import { AnalysisStatus } from '@/pages/Analysis/AnalysisStatus';
import { ReportsList } from '@/pages/Reports/ReportsList';
import { QueueMonitor } from '@/pages/Ingestion/QueueMonitor';
import { Settings } from '@/pages/Settings/Settings';
import { Landing } from '@/pages/Landing';
import { LoginPage } from '@/pages/Auth/LoginPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="patients">
            <Route index element={<PatientList />} />
            <Route path=":patientId" element={<PatientDetail />} />
          </Route>

          <Route path="visits" element={<Navigate to="/patients" replace />} />

          <Route path="analysis">
            <Route index element={<Navigate to="/analysis/new" replace />} />
            <Route path="new" element={<NewAnalysisWizard />} />
            <Route path=":jobId" element={<AnalysisStatus />} />
          </Route>

          <Route path="reports" element={<ReportsList />} />
          <Route path="ingestion/queue" element={<QueueMonitor />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
