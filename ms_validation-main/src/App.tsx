import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { SetupPage } from './pages/SetupPage';
import { WorkbenchPage } from './pages/WorkbenchPage';
import { CompletionPage } from './pages/CompletionPage';

const App: React.FC = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/complete" element={<CompletionPage />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
