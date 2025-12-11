import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Services from './pages/Services';
import ServiceLogs from './pages/ServiceLogs';
import Chat from './pages/Chat';

// Protected Route Wrapper
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route (redirects to dashboard if already logged in)
const PublicOnly = ({ children }: { children: ReactNode }) => {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          } />
          <Route path="/" element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          } />
          <Route path="/logs" element={
            <RequireAuth>
              <Logs />
            </RequireAuth>
          } />
          <Route path="/services" element={
            <RequireAuth>
              <Services />
            </RequireAuth>
          } />
          <Route path="/service-logs" element={
            <RequireAuth>
              <ServiceLogs />
            </RequireAuth>
          } />
          <Route path="/chat" element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          } />
          <Route path="/settings" element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
