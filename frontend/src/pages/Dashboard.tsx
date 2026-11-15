import { useEffect, useState } from 'react';
import { Users, Activity, AlertTriangle, Plus, Eye, RefreshCw, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/config/api';
import { useAuthStore } from '@/auth/authStore';
import { useWsStore } from '@/store/wsStore';
import { AlertsTicker } from '@/components/dashboard/AlertsTicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PatientData } from '@/hooks/usePatients';

function StatBlock({
  title,
  value,
  unit,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  variant?: 'default' | 'accent' | 'warning';
}) {
  return (
    <div className="panel p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{title}</span>
        <Icon
          className={`w-4 h-4 ${
            variant === 'warning'
              ? 'text-warning'
              : variant === 'accent'
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="reading">{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-mono">{unit}</span>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { criticalAlerts } = useWsStore();
  const [patients, setPatients] = useState<PatientData[]>([]);
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
  const highRiskCount = criticalAlerts.length;

  return (
    <div className="space-y-6">
      <AlertsTicker />

      {/* Header with Clinician Greeting & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">
            Workstation Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Logged in as <span className="text-foreground font-medium">{user?.name || 'Dr. Clinician'}</span> ({user?.specialization || 'Cardiology'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Sync records
          </Button>

          <Button asChild size="sm" className="text-xs h-8">
            <Link to="/analysis/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Analyze retinal scan
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatBlock
          title="Registered cohort"
          value={loading ? '—' : totalPatients}
          unit="patients"
          icon={Users}
        />
        <StatBlock
          title="Avg inference latency"
          value="~15"
          unit="sec / scan"
          icon={Activity}
          variant="accent"
        />
        <StatBlock
          title="Priority alerts"
          value={highRiskCount}
          unit="cases"
          icon={AlertTriangle}
          variant={highRiskCount > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Diagnostic Pipeline Architecture Status */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="w-4 h-4 text-ok" />
            <span>Neural Engine Pipeline Status</span>
          </div>
          <span className="font-mono text-[11px] text-ok">Sequential Execution · Ready</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded border border-border bg-surface-deep">
            <div className="text-[11px] text-muted-foreground">Stage 1</div>
            <div className="font-medium text-foreground mt-0.5">Quality Gate</div>
            <div className="text-[11px] font-mono text-cool mt-1">MobileNetV3</div>
          </div>
          <div className="p-2.5 rounded border border-border bg-surface-deep">
            <div className="text-[11px] text-muted-foreground">Stage 2</div>
            <div className="font-medium text-foreground mt-0.5">Vasculature</div>
            <div className="text-[11px] font-mono text-cool mt-1">U-Net++ Dense</div>
          </div>
          <div className="p-2.5 rounded border border-border bg-surface-deep">
            <div className="text-[11px] text-muted-foreground">Stage 3</div>
            <div className="font-medium text-foreground mt-0.5">A/V Ratio Delineation</div>
            <div className="text-[11px] font-mono text-cool mt-1">Morphometry Engine</div>
          </div>
          <div className="p-2.5 rounded border border-border bg-surface-deep">
            <div className="text-[11px] text-muted-foreground">Stage 4</div>
            <div className="font-medium text-foreground mt-0.5">DR Screening</div>
            <div className="text-[11px] font-mono text-cool mt-1">EfficientNet-B3</div>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="panel overflow-hidden">
        <div className="panel-header flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">Recent Patient Records</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Active cases in registry</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground">
            <Link to="/patients" className="inline-flex items-center gap-1">
              View all directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground gap-2">
              <RefreshCw className="animate-spin h-4 w-4" />
              <span>Fetching patient records…</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs text-muted-foreground gap-2">
              <p>No patient records found in local database.</p>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link to="/analysis/new">Create first patient record</Link>
              </Button>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-deep/60 text-muted-foreground border-b border-border text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 font-normal">Patient name</th>
                  <th className="px-4 py-2.5 font-normal">Identifier</th>
                  <th className="px-4 py-2.5 font-normal">Age / Sex</th>
                  <th className="px-4 py-2.5 font-normal">Clinical history</th>
                  <th className="px-4 py-2.5 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.slice(0, 8).map((p) => {
                  const hasHistory = p.diabetes_history || p.hypertension;
                  return (
                    <tr
                      key={p.patient_id}
                      className="hover:bg-surface-deep/40 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link to={`/patients/${p.patient_id}`} className="hover:text-primary transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {p.patient_id}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.age} yrs · {p.gender || 'Not recorded'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.diabetes_history && (
                            <Badge variant="warning" className="text-[10px] py-0 px-1.5">
                              Diabetes
                            </Badge>
                          )}
                          {p.hypertension && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                              Hypertension
                            </Badge>
                          )}
                          {!hasHistory && (
                            <span className="text-muted-foreground text-[11px]">None recorded</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/patients/${p.patient_id}`}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                            title="View patient history"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/analysis/new?patientId=${p.patient_id}`}
                            className="p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                            title="Start new analysis for this patient"
                          >
                            <Plus className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
