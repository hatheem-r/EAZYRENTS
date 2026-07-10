import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Vehicles from './pages/Vehicles'
import VehicleTypes from './pages/VehicleTypes'
import VehicleDetails from './pages/VehicleDetails'

function App() {
  

  return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element ={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/vehicles' element={<Vehicles />} />
          <Route path='/vehicles/:types' element={<VehicleTypes />} />
          <Route path='/vehicles/:types/:id' element={<VehicleDetails />} />

        </Routes>
      </BrowserRouter>
    
  )
}

export default App
