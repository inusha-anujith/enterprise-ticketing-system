import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 1. We import the BrowserRouter tool
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. We wrap our App inside it! */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)