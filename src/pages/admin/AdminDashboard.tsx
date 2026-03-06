import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays, Building2, Clock, TrendingUp, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiRequest } from "@/lib/api";

interface Stats {
  totalDoctors: number;
  totalAppointments: number;
  totalDepartments: number;
  pendingAppointments: number;
  monthlyAppointments?: { month: string; count: number }[];
  statusBreakdown?: { status: string; count: number }[];
  doctorWiseAppointments?: { doctorId: string; doctorName: string; count: number }[];
}

interface RecentAppointment {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  notes: string;
  doctor: { fullName: string } | null;
  patient: { fullName: string; email: string } | null;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalDoctors: 0,
    totalAppointments: 0,
    totalDepartments: 0,
    pendingAppointments: 0,
    monthlyAppointments: [],
    statusBreakdown: [],
    doctorWiseAppointments: [],
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiRequest<{
        stats: Stats;
        recentAppointments: RecentAppointment[];
      }>("/admin/dashboard");

      setStats(response.stats);
      setRecentAppointments(response.recentAppointments || []);
    };
    fetchData().catch(() => {});
  }, []);

  const monthlyData = stats.monthlyAppointments || [];
  const statusData = stats.statusBreakdown || [];
  const doctorData = stats.doctorWiseAppointments || [];

  const acceptedCount = statusData.find((item) => item.status === "accepted")?.count || 0;

  const completionRate = stats.totalAppointments
    ? Math.round((acceptedCount / stats.totalAppointments) * 100)
    : 0;

  const statCards = [
    {
      label: "Doctors",
      value: stats.totalDoctors,
      icon: Users,
      tone: "from-violet-50 to-purple-50",
      iconColor: "text-violet-700",
      meta: "Registered specialists",
    },
    {
      label: "Appointments",
      value: stats.totalAppointments,
      icon: CalendarDays,
      tone: "from-indigo-50 to-violet-50",
      iconColor: "text-violet-700",
      meta: "All-time bookings",
    },
    {
      label: "Departments",
      value: stats.totalDepartments,
      icon: Building2,
      tone: "from-fuchsia-50 to-purple-50",
      iconColor: "text-fuchsia-700",
      meta: "Operational units",
    },
    {
      label: "Pending",
      value: stats.pendingAppointments,
      icon: Clock,
      tone: "from-rose-50 to-red-50",
      iconColor: "text-rose-700",
      meta: "Needs review",
    },
  ];

  const pieColors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c084fc", "#e879f9"];

  const statusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-violet-100 text-violet-700";
      case "rejected":
      case "cancelled":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-purple-100 text-purple-700";
    }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Operational overview across doctors, bookings, and patient flow">
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.45fr,1fr]">
          <Card className="relative overflow-hidden border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-violet-200/35 blur-2xl" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operations Pulse</p>
            <h2 className="max-w-xl text-xl font-bold leading-tight text-slate-900">
              Keep clinical operations balanced with live appointment and staffing insights.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Monitor trends, identify bottlenecks, and move quickly on pending requests from a single admin hub.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge className="rounded-md bg-violet-100 text-violet-700 hover:bg-violet-100">Real-time dashboard</Badge>
              <Badge variant="secondary" className="rounded-md bg-slate-100 text-slate-600">
                Updated from backend analytics
              </Badge>
            </div>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Appointment Outcome</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
                <p className="text-sm text-slate-600">Accepted bookings rate</p>
              </div>
              <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <Activity className="h-3.5 w-3.5 text-violet-600" />
              {acceptedCount} accepted appointments out of {stats.totalAppointments}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item, index) => (
            <Card
              key={item.label}
              className="group border-slate-200/80 bg-white/90 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone}`}>
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900">Monthly Appointments</p>
              <p className="text-xs text-slate-500">Track monthly booking momentum</p>
            </div>
            <div className="h-72">
              {monthlyData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                  No monthly data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900">Status Distribution</p>
              <p className="text-xs text-slate-500">Current lifecycle of appointments</p>
            </div>
            <div className="h-72">
              {statusData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                  No status data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={94} label>
                      {statusData.map((_, index) => (
                        <Cell key={`status-cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900">Doctor-wise Appointments</p>
              <p className="text-xs text-slate-500">Compare doctor workload distribution</p>
            </div>
            <div className="h-72">
              {doctorData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                  No doctor data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doctorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="doctorName"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={72}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Appointments</h2>
              <p className="text-xs text-slate-500">Latest patient bookings for quick review</p>
            </div>
            <Badge variant="secondary" className="rounded-md bg-slate-100 text-slate-600">
              {recentAppointments.length} records
            </Badge>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No recent appointments found.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{appointment.patient?.fullName || "N/A"}</p>
                        <p className="text-xs text-slate-500">{appointment.patient?.email || "No email"}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${statusColor(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <p className="text-slate-500">
                        Doctor: <span className="font-medium text-slate-700">{appointment.doctor?.fullName || "N/A"}</span>
                      </p>
                      <p className="text-slate-500">
                        Slot: <span className="font-medium text-slate-700">{appointment.timeSlot}</span>
                      </p>
                      <p className="col-span-2 text-slate-500">
                        Date: <span className="font-medium text-slate-700">{appointment.appointmentDate}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3 pr-4">Patient</th>
                      <th className="pb-3 pr-4">Doctor</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Time</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-900">{appointment.patient?.fullName || "N/A"}</p>
                          <p className="text-xs text-slate-500">{appointment.patient?.email || "No email"}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{appointment.doctor?.fullName || "N/A"}</td>
                        <td className="py-3 pr-4 text-slate-600">{appointment.appointmentDate}</td>
                        <td className="py-3 pr-4 text-slate-600">{appointment.timeSlot}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusColor(appointment.status)}`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
