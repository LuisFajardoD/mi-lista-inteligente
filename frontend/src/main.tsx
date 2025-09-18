import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Auth from './pages/Auth'
import UploadList from './pages/UploadList'
import UnifiedList from './pages/UnifiedList'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/auth" replace />} />
          <Route path="auth" element={<Auth />} />
          <Route path="upload" element={<UploadList />} />
          <Route path="unified" element={<UnifiedList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
