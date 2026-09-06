import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BackgroundWrapper from './components/layout/BackgroundWrapper';
import Register from './pages/register';
import Login from './pages/login';
import CameraCapture from './components/CameraCapture';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'

function App() {
  return (
    <>
      <BackgroundWrapper>
        <Router >
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/hdquote" element={
                <ProtectedRoute>
                    <CameraCapture />
                </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </BackgroundWrapper>
    </>
  );
}

export default App;