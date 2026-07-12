import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Vehicles from './pages/Vehicles.jsx'
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
