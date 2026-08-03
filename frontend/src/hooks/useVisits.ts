import { useState, useCallback } from 'react';
import { api } from '@/config/api';
import { toast } from 'sonner';

export interface VisitData {
  id: number;
  visit_id: string;
  patient_id: number;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_sugar: number | null;
  cholesterol: number | null;
  hba1c: number | null;
  visit_date: string;
  created_at: string;
}

export interface VisitCreate {
  patient_id: string; // backend patient_id (PAT-XXXX)
  bp_systolic?: number;
  bp_diastolic?: number;
  blood_sugar?: number;
  cholesterol?: number;
  hba1c?: number;
}

export function useVisits() {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPatientVisits = useCallback(async (patientId: string): Promise<VisitData[]> => {
    setLoading(true);
    try {
      const res = await api.get<VisitData[]>(`/visits/patient/${patientId}`);
      setVisits(res.data);
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to fetch visits.';
      toast.error(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getVisit = useCallback(async (visitId: string): Promise<VisitData | null> => {
    try {
      const res = await api.get<VisitData>(`/visits/${visitId}`);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const createVisit = useCallback(async (data: VisitCreate): Promise<VisitData | null> => {
    try {
      const res = await api.post<VisitData>('/visits/', data);
      toast.success('Visit created successfully.');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create visit.';
      toast.error(msg);
      return null;
    }
  }, []);

  return { visits, loading, fetchPatientVisits, getVisit, createVisit };
}
