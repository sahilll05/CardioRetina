import { useState, useEffect } from 'react';
import { Search, Download, Eye, Loader2, RefreshCw, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '@/config/api';
import { usePatients, type PatientData } from '@/hooks/usePatients';

interface AnalysisRecord {
  id: number;
  job_id: string;
  visit_id: number;
  status: string;
  quality_score: number | null;
  av_ratio: number | null;
  dr_grade: number | null;
  risk_level: string | null;
  risk_confidence: number | null;
  report_path: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const RISK_STYLE: Record<string, string> = {
  HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
  MODERATE: 'bg-warning/10 text-warning border-warning/20',
  LOW: 'bg-success/10 text-success border-success/20',
};

const DR_LABELS: Record<number, string> = {
  0: 'No DR', 1: 'Mild NPDR', 2: 'Moderate NPDR', 3: 'Severe NPDR', 4: 'Proliferative DR',
};

export function ReportsList() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'HIGH' | 'MODERATE' | 'LOW'>('all');

  // We'll pull completed analyses by iterating patients + visits
  // Since backend has no /analyses/ list endpoint, we'll use what we have
  const { patients, fetchPatients } = usePatients();

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all patients first
      const pRes = await api.get<PatientData[]>('/patients/', { params: { limit: 200 } });
      const pts = pRes.data;

      // Collect job IDs from analyses via all visits
      // Note: backend has no /analyses/ list — we track locally via localStorage for now
      // and supplement with any job IDs saved from the current session
      const savedJobs: Array<{ job_id: string; patient_name: string }> = JSON.parse(
        localStorage.getItem('cr_completed_jobs') || '[]'
      );

      const results: AnalysisRecord[] = [];
      for (const job of savedJobs) {
        try {
          const aRes = await api.get<any>(`/analysis/${job.job_id}`);
          if (aRes.data.status === 'completed') {
            results.push({ ...aRes.data, _patient_name: job.patient_name });
          }
        } catch {}
      }

      setAnalyses(results);
    } catch {
      // silently handle
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchPatients();
  }, []);

  const filtered = analyses.filter((a) => {
    const matchesFilter = filter === 'all' || a.risk_level === filter;
    const matchesSearch =
      !search ||
      a.job_id.toLowerCase().includes(search.toLowerCase()) ||
      ((a as any)._patient_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and download completed analysis reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button asChild>
            <Link to="/analysis/new"><Plus className="h-4 w-4 mr-2" /> New Analysis</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by job ID or patient..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(['all', 'HIGH', 'MODERATE', 'LOW'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4 border-2 border-dashed rounded-xl">
          <FileText className="h-12 w-12 opacity-30" />
          <div className="text-center">
            <p className="font-medium">No completed analyses yet</p>
            <p className="text-sm mt-1">Complete an analysis to see reports here.</p>
          </div>
          <Button asChild>
            <Link to="/analysis/new"><Plus className="h-4 w-4 mr-2" /> Start First Analysis</Link>
          </Button>
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Job ID</th>
                    <th className="px-5 py-3 text-left font-medium">Risk Level</th>
                    <th className="px-5 py-3 text-left font-medium">DR Grade</th>
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((a) => (
                    <motion.tr
                      key={a.job_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs">{a.job_id}</td>
                      <td className="px-5 py-3">
                        {a.risk_level ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${RISK_STYLE[a.risk_level] || ''}`}>
                            {a.risk_level}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {a.dr_grade != null ? `Grade ${a.dr_grade} — ${DR_LABELS[a.dr_grade]}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-right flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/analysis/${a.job_id}`}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </Button>
                        {a.report_path && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`${API_BASE_URL}${a.report_path}`} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </a>
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
