import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreatePoll from './pages/CreatePoll.jsx';
import PollView from './pages/PollView.jsx';
import PollResults from './pages/PollResults.jsx';
import ParticipantHome from './pages/ParticipantHome.jsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading PollWave...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={user ? <Navigate to={user.role === 'ORGANIZER' ? '/dashboard' : '/home'} /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'ORGANIZER' ? '/dashboard' : '/home'} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to={user.role === 'ORGANIZER' ? '/dashboard' : '/home'} /> : <Register />} />
          <Route path="/poll/:shortId" element={<PollView />} />

          {/* Organizer routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['ORGANIZER']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-poll" element={
            <ProtectedRoute roles={['ORGANIZER']}>
              <CreatePoll />
            </ProtectedRoute>
          } />
          <Route path="/results/:pollId" element={
            <ProtectedRoute roles={['ORGANIZER']}>
              <PollResults />
            </ProtectedRoute>
          } />

          {/* Participant routes */}
          <Route path="/home" element={
            <ProtectedRoute roles={['PARTICIPANT']}>
              <ParticipantHome />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
