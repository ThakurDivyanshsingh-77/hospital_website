import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DoctorsPage from "./pages/DoctorsPage";
import AppointmentPage from "./pages/AppointmentPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import FeedbackPage from "./pages/FeedbackPage";
import DirectorsDeskPage from "./pages/DirectorsDeskPage";
import PatientCornerPage from "./pages/PatientCornerPage";
import AcademicsPage from "./pages/AcademicsPage";
import CareersPage from "./pages/CareersPage";
import GalleryPage from "./pages/GalleryPage";
import HealthPackagesPage from "./pages/HealthPackagesPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import PublicBookAppointment from "./pages/PublicBookAppointment";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminGallery from "./pages/admin/AdminGallery";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorAvailability from "./pages/doctor/DoctorAvailability";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/appointment" element={<AppointmentPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/directors-desk" element={<DirectorsDeskPage />} />
            <Route path="/patient-corner" element={<PatientCornerPage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/health-packages" element={<HealthPackagesPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/book" element={<PublicBookAppointment />} />
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="admin"><AdminDoctors /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute requiredRole="admin"><AdminAppointments /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute requiredRole="admin"><AdminDepartments /></ProtectedRoute>} />
            <Route path="/admin/gallery" element={<ProtectedRoute requiredRole="admin"><AdminGallery /></ProtectedRoute>} />
            {/* Doctor routes */}
            <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="doctor"><DoctorAppointments /></ProtectedRoute>} />
            <Route path="/doctor/availability" element={<ProtectedRoute requiredRole="doctor"><DoctorAvailability /></ProtectedRoute>} />
            {/* Legacy patient routes -> redirect to public booking */}
            <Route path="/patient/*" element={<Navigate to="/book" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
