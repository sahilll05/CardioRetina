import { useEffect, useState } from 'react';
import { Users, Activity, AlertTriangle, Plus, Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/config/api';
import { useAuthStore } from '@/auth/authStore';
import { useWsStore } from '@/store/wsStore';
import { AlertsTicker } from '@/components/dashboard/AlertsTicker';
import { RetinalGridShader } from '@/components/shaders/RetinalGridShader';
import type { PatientData } from '@/hooks/usePatients';

function StatBlock({ title, value, icon: Icon, accent }: { title: string; value: string | number; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={`p-6 border border-primary/20 bg-black/50 backdrop-blur-md rounded-xl ${accent ? 'shadow-[0_0_15px_rgba(34,197,94,0.15)] border-primary/40' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${accent ? 'text-green-400' : 'text-primary/70'}`} />
        <span className="text-primary/60 text-sm font-medium tracking-wide uppercase">{title}</span>
      </div>
      <div className={`text-4xl font-light tracking-tight ${accent ? 'text-white' : 'text-primary'}`}>
        {value}
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
    <div className="relative min-h-[calc(100vh-6rem)]">
      {/* Background Shader */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <RetinalGridShader />
      </div>

      <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AlertsTicker />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light text-white tracking-tight">
              Welcome, <span className="text-primary font-medium">{user?.name?.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-primary/60 text-sm">System Online</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={loadData} 
              disabled={loading}
              className="px-4 py-2 text-primary/70 border border-primary/30 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <Link 
              to="/analysis/new"
              className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-colors flex items-center"
            >
              <Plus className="mr-2 h-5 w-5" /> Analyze Scan
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatBlock title="Registered Patients" value={loading ? '—' : totalPatients} icon={Users} />
          <StatBlock title="Avg Processing" value="~5m" icon={Activity} />
          <StatBlock title="Active Alerts" value={highRiskCount} icon={AlertTriangle} accent={highRiskCount > 0} />
        </div>

        {/* Minimalist Patient Table */}
        <div className="mt-8">
          <h2 className="text-xl font-light text-primary/80 mb-4 tracking-wide uppercase">Recent Patients</h2>
          <div className="border border-primary/20 bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-primary/50">
                <RefreshCw className="animate-spin h-5 w-5 mr-2" /> Syncing records...
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-primary/40 gap-3">
                <p>No records found.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-primary/5 text-primary/60 border-b border-primary/20 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Patient Name</th>
                    <th className="px-6 py-4 font-medium">Age</th>
                    <th className="px-6 py-4 font-medium">Identifier</th>
                    <th className="px-6 py-4 font-medium text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {patients.slice(0, 8).map((p) => (
                    <tr key={p.patient_id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                      <td className="px-6 py-4 text-primary/70">{p.age}</td>
                      <td className="px-6 py-4 text-primary/50 font-mono text-xs">{p.patient_id}</td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/patients/${p.patient_id}`}
                          className="inline-flex items-center justify-center h-8 w-8 text-primary/40 group-hover:text-primary transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && patients.length > 0 && (
            <div className="mt-4 text-center">
              <Link to="/patients" className="text-primary/60 hover:text-primary text-sm transition-colors">
                View Directory →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
