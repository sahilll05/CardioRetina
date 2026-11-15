import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, Download, XCircle, AlertTriangle,
  Activity, RefreshCw, FileText, ChevronRight
} from 'lucide-react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { API_BASE_URL } from '@/config/api';
import { MaskSplitSlider } from '@/components/FundusViewer/MaskSplitSlider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PIPELINE_STEPS = [
  'Image Quality Assessment',
  'Vessel Segmentation',
  'Artery / Vein Delineation',
  'Biomarker Extraction',
  'Diabetic Retinopathy Screening',
  'Cardiovascular Risk Stratification',
  'Diagnostic Report Generation',
];

const DR_LABELS: Record<number, string> = {
  0: 'No Apparent Retinopathy',
  1: 'Mild Non-Proliferative (NPDR)',
  2: 'Moderate Non-Proliferative (NPDR)',
  3: 'Severe Non-Proliferative (NPDR)',
  4: 'Proliferative Retinopathy (PDR)',
};

const BIOMARKER_REF: Record<
  string,
  { label: string; unit: string; min?: number; max?: number; range: string; higherIsBad?: boolean }
> = {
  av_ratio: { label: 'Arteriolar-to-Venular Ratio (A/V)', unit: '', min: 0.65, max: 0.80, range: '0.65 – 0.80' },
  vessel_density: { label: 'Vessel Area Density', unit: '', min: 0.10, max: 0.15, range: '0.10 – 0.15' },
  tortuosity: { label: 'Vascular Tortuosity Index', unit: '', max: 1.20, range: '< 1.20', higherIsBad: true },
  branching_angle: { label: 'Bifurcation Branching Angle', unit: '°', min: 85, max: 95, range: '85° – 95°' },
};

function biomarkerStatus(key: string, value: number): 'normal' | 'warning' | 'abnormal' {
  const ref = BIOMARKER_REF[key];
  if (!ref) return 'normal';
  if (ref.min !== undefined && ref.max !== undefined) {
    return value >= ref.min && value <= ref.max ? 'normal' : value < ref.min * 0.9 || value > ref.max * 1.1 ? 'abnormal' : 'warning';
  }
  if (ref.max !== undefined && ref.higherIsBad) {
    return value <= ref.max ? 'normal' : value <= ref.max * 1.15 ? 'warning' : 'abnormal';
  }
  return 'normal';
}

