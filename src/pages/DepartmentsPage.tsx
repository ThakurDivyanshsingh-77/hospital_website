import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, Baby, Bone, Brain, Eye, Heart, Stethoscope, Syringe } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

const iconMap: Record<string, typeof Heart> = {
  Heart,
  Brain,
  Bone,
  Baby,
  Stethoscope,
  Eye,
  Syringe,
  Activity,
};

const toAnchorId = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiRequest<{ departments: Department[] }>("/public/departments");
        setDepartments(response.departments || []);
      } catch {
        setDepartments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments().catch(() => {
      setDepartments([]);
      setIsLoading(false);
    });
  }, []);

  const withAnchors = useMemo(
    () =>
      departments.map((department) => ({
        ...department,
        anchor: toAnchorId(department.name),
      })),
    [departments],
  );

  useEffect(() => {
    if (!location.hash || withAnchors.length === 0) {
      return;
    }
    const hashId = location.hash.replace("#", "");
    const target = document.getElementById(hashId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, withAnchors]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-14">
        <section className="container py-10 md:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <Card className="relative overflow-hidden rounded-3xl border-0 bg-hospital-navy p-6 text-white md:p-8">
              <div className="absolute -right-16 -top-10 h-40 w-40 rounded-full border border-white/15" />
              <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-primary/30 blur-3xl" />

              <div className="relative">
                <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/10">Departments</Badge>
                <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">Specialities Built Around Patient Needs</h1>
                <p className="mt-4 max-w-2xl text-white/80">
                  Explore our medical departments with dedicated teams, advanced diagnostics, and outcome-focused
                  treatment pathways.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xl font-bold">{withAnchors.length || "8+"}</p>
                    <p className="text-xs text-white/70">Active specialities</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xl font-bold">24/7</p>
                    <p className="text-xs text-white/70">Emergency coverage</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-xl font-bold">1 Team</p>
                    <p className="text-xs text-white/70">Integrated care model</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link to="/appointment">
                    <Button className="gap-2 bg-white text-hospital-navy hover:bg-white/90">
                      Book Specialist Visit <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-primary/20 p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Department Directory</p>
              <p className="mt-1 text-sm text-muted-foreground">Quick jump to any specialty section.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {withAnchors.slice(0, 8).map((department) => (
                  <a
                    key={department.id}
                    href={`#${department.anchor}`}
                    className="rounded-xl border bg-card px-3 py-2 text-sm text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    {department.name}
                  </a>
                ))}
                {!isLoading && withAnchors.length === 0 && (
                  <p className="rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground">No departments found.</p>
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="container">
          <div className="mb-5 flex flex-wrap gap-2">
            {withAnchors.map((department) => (
              <a
                key={`${department.id}-chip`}
                href={`#${department.anchor}`}
                className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {department.name}
              </a>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse rounded-2xl p-6">
                  <div className="mb-4 h-4 w-28 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
                </Card>
              ))}
            </div>
          ) : withAnchors.length === 0 ? (
            <Card className="rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">No active departments available right now.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {withAnchors.map((department) => {
                const Icon = iconMap[department.icon || ""] || Stethoscope;
                return (
                  <Card
                    id={department.anchor}
                    key={department.id}
                    className="scroll-mt-24 rounded-2xl border-l-4 border-l-primary p-5 shadow-card transition hover:shadow-card-hover"
                  >
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{department.name}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {department.description || "No description available."}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DepartmentsPage;
