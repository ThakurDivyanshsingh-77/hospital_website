import { useEffect, useState } from "react";
import DoctorLayout from "@/components/doctor/DoctorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface DashboardStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

interface UpcomingAppointment {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  patient: { fullName: string } | null;
}

const DoctorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiRequest<{
        stats: DashboardStats;
        upcoming: UpcomingAppointment[];
      }>("/doctor/dashboard");

      setStats(response.stats);
      setUpcoming(response.upcoming || []);
    };

    fetchData().catch(() => {});
  }, []);

  const statCards = [
    { label: "Total", value: stats.total, icon: CalendarDays, color: "text-violet-700" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-purple-700" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "text-violet-700" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
  ];

  const statusColor = (status: string) => {
    if (status === "accepted") return "bg-violet-100 text-violet-700";
    if (status === "rejected" || status === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <DoctorLayout title="Dashboard" subtitle="Overview of your appointments">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-slate-200/80 bg-white/95 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{appointment.patient?.fullName || "Patient"}</p>
                    <p className="text-xs text-slate-500">{appointment.appointmentDate} - {appointment.timeSlot}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
