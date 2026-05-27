import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MasterLayout from './components/MasterLayout';
import JobGenerator from './components/JobGenerator';
import PipelineDashboard from './components/PipelineDashboard';
import './App.css';

export default function App() {
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [focus, setFocus] = useState('balanced');

  return (
    <BrowserRouter>
      <MasterLayout
        tone={tone}
        setTone={setTone}
        length={length}
        setLength={setLength}
        focus={focus}
        setFocus={setFocus}
      >
        <Routes>
          <Route
            path="/generator"
            element={
              <JobGenerator
                tone={tone}
                length={length}
                focus={focus}
              />
            }
          />
          <Route
            path="/dashboard"
            element={<PipelineDashboard />}
          />
          {/* Redirect from root sto generator */}
          <Route
            path="*"
            element={<Navigate to="/generator" replace />}
          />
        </Routes>
      </MasterLayout>
    </BrowserRouter>
  );
}
