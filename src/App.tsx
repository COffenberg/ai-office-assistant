
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPortal from "./pages/AuthPortal";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import LandingMenu from "./pages/LandingMenu";
import Hub from "./pages/Hub";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<AuthPortal />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
              <Route 
                path="/menu" 
                element={
                  <ProtectedRoute>
                    <LandingMenu />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hub" 
                element={
                  <ProtectedRoute>
                    <Hub />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard onBack={() => window.history.back()} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employee" 
                element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeeDashboard onBack={() => window.history.back()} />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
