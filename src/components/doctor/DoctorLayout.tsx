import { ReactNode, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import DoctorSidebar from "./DoctorSidebar";
import { useAuth } from "@/hooks/useAuth";

interface DoctorLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const routeNames: Record<string, string> = {
  "/doctor": "Dashboard",
  "/doctor/appointments": "Appointments",
  "/doctor/availability": "Availability",
};

const DoctorLayout = ({ children, title, subtitle }: DoctorLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const sectionName = useMemo(() => routeNames[location.pathname] || "Doctor", [location.pathname]);

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full overflow-hidden bg-slate-100">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-24 h-72 w-72 rounded-full bg-fuchsia-200/30 blur-3xl" />

        <DoctorSidebar />

        <div className="relative flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-h-16 items-center gap-3 py-3">
              <SidebarTrigger className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">CareConnect Doctor</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
                  <Badge variant="secondary" className="rounded-md bg-violet-100 text-violet-700">
                    {sectionName}
                  </Badge>
                </div>
                {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
              </div>
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor</p>
                  <p className="max-w-40 truncate text-sm font-medium text-slate-800">{user?.email || "doctor@careconnect"}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="relative flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DoctorLayout;
