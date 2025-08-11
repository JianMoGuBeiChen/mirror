import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SmartMirror from './pages/SmartMirror';
import Settings from './pages/Settings';
import SpotifyCallback from './pages/SpotifyCallback';
import { ThemeProvider } from './context/ThemeContext';
import './utils/globalSettings';

function App() {
  return (
    <ThemeProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<SmartMirror />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
