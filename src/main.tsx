import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- 1. IMPORT THIS
import App from './app/App'
  import "./styles/index.css";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* 2. WRAP APP IN BROWSER ROUTER HERE */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)