import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TooltipProvider } from './components/ui/tooltip';
import AppRoutes from './AppRoutes';
import './index.css';

const ThemedToaster = () => {
  const { theme } = useTheme();
  return <Toaster position="top-right" theme={theme} richColors closeButton toastOptions={{ duration: 4000 }} />;
};

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <ThemedToaster />
            <AppRoutes />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
