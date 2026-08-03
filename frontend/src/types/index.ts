export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Patient {
  $id?: string;
  id?: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  email?: string;
  medical_history?: string[];
  total_visits?: number;
  last_visit?: string;
  created_at?: string;
}

export interface Visit {
  $id?: string;
  id?: string;
  patient_id: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  blood_sugar?: number;
  cholesterol?: number;
  hba1c?: number;
  notes?: string;
  date?: string;
  created_at?: string;
}

export interface Analysis {
  $id?: string;
  id?: string;
  job_id: string;
  patient_id: string;
  visit_id: string;
  image_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dr_grade?: string;
  risk_level?: 'LOW' | 'MODERATE' | 'HIGH';
  confidence?: number;
  biomarkers?: Record<string, any>;
  risk_factors?: string[];
  recommendations?: string[];
  created_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
