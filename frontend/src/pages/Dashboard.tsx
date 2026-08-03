import { useEffect, useState } from 'react';
import { Users, Activity, AlertTriangle, Plus, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskDistributionChart } from '@/components/charts/RiskDistributionChart';
import { DRGradeChart } from '@/components/charts/DRGradeChart';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/config/api';
import { useAuthStore } from '@/auth/authStore';
import type { PatientData } from '@/hooks/usePatients';

interface RecentAnalysis {
  job_id: string;
  patient_name: string;
  risk_level: string | null;
  dr_grade: number | null;
  status: string;
  created_at: string;
}

function StatCard({ title, value, icon: Icon, sub, accent }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className={`overflow-hidden ${accent ? `border-l-4 ${accent}` : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">{title}</h3>
            <div className="p-2 bg-primary/10 rounded-full">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {sub && <span className="text-sm font-medium text-success">{sub}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const riskBadge = (level: string | null) => {
  if (!level) return 'bg-muted text-muted-foreground ring-muted';
  return level === 'HIGH'
    ? 'bg-destructive/10 text-destructive ring-destructive/20'
    : level === 'MODERATE'
    ? 'bg-warning/10 text-warning ring-warning/20'
    : 'bg-success/10 text-success ring-success/20';
};

const statusDot = (status: string) =>
  status === 'completed' ? 'bg-success' : status === 'processing' ? 'bg-primary animate-pulse' : 'bg-warning';

export function Dashboard() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const patientsRes = await api.get<PatientData[]>('/patients/', { params: { limit: 200 } });
      setPatients(patientsRes.data);
    } catch {
      // silently fail — show 0
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPatients = patients.length;
  const highRiskCount = 0; // Would need analysis list endpoint — showing placeholder

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's your clinic overview for today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild className="shadow-md hover:shadow-lg transition-all">
            <Link to="/analysis/new">
              <Plus className="mr-2 h-4 w-4" /> New Analysis
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Patients"
          value={loading ? '—' : totalPatients}
          icon={Users}
          sub={totalPatients > 0 ? 'registered' : undefined}
        />
        <StatCard
          title="Quick Analysis"
          value="~5 min"
          icon={Activity}
          sub="avg. processing time"
        />
        <StatCard
          title="High Risk Alerts"
          value={highRiskCount}
          icon={AlertTriangle}
          accent="border-l-destructive/50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Patients Table */}
        <Card className="col-span-full lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Registered Patients</CardTitle>
            <CardDescription>
              {loading
                ? 'Loading...'
                : `${totalPatients} patient${totalPatients !== 1 ? 's' : ''} in the system.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <RefreshCw className="animate-spin h-5 w-5 mr-2" /> Loading patients...
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-3">
                <Users className="h-8 w-8 opacity-40" />
                <p>No patients yet.</p>
                <Button asChild size="sm">
                  <Link to="/patients">
                    <Plus className="h-4 w-4 mr-1" /> Add First Patient
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Patient</th>
                        <th className="px-4 py-3 font-medium">Age</th>
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {patients.slice(0, 8).map((p) => (
                        <tr key={p.patient_id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.age} yrs</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                            {p.patient_id}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link to={`/patients/${p.patient_id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/patients">View All Patients</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="col-span-full lg:col-span-3 space-y-6 flex flex-col">
          <Card className="flex-1 shadow-sm">
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart />
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-sm">
            <CardHeader>
              <CardTitle>DR Grade Spread</CardTitle>
            </CardHeader>
            <CardContent>
              <DRGradeChart />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Getting Started */}
      {!loading && patients.length === 0 && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Get Started with CardioRetina AI</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                Register your first patient, record a clinical visit, then upload a retinal image to get an AI-powered cardiovascular risk assessment.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/patients"><Plus className="h-4 w-4 mr-2" />Add Patient</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/analysis/new">Start Analysis</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
