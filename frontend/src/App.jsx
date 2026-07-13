import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Vehicles from './pages/Vehicles.jsx'
import VehicleTypes from './pages/VehicleTypes.jsx'
import VehicleDetails from './pages/VehicleDetails.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MyBookings from './pages/MyBookings.jsx'
import HostDashboard from './pages/host/HostDashboard.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="vehicles" element={<Vehicles />} />
          {/* Static "types" segment must be listed above the dynamic
              "vehicles/:id" route so it isn't swallowed as an :id match —
              React Router ranks static segments higher regardless of
              declaration order, but keeping it above is clearer to read. */}
          <Route path="vehicles/types" element={<VehicleTypes />} />
          <Route path="vehicles/:id" element={<VehicleDetails />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route element={<ProtectedRoute role="renter" />}>
            <Route path="my-bookings" element={<MyBookings />} />
          </Route>

          <Route element={<ProtectedRoute role="host" />}>
            <Route path="host" element={<HostDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
