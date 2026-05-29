import { SidebarProvider } from "./context/SidebarContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <SidebarProvider>
      <AppRoutes />
    </SidebarProvider>
  );
}
