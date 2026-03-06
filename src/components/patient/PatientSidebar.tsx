import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  LogOut,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Overview",
    url: "/patient",
    icon: LayoutDashboard,
    subtitle: "Health summary",
  },
  {
    title: "Book Appointment",
    url: "/patient/book",
    icon: CalendarPlus,
    subtitle: "New consultation",
  },
  {
    title: "My Appointments",
    url: "/patient/appointments",
    icon: CalendarDays,
    subtitle: "History and reports",
  },
];

const PatientSidebar = () => {
  const { signOut } = useAuth();
  const sidebar = useSidebar();
  const collapsed = sidebar.state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="floating" className="p-2">
      <SidebarHeader className="p-2">
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">Patient Portal</p>
                <p className="truncate text-xs text-slate-500">CareConnect Access</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-violet-50 px-2.5 py-2 text-xs text-violet-700">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              Health journey dashboard
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2">
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="h-auto rounded-xl p-0">
                    <NavLink
                      to={item.url}
                      end={item.url === "/patient"}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-800"
                      activeClassName="bg-violet-100/80 font-semibold text-violet-900 shadow-[inset_0_0_0_1px_rgba(109,40,217,0.22)]"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <p className="truncate text-sm">{item.title}</p>
                        <p className="truncate text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarSeparator className="mx-0 mb-2 bg-slate-200" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="h-10 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              tooltip="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default PatientSidebar;
