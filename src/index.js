import React from 'react'
import ReactDOM from 'react-dom/client'
import R3FCubemapDemo from './R3FCubemapDemo.jsx'
import './index.css' // если хочешь tailwind или стили

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <R3FCubemapDemo />
  </React.StrictMode>
)
