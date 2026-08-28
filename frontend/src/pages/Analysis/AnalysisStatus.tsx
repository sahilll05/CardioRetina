import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, Download, XCircle, AlertTriangle,
  Activity, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnalysis } from '@/hooks/useAnalysis';
import { API_BASE_URL } from '@/config/api';
import { RiskRadarShader } from '@/components/shaders/RiskRadarShader';
import { MaskSplitSlider } from '@/components/FundusViewer/MaskSplitSlider';

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

const STATUS_COLOR: Record<string, string> = {
  normal: 'text-primary border-primary bg-primary/10',
  warning: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
  abnormal: 'text-red-500 border-red-500 bg-red-500/10',
};

export function AnalysisStatus() {
  const { jobId } = useParams<{ jobId: string }>();
  const { analysis, getAnalysis, pollAnalysis, stopPolling, getReportUrl } = useAnalysis();
  const pollingCleanup = useRef<(() => void) | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    getAnalysis(jobId).then((data) => {
      if (!data) { setLoadError(true); return; }
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
      <div className="flex flex-col items-center justify-center h-64 text-primary/40 font-mono gap-4 uppercase tracking-widest">
        <XCircle className="h-10 w-10 text-red-500/60" />
        <p>Analysis job not found.</p>
        <Link to="/dashboard" className="border border-primary/20 px-4 py-2 hover:bg-primary/10 hover:text-primary transition-colors flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Return to Base</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto font-mono">
      <div className="flex justify-between items-center border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">
            {!analysis ? 'Initializing...' :
             status === 'processing' || status === 'pending' ? 'Processing Sequence' :
             status === 'completed' ? 'Analysis Complete' :
             'Sequence Failed'}
          </h1>
          <p className="text-primary/60 mt-1 text-xs tracking-widest uppercase">ID: {jobId}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/dashboard" className="px-4 py-2 text-xs tracking-widest uppercase border border-primary/20 text-primary/60 hover:text-primary hover:border-primary transition-colors flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit
          </Link>
          {status === 'completed' && reportUrl && (
            <a href={reportUrl} target="_blank" rel="noopener noreferrer" download className="px-4 py-2 text-xs tracking-widest uppercase bg-primary text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-colors flex items-center font-bold">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </a>
          )}
        </div>
      </div>

      {/* Processing view */}
      {(status === 'pending' || status === 'processing' || !analysis) && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-primary/20 bg-black min-h-[300px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="relative w-48 h-48">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full border-4 border-primary/5 border-t-primary/50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
                <Activity className="w-8 h-8 mb-2 animate-pulse" />
                <span className="text-xs tracking-widest uppercase font-bold">Active</span>
              </div>
            </div>
          </div>

          <div className="border border-primary/20 bg-black p-6 flex flex-col">
            <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-6 flex items-center border-b border-primary/20 pb-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary mr-2" /> Pipeline Status
            </h3>
            <div className="space-y-4 flex-1">
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center gap-4 text-sm">
                  <div className="w-6 h-6 border border-primary/30 flex items-center justify-center bg-primary/5">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  </div>
                  <span className="text-primary/70 uppercase tracking-widest text-xs">{step}</span>
                  <span className="ml-auto text-[10px] text-primary animate-pulse tracking-widest uppercase">Processing</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completed view */}
      {status === 'completed' && results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Fundus Viewer */}
          {results.image_url && results.masks && (
            <div className="border border-primary/20 bg-black p-1">
              <div className="px-4 py-2 border-b border-primary/20 text-xs font-bold text-primary tracking-widest uppercase bg-primary/5">
                Fundus Explorer
              </div>
              <div className="p-4">
                <MaskSplitSlider 
                  rawUrl={`${API_BASE_URL}${results.image_url}`}
                  vesselMaskUrl={`${API_BASE_URL}${results.masks.vessel}`}
                  avOverlayUrl={`${API_BASE_URL}${results.masks.av_overlay || results.masks.vessel}`}
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Quality & Risk */}
              <div className="grid grid-cols-2 gap-4">
                {results.quality && (
                  <div className="border border-primary/20 p-4 bg-black">
                    <p className="text-[10px] font-bold text-primary/60 tracking-widest uppercase mb-1">Quality Index</p>
                    <div className="text-2xl text-white font-light">{(results.quality.quality_score * 100).toFixed(0)}%</div>
                    <p className={`text-xs uppercase tracking-widest mt-2 ${results.quality.is_gradable ? 'text-primary' : 'text-red-500'}`}>
                      {results.quality.is_gradable ? 'Valid Scan' : 'Invalid Scan'}
                    </p>
                  </div>
                )}
                {results.risk && (
                  <div className="border border-primary/20 p-4 bg-black">
                    <p className="text-[10px] font-bold text-primary/60 tracking-widest uppercase mb-1">Risk Level</p>
                    <div className={`text-2xl font-light ${results.risk.risk_level === 'HIGH' ? 'text-red-500' : results.risk.risk_level === 'MODERATE' ? 'text-yellow-500' : 'text-primary'}`}>
                      {results.risk.risk_level}
                    </div>
                    <p className="text-xs text-primary/60 uppercase tracking-widest mt-2">
                      Conf: {(results.risk.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Radar Shader */}
              {results.risk && (
                <div className="border border-primary/20 bg-black p-6 flex flex-col items-center">
                  <div className="text-xs font-bold text-primary/60 tracking-widest uppercase mb-6 w-full text-center border-b border-primary/20 pb-2">
                    Visual Risk Analysis
                  </div>
                  <div className="w-48 h-48 relative flex items-center justify-center">
                    <RiskRadarShader 
                      riskLevel={results.risk.risk_level as any} 
                      confidence={results.risk.confidence} 
                      className="absolute inset-0"
                    />
                    <div className="z-10 text-xl font-light text-white tracking-widest uppercase">
                      {results.risk.risk_level}
                    </div>
                  </div>
                  {results.risk.reasons.length > 0 && (
                    <div className="w-full mt-6 space-y-2">
                      {results.risk.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] uppercase tracking-widest text-primary/70">
                          <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DR Screening */}
              {results.disease && (
                <div className="border border-primary/20 bg-black p-6">
                  <div className="text-xs font-bold text-primary/60 tracking-widest uppercase mb-4 border-b border-primary/20 pb-2">
                    DR Screening Results
                  </div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-3xl font-light text-white">Grade {results.disease.dr_grade}</div>
                      <div className="text-primary text-xs tracking-widest uppercase mt-1">{DR_LABELS[results.disease.dr_grade]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{(results.disease.dr_probability * 100).toFixed(1)}%</div>
                      <div className="text-primary/50 text-[10px] tracking-widest uppercase">Confidence</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {results.disease.class_probabilities.map((prob, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-12 text-[10px] text-primary/60 tracking-widest uppercase">Gr {i}</span>
                        <div className="flex-1 h-[2px] bg-primary/10 relative">
                          <div
                            className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[10px] text-white tracking-widest">{(prob * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* Biomarkers */}
              {results.biomarkers && (
                <div className="border border-primary/20 bg-black overflow-hidden">
                  <div className="px-6 py-4 border-b border-primary/20 text-xs font-bold text-primary tracking-widest uppercase bg-primary/5">
                    Extracted Biomarkers
                  </div>
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] text-primary/40 tracking-widest uppercase">
                        <tr>
                          <th className="px-2 py-2 text-left font-normal">Metric</th>
                          <th className="px-2 py-2 text-left font-normal">Value</th>
                          <th className="px-2 py-2 text-right font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {Object.entries(results.biomarkers).map(([key, val]) => {
                          if (val == null) return null;
                          const ref = BIOMARKER_REF[key];
                          if (!ref) return null;
                          const st = biomarkerStatus(key, val as number);
                          return (
                            <tr key={key} className="hover:bg-primary/5 transition-colors group">
                              <td className="px-2 py-3 text-xs tracking-widest uppercase text-primary/80 group-hover:text-primary transition-colors">{ref.label}</td>
                              <td className="px-2 py-3 text-white font-light">{typeof val === 'number' ? val.toFixed(3) : val}{ref.unit}</td>
                              <td className="px-2 py-3 text-right">
                                <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest border ${STATUS_COLOR[st]}`}>
                                  {st}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Link to="/analysis/new" className="flex-1 py-3 border border-primary/30 text-center text-xs tracking-widest uppercase text-primary hover:bg-primary/10 transition-colors">
                  Run New Scan
                </Link>
                <Link to="/reports" className="flex-1 py-3 border border-primary/30 text-center text-xs tracking-widest uppercase text-primary hover:bg-primary/10 transition-colors">
                  View Records
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Failed view */}
      {status === 'failed' && (
        <div className="border border-red-500/30 bg-black max-w-2xl mx-auto mt-8 p-10 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <XCircle className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
          <h2 className="text-2xl font-light mb-2 text-white uppercase tracking-widest">Analysis Failed</h2>
          <p className="text-red-400/80 mb-6 text-sm tracking-widest uppercase">
            {results?.error_message || 'System fault detected during processing.'}
          </p>
          <div className="flex gap-4">
            <Link to="/analysis/new" className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs tracking-widest uppercase hover:bg-red-500/20 transition-colors">
              Retry Upload
            </Link>
            <Link to="/dashboard" className="px-6 py-3 border border-primary/20 text-primary/60 text-xs tracking-widest uppercase hover:text-primary hover:border-primary transition-colors">
              Base Return
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
