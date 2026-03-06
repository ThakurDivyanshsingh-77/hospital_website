import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

const ALL_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  departmentId: string | null;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const PublicBookAppointment = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiRequest<{ departments: Department[]; doctors: Doctor[] }>("/public/book-meta");
      setDepartments(response.departments || []);
      setAllDoctors(response.doctors || []);
    };

    fetchData().catch(() => toast.error("Failed to load booking options"));
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!departmentId || departmentId === "all") {
      return allDoctors;
    }
    return allDoctors.filter((doctor) => doctor.departmentId === departmentId);
  }, [departmentId, allDoctors]);

  useEffect(() => {
    setDoctorId("");
  }, [departmentId]);

  useEffect(() => {
    if (!doctorId || !date) {
      setBookedSlots([]);
      return;
    }

    const fetchBooked = async () => {
      const dateText = format(date, "yyyy-MM-dd");
      const response = await apiRequest<{ bookedSlots: string[] }>(
        `/public/booked-slots?doctorId=${doctorId}&date=${dateText}`
      );
      setBookedSlots(response.bookedSlots || []);
    };

    fetchBooked().catch(() => setBookedSlots([]));
    setTimeSlot("");
  }, [doctorId, date]);

  const availableSlots = useMemo(() => {
    return ALL_SLOTS.map((slot) => ({
      slot,
      available: !bookedSlots.includes(slot),
    }));
  }, [bookedSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date || !timeSlot || !fullName.trim() || !email.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const appointmentDate = format(date, "yyyy-MM-dd");
      await apiRequest("/public/appointments", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          doctorId,
          departmentId: departmentId && departmentId !== "all" ? departmentId : null,
          appointmentDate,
          timeSlot,
          notes: notes.trim(),
        }),
      });
      setSuccess(true);
      toast.success("Appointment booked successfully!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to book appointment"));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container py-16">
          <Card className="mx-auto max-w-lg border-slate-200/80 bg-white/95 p-12 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-violet-600" />
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Appointment Booked!</h2>
            <p className="text-slate-500">
              Your appointment request has been submitted. We will confirm the slot shortly over email/phone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => {
                  setSuccess(false);
                  setDate(undefined);
                  setTimeSlot("");
                  setNotes("");
                }}
              >
                Book Another
              </Button>
              <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50" onClick={() => window.location.assign("/")}>
                Back Home
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Appointments</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Book an Appointment</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Choose a doctor, pick a date and time, and share your contact details. No sign-in required.
            </p>
          </div>

          <Card className="border-slate-200/80 bg-white/95 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="mt-1.5 border-slate-200">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Doctor *</Label>
                  <Select value={doctorId} onValueChange={setDoctorId} required>
                    <SelectTrigger className="mt-1.5 border-slate-200">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No doctors available</div>
                      ) : (
                        filteredDoctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.fullName} - {doctor.specialty}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preferred Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("mt-1.5 w-full justify-start border-slate-200 text-left font-normal", !date && "text-slate-500")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(selectedDate) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return selectedDate < today || selectedDate.getDay() === 0;
                        }}
                        initialFocus
                        className="pointer-events-auto p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {doctorId && date && (
                <div>
                  <Label className="mb-2 block">Time Slot *</Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableSlots.map(({ slot, available }) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={timeSlot === slot ? "default" : "outline"}
                        className={cn(
                          "border-slate-200 text-sm",
                          available ? "" : "cursor-not-allowed border-dashed text-slate-400 line-through"
                        )}
                        disabled={!available}
                        onClick={() => setTimeSlot(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Symptoms, concerns, or context for the doctor (optional)"
                  className="mt-1.5 border-slate-200"
                  rows={4}
                />
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? "Booking..." : "Book Appointment"}
              </Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicBookAppointment;
