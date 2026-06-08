import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const InventoryPage = lazy(() => import("../pages/Inventory/InventoryPage"));
const InventoryFormPage = lazy(() => import("../pages/Inventory/InventoryFormPage"));
const CustomersPage = lazy(() => import("../pages/Customers/CustomersPage"));
const CustomerDetailPage = lazy(() => import("../pages/Customers/CustomerDetailPage"));
const OrdersPage = lazy(() => import("../pages/Orders/OrdersPage"));
const CreateOrderPage = lazy(() => import("../pages/Orders/CreateOrderPage"));
const OrderDetailPage = lazy(() => import("../pages/Orders/OrderDetailPage"));
const InvoicesPage = lazy(() => import("../pages/Invoices/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("../pages/Invoices/InvoiceDetailPage"));
const ReportsPage = lazy(() => import("../pages/Reports/ReportsPage"));
const SettingsPage = lazy(() => import("../pages/Settings/SettingsPage"));

const router = createBrowserRouter([
  { 
    path: "/login", 
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    ) 
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { 
        path: "dashboard", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardPage />
          </Suspense>
        ) 
      },
      { 
        path: "inventory", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InventoryPage />
          </Suspense>
        ) 
      },
      { 
        path: "inventory/new", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InventoryFormPage />
          </Suspense>
        ) 
      },
      { 
        path: "inventory/:id/edit", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InventoryFormPage />
          </Suspense>
        ) 
      },
      { 
        path: "customers", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CustomersPage />
          </Suspense>
        ) 
      },
      { 
        path: "customers/:id", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CustomerDetailPage />
          </Suspense>
        ) 
      },
      { 
        path: "orders", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <OrdersPage />
          </Suspense>
        ) 
      },
      { 
        path: "orders/new", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CreateOrderPage />
          </Suspense>
        ) 
      },
      { 
        path: "orders/:id", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <OrderDetailPage />
          </Suspense>
        ) 
      },
      { 
        path: "invoices", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InvoicesPage />
          </Suspense>
        ) 
      },
      { 
        path: "invoices/:id", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InvoiceDetailPage />
          </Suspense>
        ) 
      },
      { 
        path: "reports", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ReportsPage />
          </Suspense>
        ) 
      },
      { 
        path: "settings", 
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsPage />
          </Suspense>
        ) 
      },
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
