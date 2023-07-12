import { useState } from 'react'
import './App.css'
import FormInicio from './Components/FormInicio'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import PrimeraEtapa from './Components/PrimeraEtapa'
import MonitorOT from './pages/MonitorOT'
import Pruebas from './pages/Pruebas'
import Tabla from './pages/Tabla'
function App() {

  return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Pruebas />} />
      <Route path="/OTS" element={<FormInicio />} />
      <Route path="ot/:NumOT" element={<PrimeraEtapa />} />
      <Route path="/pruebas" element={<Pruebas />} />
      <Route path="/Tabla" element={<Tabla />} />
    </Routes>
  </BrowserRouter>

  )
}

export default App
