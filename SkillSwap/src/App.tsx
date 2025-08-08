import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SkillListings from './pages/SkillListings';
import Messages from './pages/Messages';
import Requests from './pages/Requests';
import Connections from './pages/Connections';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/skill-listings" element={<PrivateRoute><SkillListings /></PrivateRoute>} />
              <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
              <Route path="/requests" element={<PrivateRoute><Requests /></PrivateRoute>} />
              <Route path="/connections" element={<PrivateRoute><Connections /></PrivateRoute>} />
              <Route path="/admin/*" element={<PrivateRoute adminOnly={true}><AdminDashboard /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 