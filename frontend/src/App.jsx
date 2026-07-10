import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import VehicleTypes from './pages/VehicleTypes'
import Vehicles from './pages/Vehicles'
import VehicleDetails from './pages/VehicleDetails'
import NotFound from './pages/NotFound'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Home />} />
            <Route path='about' element={<About />} />
            <Route path='vehicle-types' element={<VehicleTypes />} />
            <Route path='vehicle-types/:type' element={<Vehicles />} />
            <Route path='vehicle-types/:type/:id' element={<VehicleDetails />} />
            <Route path='*' element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
  )
}

export default App
