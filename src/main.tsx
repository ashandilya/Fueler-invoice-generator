import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { PublicInvoiceView } from './components/invoice/PublicInvoiceView';
import './index.css';

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
