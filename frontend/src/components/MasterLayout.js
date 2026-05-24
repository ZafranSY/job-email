import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MasterLayout({ children, tone, setTone, length, setLength, focus, setFocus }) {
  const location = useLocation();
  const isGeneratorPage = location.pathname === '/generator';

  return (
    <div className="layout">
      <Sidebar 
        tone={tone} 
        setTone={setTone} 
        length={length} 
        setLength={setLength} 
        focus={focus} 
        setFocus={setFocus}
        isGeneratorPage={isGeneratorPage}
      />
      <main className="main">
        {children}
      </main>
    </div>
  );
}
