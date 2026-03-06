import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PatientLayout from "@/components/patient/PatientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CheckCircle, XCircle, CalendarPlus } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Stats {
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
  doctor: { fullName: string; specialty: string } | null;
  department: { name: string } | null;
}

const PatientDashboard = () => {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await apiRequest<{ stats: Stats; upcoming: UpcomingAppointment[] }>("/patient/dashboard");
      setStats(response.stats);
      setUpcoming(response.upcoming || []);
    };

    fetchDashboard().catch(() => {});
  }, []);

  const statCards = [
    { label: "Total Appointments", value: stats.total, icon: CalendarDays, color: "text-violet-700" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-purple-700" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "text-violet-700" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
  ];

  const statusColor = (status: string) => {
    if (status === "accepted") return "bg-violet-100 text-violet-700";
    if (status === "pending") return "bg-purple-100 text-purple-700";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <PatientLayout title="Dashboard" subtitle="Your health overview">
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.label} className="flex items-center gap-4 border-slate-200/80 bg-white/95 p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-violet-50 ${item.color}`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white/95 p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
            <Link to="/patient/book">
              <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700">
                <CalendarPlus className="h-4 w-4" /> Book New
              </Button>
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No upcoming appointments. Book one now!</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <div>
                    <p className="font-medium text-slate-900">{appointment.doctor?.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {appointment.doctor?.specialty} - {appointment.department?.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {appointment.appointmentDate} at {appointment.timeSlot}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-slate-200/80 bg-white/95 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/patient/book" className="block">
              <Button variant="outline" className="w-full justify-start gap-2 border-violet-200 text-violet-700 hover:bg-violet-50">
                <CalendarPlus className="h-4 w-4" /> Book Appointment
              </Button>
            </Link>
            <Link to="/patient/appointments" className="block">
              <Button variant="outline" className="w-full justify-start gap-2 border-violet-200 text-violet-700 hover:bg-violet-50">
                <CalendarDays className="h-4 w-4" /> View History
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;
