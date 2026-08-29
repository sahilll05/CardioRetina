import { useState, useEffect } from 'react';
import { Search, Download, Eye, Loader2, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '@/config/api';

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
  HIGH: 'bg-red-500/10 text-red-500 border-red-500/20',
  MODERATE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  LOW: 'bg-primary/10 text-primary border-primary/20',
};

const DR_LABELS: Record<number, string> = {
  0: 'No DR', 1: 'Mild NPDR', 2: 'Moderate NPDR', 3: 'Severe NPDR', 4: 'Proliferative DR',
};

export function ReportsList() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'HIGH' | 'MODERATE' | 'LOW'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all analyses directly from the database API
      const res = await api.get<AnalysisRecord[]>('/analysis/');
      const completed = res.data.filter((a) => a.status === 'completed');
      setAnalyses(completed);
    } catch {
      // silently handle
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-widest text-white uppercase">Analysis Reports</h1>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-primary/20 text-primary/60 hover:text-primary hover:border-primary text-xs uppercase tracking-widest transition-colors flex items-center" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
          </button>
          <Link to="/analysis/new" className="px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-colors flex items-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <Plus className="h-4 w-4 mr-2" /> New Analysis
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-primary/20 bg-black p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <input 
            placeholder="SEARCH RECORDS..." 
            className="w-full pl-10 pr-4 py-2 bg-black border border-primary/30 text-white placeholder-primary/30 focus:outline-none focus:border-primary transition-colors text-xs uppercase tracking-widest" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'HIGH', 'MODERATE', 'LOW'] as const).map((f) => (
            <button
              key={f}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors ${filter === f ? 'bg-primary/20 text-primary border-primary' : 'bg-black text-primary/40 border-primary/20 hover:text-primary hover:border-primary/50'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-primary/40 text-xs tracking-widest uppercase">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Syncing records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-primary/40 gap-4 border border-dashed border-primary/20 bg-black">
          <div className="text-center">
            <p className="font-bold text-xs uppercase tracking-widest">No matching records found.</p>
          </div>
          <Link to="/analysis/new" className="px-4 py-2 border border-primary/40 text-primary hover:bg-primary/10 text-xs tracking-widest uppercase transition-colors flex items-center">
            <Plus className="h-3 h-3 mr-2" /> Initiate Scan
          </Link>
        </div>
      ) : (
        <div className="border border-primary/20 bg-black overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 border-b border-primary/20 text-[10px] text-primary tracking-widest uppercase">
              <tr>
                <th className="px-5 py-4 text-left font-normal">Job ID</th>
                <th className="px-5 py-4 text-left font-normal">Risk Level</th>
                <th className="px-5 py-4 text-left font-normal">DR Grade</th>
                <th className="px-5 py-4 text-left font-normal">Date</th>
                <th className="px-5 py-4 text-right font-normal">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filtered.map((a) => (
                <motion.tr
                  key={a.job_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-primary/5 transition-colors group"
                >
                  <td className="px-5 py-4 text-xs text-white">{a.job_id}</td>
                  <td className="px-5 py-4">
                    {a.risk_level ? (
                      <span className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${RISK_STYLE[a.risk_level] || ''}`}>
                        {a.risk_level}
                      </span>
                    ) : <span className="text-primary/40">—</span>}
                  </td>
                  <td className="px-5 py-4 text-primary/60 text-xs tracking-widest uppercase">
                    {a.dr_grade != null ? `Grade ${a.dr_grade} — ${DR_LABELS[a.dr_grade]}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-primary/60 text-xs tracking-widest uppercase">
                    {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <Link to={`/analysis/${a.job_id}`} className="px-3 py-1 border border-primary/30 text-[10px] tracking-widest uppercase text-primary hover:bg-primary/10 transition-colors flex items-center">
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Link>
                    {a.report_path && (
                      <a href={`${API_BASE_URL}${a.report_path}`} target="_blank" rel="noopener noreferrer" download className="px-3 py-1 border border-primary/30 text-[10px] tracking-widest uppercase text-primary hover:bg-primary/10 transition-colors flex items-center">
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </a>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