export function AnalysisStatus() {
  const { jobId } = useParams<{ jobId: string }>();
  const { analysis, getAnalysis, pollAnalysis, stopPolling, getReportUrl } = useAnalysis();
  const pollingCleanup = useRef<(() => void) | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    getAnalysis(jobId).then((data) => {
      if (!data) {
        setLoadError(true);
        return;
      }
      if (data.status === 'pending' || data.status === 'processing') {
        pollingCleanup.current = pollAnalysis(jobId);
      }
    });

    return () => {
      pollingCleanup.current?.();
      stopPolling();
    };
  }, [jobId]);

  const status = analysis?.status;
  const results = analysis?.results;
  const reportUrl = results?.report_url ? getReportUrl(results.report_url) : null;

  if (loadError) {
    return (
      <div className="panel p-8 text-center text-muted-foreground text-xs space-y-3 max-w-md mx-auto my-12">
        <XCircle className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-sm font-medium text-foreground">Analysis Record Not Found</h2>
        <p>The requested analysis ID could not be retrieved from the database.</p>
        <Button asChild variant="outline" size="sm" className="text-xs">
          <Link to="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Return to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-foreground tracking-tight">
              {!analysis
                ? 'Initializing Pipeline...'
                : status === 'processing' || status === 'pending'
                ? 'Processing Retinal Analysis'
                : status === 'completed'
                ? 'Diagnostic Analysis Complete'
                : 'Pipeline Execution Failed'}
            </h1>
            {status === 'completed' && <Badge variant="ok">Completed</Badge>}
            {(status === 'processing' || status === 'pending') && (
              <Badge variant="cool">Active Pipeline</Badge>
            )}
            {status === 'failed' && <Badge variant="destructive">Failed</Badge>}
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Analysis Job ID: {jobId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs h-8">
            <Link to="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Exit
            </Link>
          </Button>

          {status === 'completed' && reportUrl && (
            <Button asChild size="sm" className="text-xs h-8">
              <a href={reportUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export PDF Report
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Processing State View */}
      {(status === 'pending' || status === 'processing' || !analysis) && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="panel p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded border border-border bg-surface-deep flex items-center justify-center text-primary">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-medium text-foreground">
                Inference In Progress
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Executing sequential neural models. Peak RAM is guarded by active garbage collection.
              </p>
            </div>
            <div className="font-mono text-xs text-cool flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Awaiting telemetry stream…</span>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="panel-header">
              <h3 className="text-xs font-medium text-foreground flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                Pipeline Execution Steps
              </h3>
            </div>
            <div className="p-4 divide-y divide-border text-xs">
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={step} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground w-4">
                      0{idx + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </div>
                  <span className="text-[11px] text-cool font-mono flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Running
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completed Results View */}
      {status === 'completed' && results && (
        <div className="space-y-6">
          {/* Fundus Visual Explorer */}
          {results.image_url && results.masks && (
            <div className="panel overflow-hidden">
              <div className="panel-header flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-medium text-foreground">
                    Fundus Telemetry Explorer
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Interactive vessel split comparison (Original color photograph vs segmented vasculature)
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span>512 × 512 px</span>
                </div>
              </div>

              <div className="p-4 bg-surface-deep/30">
                <MaskSplitSlider
                  rawUrl={`${API_BASE_URL}${results.image_url}`}
                  vesselMaskUrl={`${API_BASE_URL}${results.masks.vessel}`}
                  avOverlayUrl={`${API_BASE_URL}${results.masks.av_overlay || results.masks.vessel}`}
                />
              </div>
            </div>
          )}

          {/* Diagnostic Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Image Quality Score */}
            {results.quality && (
              <div className="panel p-5 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Image Quality Score</span>
                  <Badge variant={results.quality.is_gradable ? 'ok' : 'destructive'}>
                    {results.quality.is_gradable ? 'Clinically Gradable' : 'Sub-Optimal Quality'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="reading">
                    {(results.quality.quality_score * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">confidence</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                  MobileNetV3 optical clarity &amp; foveal illumination check.
                </p>
              </div>
            )}

            {/* Cardiovascular Risk Stratification */}
            {results.risk && (
              <div className="panel p-5 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Systemic CV Risk Tier</span>
                  <Badge
                    variant={
                      results.risk.risk_level === 'HIGH'
                        ? 'destructive'
                        : results.risk.risk_level === 'MODERATE'
                        ? 'warning'
                        : 'ok'
                    }
                  >
                    {results.risk.risk_level} RISK
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="reading font-mono">
                    {(results.risk.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">model confidence</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                  Microvascular biomarkers fused with clinical history.
                </p>
              </div>
            )}

            {/* Diabetic Retinopathy Grade */}
            {results.disease && (
              <div className="panel p-5 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Diabetic Retinopathy</span>
                  <Badge variant={results.disease.dr_grade > 1 ? 'warning' : 'ok'}>
                    Grade {results.disease.dr_grade}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-sm font-medium text-foreground">
                    {DR_LABELS[results.disease.dr_grade] || `Grade ${results.disease.dr_grade}`}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                  EfficientNet-B3 5-class international grading scale.
                </p>
              </div>
            )}
          </div>

          {/* Details Row: Extracted Biomarkers & DR Class Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quantitative Biomarkers Table */}
            {results.biomarkers && (
              <div className="panel overflow-hidden">
                <div className="panel-header">
                  <h3 className="text-xs font-medium text-foreground">
                    Quantitative Vascular Biomarkers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-deep/60 text-muted-foreground border-b border-border text-[11px]">
                      <tr>
                        <th className="px-4 py-2 font-normal">Biomarker</th>
                        <th className="px-4 py-2 font-normal">Measured</th>
                        <th className="px-4 py-2 font-normal">Reference</th>
                        <th className="px-4 py-2 font-normal text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.entries(results.biomarkers).map(([key, val]) => {
                        if (val == null) return null;
                        const ref = BIOMARKER_REF[key];
                        if (!ref) return null;
                        const st = biomarkerStatus(key, val as number);
                        return (
                          <tr key={key} className="hover:bg-surface-deep/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">
                              {ref.label}
                            </td>
                            <td className="px-4 py-3 font-mono text-foreground font-medium">
                              {typeof val === 'number' ? val.toFixed(3) : val}
                              {ref.unit}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                              {ref.range}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge
                                variant={
                                  st === 'abnormal'
                                    ? 'destructive'
                                    : st === 'warning'
                                    ? 'warning'
                                    : 'ok'
                                }
                                className="text-[10px]"
                              >
                                {st === 'abnormal'
                                  ? 'Abnormal'
                                  : st === 'warning'
                                  ? 'Borderline'
                                  : 'Normal'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DR Probability Distribution & Clinical Notes */}
            <div className="space-y-4">
              {results.disease && (
                <div className="panel p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h3 className="text-xs font-medium text-foreground">
                      DR Class Probabilities
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Top score: {(results.disease.dr_probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {results.disease.class_probabilities.map((prob, i) => (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Grade {i} ({DR_LABELS[i]?.split(' ')[0] || `Class ${i}`})
                          </span>
                          <span className="font-mono text-foreground">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-deep rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full rounded-full ${
                              i === results.disease?.dr_grade ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                            style={{ width: `${Math.max(2, prob * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Justifications */}
              {results.risk?.reasons && results.risk.reasons.length > 0 && (
                <div className="panel p-4 bg-surface-deep/40 space-y-2">
                  <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    <span>Clinical Risk Justifications</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {results.risk.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground font-mono">·</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="sm" className="text-xs h-8">
              <Link to="/analysis/new">Run Another Scan</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link to="/reports">View All Patient Reports</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Failed Execution State */}
      {status === 'failed' && (
        <div className="panel p-8 max-w-xl mx-auto text-center space-y-4">
          <XCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-base font-medium text-foreground">Pipeline Execution Failed</h2>
          <p className="text-xs text-muted-foreground">
            {results?.error_message ||
              'An unexpected error occurred during neural inference. Please verify the retinal scan format and retry.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button asChild size="sm" className="text-xs">
              <Link to="/analysis/new">Retry Upload</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
