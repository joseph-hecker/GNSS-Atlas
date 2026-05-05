import { Navigate, Route, Routes } from 'react-router-dom';
import SkySection from './sections/sky/SkySection';
import CompareSection from './sections/compare/CompareSection';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sky" replace />} />
      <Route path="/sky" element={<SkySection />} />
      <Route path="/compare" element={<CompareSection />} />
      <Route path="*" element={<Navigate to="/sky" replace />} />
    </Routes>
  );
}
