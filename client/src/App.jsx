import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LiveMap from './pages/LiveMap.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Recommendations from './pages/Recommendations.jsx'
import MyHome from './pages/MyHome.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="map" element={<LiveMap />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="home" element={<MyHome />} />
      </Route>
    </Routes>
  )
}

export default App
