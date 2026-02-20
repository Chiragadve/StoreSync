import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import ToastContainer from '@/components/ToastContainer';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import InventoryPage from '@/pages/InventoryPage';
import OrdersPage from '@/pages/OrdersPage';
import ProductsPage from '@/pages/ProductsPage';
import LocationsPage from '@/pages/LocationsPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound';

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  </AppProvider>
);

export default App;
