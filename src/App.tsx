import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Dashboard from "./pages/Dashboard";
import ProductGroups from "./pages/ProductGroups";
import ProductList from "./pages/products/ProductList";
import ProductCreate from "./pages/products/ProductCreate";
import ProductDetail from "./pages/products/ProductDetail";
import ImportList from "./pages/imports/ImportList";
import ImportCreate from "./pages/imports/ImportCreate";
import ImportDetail from "./pages/imports/ImportDetail";
import CreateSale from "./pages/CreateSale";
import Sales from "./pages/Sales";
import SalesOrderDetail from "./pages/sales/SalesOrderDetail";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/product-groups" element={<ProductGroups />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/create" element={<ProductCreate />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/imports" element={<ImportList />} />
            <Route path="/imports/create" element={<ImportCreate />} />
            <Route path="/imports/:id" element={<ImportDetail />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/create" element={<CreateSale />} />
            <Route path="/sales/:id" element={<SalesOrderDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;
