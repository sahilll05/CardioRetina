import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Circle, Loader2, Download, XCircle, AlertTriangle,
  Activity, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useAnalysis, type AnalysisResponse } from '@/hooks/useAnalysis';
import { API_BASE_URL } from '@/config/api';

const PIPELINE_STEPS = [
  'Image Quality Check',
  'Vessel Segmentation',
  'A/V Classification',
  'Biomarker Extraction',
  'Disease Screening',
  'Risk Assessment',
  'Report Generation',
];

const DR_LABELS: Record<number, string> = {
  0: 'No DR',
  1: 'Mild NPDR',
  2: 'Moderate NPDR',
  3: 'Severe NPDR',
  4: 'Proliferative DR',
};

const DR_COLORS: Record<number, string> = {
  0: 'text-success',
  1: 'text-blue-500',
  2: 'text-warning',
  3: 'text-orange-500',
  4: 'text-destructive',
};

const RISK_COLOR: Record<string, string> = {
  LOW: 'text-success',
  MODERATE: 'text-warning',
  HIGH: 'text-destructive',
};

const BIOMARKER_REF: Record<string, { label: string; unit: string; min?: number; max?: number; higherIsBad?: boolean }> = {
  av_ratio: { label: 'A/V Ratio', unit: '', min: 0.65, max: 0.80 },
  vessel_density: { label: 'Vessel Density', unit: '', min: 0.10, max: 0.15 },
  tortuosity: { label: 'Tortuosity', unit: '', max: 1.20, higherIsBad: true },
  branching_angle: { label: 'Branching Angle', unit: '°', min: 85, max: 95 },
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

const STATUS_DOT: Record<string, string> = {
  normal: 'bg-success',
  warning: 'bg-warning',
  abnormal: 'bg-destructive',
};

export function AnalysisStatus() {
  const { jobId } = useParams<{ jobId: string }>();
  const { analysis, polling, getAnalysis, pollAnalysis, stopPolling, getReportUrl } = useAnalysis();
  const pollingCleanup = useRef<(() => void) | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    // First fetch to see current state
    getAnalysis(jobId).then((data) => {
      if (!data) { setLoadError(true); return; }
      if (data.status === 'pending' || data.status === 'processing') {
        // Start polling
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

  // Compute simulated step progress from polling status
  const getStepState = (idx: number): 'done' | 'active' | 'pending' => {
    if (status === 'completed') return 'done';
    if (status === 'failed') return idx === 0 ? 'done' : 'pending';
    // While processing, animate steps sequentially based on time
    return 'pending';
  };

  const reportUrl = results?.report_url ? getReportUrl(results.report_url) : null;

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
        <XCircle className="h-10 w-10 text-destructive/60" />
        <p>Analysis job not found.</p>
        <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground" asChild>
          <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        {status === 'completed' && reportUrl && (
          <Button asChild className="shadow-sm">
            <a href={reportUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </a>
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {!analysis ? 'Loading...' :
           status === 'processing' || status === 'pending' ? 'Analysis in Progress' :
           status === 'completed' ? 'Analysis Results' :
           'Analysis Failed'}
        </h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">Job: {jobId}</p>
      </div>

      {/* Processing view */}
      {(status === 'pending' || status === 'processing' || !analysis) && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Animated visual */}
          <Card className="shadow-sm min-h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-950 to-slate-900">
            <div className="relative w-48 h-48">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border-4 border-cyan-500/20 border-t-cyan-400"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Activity className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-sm font-semibold">Processing</span>
              </div>
            </div>
          </Card>

          {/* Pipeline Steps */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Processing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                  <span className="text-muted-foreground">{step}</span>
                  <span className="ml-auto text-xs text-primary">Processing...</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-4 border-t">
                This page auto-refreshes every 3 seconds. Please keep it open.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completed view */}
      {status === 'completed' && results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Quality */}
              {results.quality && (
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Image Quality</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {(results.quality.quality_score * 100).toFixed(0)}% · {results.quality.is_gradable ? 'Gradable' : 'Not Gradable'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk */}
              {results.risk && (
                <Card className={`shadow-sm border-l-4 ${
                  results.risk.risk_level === 'HIGH' ? 'border-l-destructive' :
                  results.risk.risk_level === 'MODERATE' ? 'border-l-warning' :
                  'border-l-success'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex justify-between text-sm">
                      RISK ASSESSMENT
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                        Confidence: {(results.risk.confidence * 100).toFixed(0)}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-4 gap-4">
                    <div className={`text-5xl font-black ${RISK_COLOR[results.risk.risk_level]}`}>
                      {results.risk.risk_level}
                    </div>
                    {results.risk.reasons.length > 0 && (
                      <ul className="text-sm space-y-1 w-full">
                        {results.risk.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* DR Screening */}
              {results.disease && (
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-sm">DR SCREENING</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-2xl">Grade {results.disease.dr_grade}</span>
                      <span className={`font-semibold ${DR_COLORS[results.disease.dr_grade]}`}>
                        {DR_LABELS[results.disease.dr_grade]}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{(results.disease.dr_probability * 100).toFixed(1)}%</span>
                    </div>
                    {/* Grade probability bars */}
                    <div className="space-y-1 pt-1">
                      {results.disease.class_probabilities.map((prob, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-muted-foreground">Grade {i}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-muted-foreground">{(prob * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Biomarkers */}
              {results.biomarkers && (
                <Card className="shadow-sm">
                  <CardHeader><CardTitle>Retinal Biomarkers</CardTitle></CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Biomarker</th>
                            <th className="px-4 py-2 text-left font-medium">Value</th>
                            <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Reference</th>
                            <th className="px-4 py-2 text-right font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(results.biomarkers).map(([key, val]) => {
                            if (val == null) return null;
                            const ref = BIOMARKER_REF[key];
                            if (!ref) return null;
                            const st = biomarkerStatus(key, val as number);
                            const refText = ref.min !== undefined && ref.max !== undefined
                              ? `${ref.min}–${ref.max}${ref.unit}`
                              : ref.max !== undefined ? `< ${ref.max}${ref.unit}` : '—';
                            return (
                              <tr key={key} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{ref.label}</td>
                                <td className="px-4 py-3">{typeof val === 'number' ? val.toFixed(3) : val}{ref.unit}</td>
                                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{refText}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_DOT[st]}`} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Report */}
              {reportUrl && (
                <Card className="shadow-sm bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Download className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Full Clinical Report Ready</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PDF includes all biomarkers, segmentation masks, risk reasoning, and recommendations.
                      </p>
                    </div>
                    <a href={reportUrl} target="_blank" rel="noopener noreferrer" download>
                      <Button className="shadow-md">
                        <Download className="w-4 h-4 mr-2" /> Download PDF Report
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/analysis/new">New Analysis</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/reports">View All Reports</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Failed view */}
      {status === 'failed' && (
        <Card className="border-destructive/50 max-w-2xl mx-auto mt-8 shadow-sm">
          <CardContent className="flex flex-col items-center text-center p-10">
            <XCircle className="w-16 h-16 text-destructive mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-destructive">Analysis Failed</h2>
            <p className="text-muted-foreground mb-4">
              {results?.error_message || 'An unexpected error occurred during processing.'}
            </p>
            <div className="text-sm text-left bg-muted/50 p-4 rounded-md border w-full mb-8">
              <p className="font-semibold mb-2">Common reasons:</p>
              <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
                <li>Image is blurry or out of focus</li>
                <li>Poor lighting or incorrect image orientation</li>
                <li>Image is not a retinal fundus photograph</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link to="/analysis/new">Upload New Image</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
