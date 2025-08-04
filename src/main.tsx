import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import App from './App.tsx';
import { PublicInvoiceView } from './components/invoice/PublicInvoiceView';
import './index.css';

// Handle OAuth callback
const handleAuthCallback = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error handling auth callback:', error);
  } else if (data.session) {
    console.log('User authenticated successfully:', data.session.user.email);
    // Clean up the URL by removing the hash parameters
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
};

// Check if this is an OAuth callback
if (window.location.hash && window.location.hash.includes('access_token')) {
  handleAuthCallback();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/invoice/:invoiceId" element={<PublicInvoiceView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
