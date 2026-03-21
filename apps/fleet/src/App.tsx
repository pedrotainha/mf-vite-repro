import { BrowserRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import FleetMfe from './FleetMfe/FleetMfe';
import FleetDetail from './pages/FleetDetail/FleetDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route element={<FleetMfe />} path="/fleet" />
        <Route element={<FleetDetail />} path="/fleet/:vehicleId" />
        <Route element={<FleetMfe />} path="*" />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
