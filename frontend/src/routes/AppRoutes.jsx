import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import InventoryPage from "../pages/Inventory/InventoryPage";
import InventoryFormPage from "../pages/Inventory/InventoryFormPage";
import CustomersPage from "../pages/Customers/CustomersPage";
import CustomerDetailPage from "../pages/Customers/CustomerDetailPage";
import OrdersPage from "../pages/Orders/OrdersPage";
import CreateOrderPage from "../pages/Orders/CreateOrderPage";
import OrderDetailPage from "../pages/Orders/OrderDetailPage";
import InvoicesPage from "../pages/Invoices/InvoicesPage";
import InvoiceDetailPage from "../pages/Invoices/InvoiceDetailPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import SettingsPage from "../pages/Settings/SettingsPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "inventory/new", element: <InventoryFormPage /> },
      { path: "inventory/:id/edit", element: <InventoryFormPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/:id", element: <CustomerDetailPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/new", element: <CreateOrderPage /> },
      { path: "orders/:id", element: <OrderDetailPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "invoices/:id", element: <InvoiceDetailPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
