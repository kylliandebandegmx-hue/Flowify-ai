import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onRegistered(r: any) {
    if (r) {
      r.onupdatefound = () => {
        console.log('Nouvelle version disponible.')
      }
    }
  }
})

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

export { updateSW }
