import { Toaster } from 'react-hot-toast';
import { SidebarProvider } from "./context/SidebarContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <SidebarProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: {
            duration: 3000,
            style: {
              border: '1px solid #10B981',
              background: '#FFFFFF',
              color: '#1A1F2E',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            duration: 5000,
            style: {
              border: '1px solid #EF4444',
              background: '#FFFFFF',
              color: '#1A1F2E',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
          loading: {
            style: {
              border: '1px solid #1B3A5C',
              background: '#FFFFFF',
              color: '#1A1F2E',
            },
            iconTheme: {
              primary: '#1B3A5C',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <AppRoutes />
    </SidebarProvider>
  );
}
