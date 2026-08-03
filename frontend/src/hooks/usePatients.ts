import { useState, useCallback } from 'react';
import { api } from '@/config/api';
import { toast } from 'sonner';

export interface PatientData {
  id: number;
  patient_id: string;
  name: string;
  age: number;
  gender: string | null;
  phone: string | null;
  email: string | null;
  diabetes_history: boolean;
  hypertension: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  name: string;
  age: number;
  gender?: string;
  phone?: string;
  email?: string;
  diabetes_history: boolean;
  hypertension: boolean;
}

export interface PatientUpdate extends Partial<PatientCreate> {}

export function usePatients() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (skip = 0, limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PatientData[]>('/patients/', { params: { skip, limit } });
      setPatients(res.data);
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to fetch patients.';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatient = useCallback(async (patientId: string): Promise<PatientData | null> => {
    try {
      const res = await api.get<PatientData>(`/patients/${patientId}`);
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Patient not found.';
      toast.error(msg);
      return null;
    }
  }, []);

  const createPatient = useCallback(async (data: PatientCreate): Promise<PatientData | null> => {
    try {
      const res = await api.post<PatientData>('/patients/', data);
      toast.success(`Patient "${res.data.name}" registered successfully.`);
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create patient.';
      toast.error(msg);
      return null;
    }
  }, []);

  const updatePatient = useCallback(
    async (patientId: string, data: PatientUpdate): Promise<PatientData | null> => {
      try {
        const res = await api.put<PatientData>(`/patients/${patientId}`, data);
        toast.success('Patient record updated.');
        return res.data;
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Failed to update patient.';
        toast.error(msg);
        return null;
      }
    },
    []
  );

  const deletePatient = useCallback(async (patientId: string): Promise<boolean> => {
    try {
      await api.delete(`/patients/${patientId}`);
      toast.success('Patient record deleted.');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete patient.';
      toast.error(msg);
      return false;
    }
  }, []);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
  };
}
