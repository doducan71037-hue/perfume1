import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/ui/Layout';
import { Home } from './pages/Home';
import { Consultation } from './pages/Consultation';
import { Report } from './pages/Report';
import { PerfumeDetail } from './pages/PerfumeDetail';
import { Search } from './pages/Search';
import { Glossary } from './pages/Glossary';
import { Login } from './pages/Login';
import { Subscribe } from './pages/Subscribe';
import { Disclaimer, Privacy } from './pages/Static';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/report/:conversationId" element={<Report />} />
            <Route path="/perfume/:id" element={<PerfumeDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/login" element={<Login />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;