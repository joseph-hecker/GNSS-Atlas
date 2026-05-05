import AppLayout from './layout/AppLayout';
import AppRoutes from './AppRoutes';
import { LocationProvider } from './state/LocationContext';
import { GeometryProvider } from './state/GeometryContext';
import { ToolModeProvider } from './state/ToolModeContext';

export default function App() {
  return (
    <LocationProvider>
      <GeometryProvider>
        <ToolModeProvider>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </ToolModeProvider>
      </GeometryProvider>
    </LocationProvider>
  );
}
