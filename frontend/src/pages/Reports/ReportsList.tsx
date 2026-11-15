import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Eye, Loader2, RefreshCw, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, API_BASE_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  _patient_name?: string;
}

const DR_LABELS: Record<number, string> = {
  0: 'No DR',
  1: 'Mild NPDR',
  2: 'Moderate NPDR',
  3: 'Severe NPDR',
  4: 'Proliferative DR',
};

export function ReportsList() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'HIGH' | 'MODERATE' | 'LOW'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AnalysisRecord[]>('/analysis/');
      const completed = res.data.filter((a) => a.status === 'completed');
      setAnalyses(completed);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get<AnalysisRecord[]>('/analysis/')
      .then((res) => {
        if (active) {
          setAnalyses(res.data.filter((a) => a.status === 'completed'));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = analyses.filter((a) => {
    const matchesFilter = filter === 'all' || a.risk_level === filter;
    const matchesSearch =
      !search ||
      a.job_id.toLowerCase().includes(search.toLowerCase()) ||
      (a._patient_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">
            Diagnostic Reports Archive
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Completed retinal analysis jobs and generated clinical PDF reports
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
            Sync archive
          </Button>

          <Button asChild size="sm" className="text-xs h-8">
            <Link to="/analysis/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search report by job ID or patient…"
            className="w-full pl-9 pr-3 py-1.5 bg-surface-deep border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-border-strong text-xs rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'HIGH', 'MODERATE', 'LOW'] as const).map((f) => {
            const isSelected = filter === f;
            const label =
              f === 'all'
                ? 'All reports'
                : f === 'HIGH'
                ? 'High risk'
                : f === 'MODERATE'
                ? 'Moderate risk'
                : 'Low risk';

            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs rounded transition-colors duration-150 border ${
                  isSelected
                    ? 'border-border-strong bg-surface text-foreground font-medium shadow-sm'
                    : 'border-transparent text-muted-foreground hover:bg-surface-deep hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Fetching completed reports…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-8 text-center text-muted-foreground text-xs space-y-3">
          <FileText className="w-8 h-8 text-muted-foreground/60 mx-auto" />
          <p>
            {search || filter !== 'all'
              ? 'No reports match the selected filters.'
              : 'No completed analysis reports found in archive.'}
          </p>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/analysis/new">Run first analysis</Link>
          </Button>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-deep/60 text-muted-foreground border-b border-border text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 font-normal">Job identifier</th>
                  <th className="px-4 py-2.5 font-normal">Cardiovascular risk</th>
                  <th className="px-4 py-2.5 font-normal">Diabetic retinopathy</th>
                  <th className="px-4 py-2.5 font-normal">Date completed</th>
                  <th className="px-4 py-2.5 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr
                    key={a.job_id}
                    className="hover:bg-surface-deep/40 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-foreground font-medium">
                      <Link
                        to={`/analysis/${a.job_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {a.job_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {a.risk_level ? (
                        <Badge
                          variant={
                            a.risk_level === 'HIGH'
                              ? 'destructive'
                              : a.risk_level === 'MODERATE'
                              ? 'warning'
                              : 'ok'
                          }
                          className="text-[11px]"
                        >
                          {a.risk_level} RISK
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.dr_grade != null ? (
                        <span>
                          Grade {a.dr_grade} · {DR_LABELS[a.dr_grade] || ''}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {a.completed_at
                        ? new Date(a.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          <Link to={`/analysis/${a.job_id}`}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Link>
                        </Button>
                        {a.report_path && (
                          <Button asChild size="sm" className="h-7 text-xs px-2.5">
                            <a
                              href={`${API_BASE_URL}${a.report_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <Download className="h-3 w-3 mr-1" /> PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
