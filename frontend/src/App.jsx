import { Routes, Route } from 'react-router-dom';
import SignUp from './components/auth/SignUp';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import Plans from './components/plans';
import Payment from './components/payment/Payment';
import Success from './components/payment/Success';
import Cancel from './components/payment/Cancel';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import AppNavbar from './components/ui/navbar';
import { Container } from 'react-bootstrap';

// Simple Home component
function Home() {
  return (
    <Container className="mt-5 text-center">
      <h1>Welcome to Eshtrak</h1>
      <p>Your subscription management platform</p>
      <p className="text-muted">
        Manage your subscriptions and choose the perfect plan for your needs.
      </p>
    </Container>
  );
}

function App() {
  return (
    <div className="App">
      <AppNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/plans" element={<Plans />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment/:planId" 
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/success" 
          element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cancel" 
          element={
            <ProtectedRoute>
              <Cancel />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
