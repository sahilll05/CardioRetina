import { useState, useCallback, useRef } from 'react';
import { api, apiUpload, API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';

export interface QualityResult {
  quality_score: number;
  is_gradable: boolean;
}

export interface BiomarkerResult {
  av_ratio: number | null;
  vessel_density: number | null;
  tortuosity: number | null;
  branching_angle: number | null;
}

export interface DiseaseResult {
  dr_grade: number;
  dr_probability: number;
  class_probabilities: number[];
}

export interface RiskResult {
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  confidence: number;
  reasons: string[];
}

export interface AnalysisResult {
  status: string;
  image_url?: string;
  masks?: {
    vessel?: string;
    av_overlay?: string;
    [key: string]: any;
  };
  quality?: QualityResult;
  biomarkers?: BiomarkerResult;
  disease?: DiseaseResult;
  risk?: RiskResult;
  report_url?: string;
  error_message?: string;
}

export interface AnalysisResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: AnalysisResult;
}

export interface StartAnalysisParams {
  patient_id: string;
  visit_id: string;
  age: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  blood_sugar?: number;
  cholesterol?: number;
  diabetes_history: boolean;
  image: File;
}

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAnalysis = useCallback(
    async (params: StartAnalysisParams): Promise<string | null> => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('patient_id', params.patient_id);
        formData.append('visit_id', params.visit_id);
        formData.append('age', String(params.age));
        if (params.bp_systolic != null) formData.append('bp_systolic', String(params.bp_systolic));
        if (params.bp_diastolic != null) formData.append('bp_diastolic', String(params.bp_diastolic));
        if (params.blood_sugar != null) formData.append('blood_sugar', String(params.blood_sugar));
        if (params.cholesterol != null) formData.append('cholesterol', String(params.cholesterol));
        formData.append('diabetes_history', String(params.diabetes_history));
        formData.append('image', params.image);

        const res = await apiUpload.post<{ job_id: string; status: string }>(
          '/analysis/start',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        toast.success('Analysis submitted! Polling for results...');
        return res.data.job_id;
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Failed to start analysis.';
        toast.error(msg);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const pollAnalysis = useCallback((jobId: string, onComplete?: (data: AnalysisResponse) => void) => {
    // Clear any existing polling before starting a new one
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    setPolling(true);
    let isDone = false;

    const poll = async () => {
      if (isDone) return;
      try {
        const res = await api.get<AnalysisResponse>(`/analysis/${jobId}`);
        setAnalysis(res.data);

        if (res.data.status === 'completed' || res.data.status === 'failed') {
          isDone = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPolling(false);
          onComplete?.(res.data);

          if (res.data.status === 'completed') {
            toast.success('Analysis complete!');
          } else {
            toast.error(`Analysis failed: ${res.data.results?.error_message || 'Unknown error'}`);
          }
        }
      } catch {
        // silently retry
      }
    };

    poll(); // immediate first call
    pollingRef.current = setInterval(poll, 3000); // then every 3 seconds

    return () => {
      isDone = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
      setPolling(false);
    };
  }, []);

  const getAnalysis = useCallback(async (jobId: string): Promise<AnalysisResponse | null> => {
    try {
      const res = await api.get<AnalysisResponse>(`/analysis/${jobId}`);
      setAnalysis(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const getReportUrl = (reportPath: string): string => {
    return `${API_BASE_URL}${reportPath}`;
  };

  const stopPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPolling(false);
  }, []);

  return {
    analysis,
    submitting,
    polling,
    startAnalysis,
    pollAnalysis,
    getAnalysis,
    getReportUrl,
    stopPolling,
  };
}
