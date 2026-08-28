import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Trash2, Edit2, Activity, Calendar,
  Plus, Loader2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePatients, type PatientData } from '@/hooks/usePatients';
import { useVisits, type VisitData } from '@/hooks/useVisits';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { AddVisitModal } from '@/components/modals/AddVisitModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

function VisitRow({ visit }: { visit: VisitData }) {
  return (
    <div className="border border-primary/20 bg-black p-4 group hover:bg-primary/5 transition-colors relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
      <div className="flex justify-between items-start pl-2">
        <div>
          <p className="font-bold text-white text-sm tracking-widest uppercase">{visit.visit_id}</p>
          <p className="text-xs text-primary/60 tracking-widest uppercase mt-1">
            {new Date(visit.visit_date).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
            })}
          </p>
        </div>
        <Link to={`/analysis/new?visitId=${visit.visit_id}`} className="px-3 py-1.5 border border-primary text-primary text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-colors shadow-[0_0_10px_rgba(34,197,94,0.2)] flex items-center">
          <Activity className="w-3 h-3 mr-1" /> Scan
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pl-2">
        {visit.bp_systolic && (
          <div>
            <span className="text-[10px] text-primary/60 uppercase tracking-widest block mb-1">BP</span>
            <span className="font-light text-white">{visit.bp_systolic}/{visit.bp_diastolic} mmHg</span>
          </div>
        )}
        {visit.blood_sugar && (
          <div>
            <span className="text-[10px] text-primary/60 uppercase tracking-widest block mb-1">Sugar</span>
            <span className="font-light text-white">{visit.blood_sugar} mg/dL</span>
          </div>
        )}
        {visit.cholesterol && (
          <div>
            <span className="text-[10px] text-primary/60 uppercase tracking-widest block mb-1">Cholesterol</span>
            <span className="font-light text-white">{visit.cholesterol} mg/dL</span>
          </div>
        )}
        {visit.hba1c && (
          <div>
            <span className="text-[10px] text-primary/60 uppercase tracking-widest block mb-1">HbA1c</span>
            <span className="font-light text-white">{visit.hba1c}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits'>('overview');

  const { getPatient, updatePatient, deletePatient } = usePatients();
  const { visits, loading: visitsLoading, fetchPatientVisits, createVisit } = useVisits();

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([
      getPatient(patientId).then(setPatient),
      fetchPatientVisits(patientId),
    ]).finally(() => setLoading(false));
  }, [patientId]);

  const handleUpdate = async (data: any) => {
    if (!patient) return null;
    const updated = await updatePatient(patient.patient_id, data);
    if (updated) setPatient(updated);
    return updated;
  };

  const handleDelete = async () => {
    if (!patient) return;
    setIsDeleting(true);
    const ok = await deletePatient(patient.patient_id);
    setIsDeleting(false);
    if (ok) navigate('/patients');
  };

  const handleCreateVisit = async (data: any) => {
    const result = await createVisit(data);
    if (result && patientId) {
      await fetchPatientVisits(patientId);
    }
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-primary/40 text-xs tracking-widest uppercase font-mono">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" /> Accessing record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-primary/40 gap-4 font-mono">
        <AlertCircle className="h-10 w-10 text-red-500/60" />
        <p className="text-xs tracking-widest uppercase">Record not found.</p>
        <button className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 text-xs tracking-widest uppercase transition-colors flex items-center" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Return to Directory
        </button>
      </div>
    );
  }

  const initials = patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hasHighRisk = patient.diabetes_history && patient.hypertension;
  const riskColor = hasHighRisk ? 'bg-red-500' : patient.diabetes_history || patient.hypertension ? 'bg-yellow-500' : 'bg-primary';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-primary/20 pb-4">
        <button className="text-primary/60 hover:text-primary text-xs tracking-widest uppercase transition-colors flex items-center" onClick={() => navigate('/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Patient Directory
        </button>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-primary/20 text-primary/60 hover:text-white hover:border-white text-xs tracking-widest uppercase transition-colors flex items-center" onClick={() => setEditOpen(true)}>
            <Edit2 className="h-3 w-3 mr-2" /> Edit
          </button>
          <button className="px-4 py-2 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 text-xs tracking-widest uppercase transition-colors flex items-center" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3 w-3 mr-2" /> Purge
          </button>
        </div>
      </div>

      {/* Patient Header */}
      <div className="border border-primary/20 bg-black relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 ${riskColor}`} />
        <div className="p-8 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 border border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-light tracking-widest uppercase text-white">{patient.name}</h1>
              <p className="text-primary/60 mt-1 text-[10px] tracking-widest uppercase">
                {patient.age} YRS <span className="mx-2">/</span> {patient.gender || 'N/A'} <span className="mx-2">/</span> ID: {patient.patient_id}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs tracking-widest uppercase">
                {patient.phone && (
                  <span className="flex items-center text-primary/60">
                    <Phone className="h-3 w-3 mr-2 text-primary/40" /> {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="flex items-center text-primary/60">
                    <Mail className="h-3 w-3 mr-2 text-primary/40" />
                    <a href={`mailto:${patient.email}`} className="hover:text-primary transition-colors">{patient.email}</a>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link to={`/analysis/new?patientId=${patient.patient_id}`} className="px-6 py-3 bg-primary text-black font-bold text-xs tracking-widest uppercase hover:bg-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Initiate Scan
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-primary/20 gap-8">
        <button 
          className={`pb-4 text-xs font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'overview' ? 'text-primary' : 'text-primary/40 hover:text-primary/70'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
        </button>
        <button 
          className={`pb-4 text-xs font-bold tracking-widest uppercase transition-colors relative flex items-center gap-2 ${activeTab === 'visits' ? 'text-primary' : 'text-primary/40 hover:text-primary/70'}`}
          onClick={() => setActiveTab('visits')}
        >
          Visits <span className="px-1.5 py-0.5 bg-primary/10 text-[10px] border border-primary/20">{visits.length}</span>
          {activeTab === 'visits' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
        </button>
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="border border-primary/20 bg-black p-6">
              <p className="text-[10px] font-bold text-primary/60 tracking-widest uppercase mb-2">Total Visits</p>
              <p className="text-3xl font-light text-white">{visits.length}</p>
            </div>
            <div className="border border-primary/20 bg-black p-6">
              <p className="text-[10px] font-bold text-primary/60 tracking-widest uppercase mb-2">Registered Year</p>
              <p className="text-3xl font-light text-white">{new Date(patient.created_at).getFullYear()}</p>
            </div>
            <div className="border border-primary/20 bg-black p-6 relative overflow-hidden">
              <div className={`absolute left-0 top-0 w-1 h-full ${riskColor}`} />
              <p className="text-[10px] font-bold text-primary/60 tracking-widest uppercase mb-2 pl-2">Medical History Profile</p>
              <div className="pl-2">
                {hasHighRisk ? (
                  <p className="text-xl font-light text-red-500 uppercase tracking-widest">High Risk</p>
                ) : patient.diabetes_history || patient.hypertension ? (
                  <p className="text-xl font-light text-yellow-500 uppercase tracking-widest">Moderate</p>
                ) : (
                  <p className="text-xl font-light text-primary uppercase tracking-widest">Clear</p>
                )}
                <div className="flex gap-2 mt-2">
                  {patient.diabetes_history && <span className="text-[10px] uppercase tracking-widest text-primary/60">Diabetes</span>}
                  {patient.hypertension && <span className="text-[10px] uppercase tracking-widest text-primary/60">Hypertension</span>}
                </div>
              </div>
            </div>
          </div>

          {visits.length > 0 && (
            <div className="border border-primary/20 bg-black">
              <div className="px-6 py-3 border-b border-primary/20 bg-primary/5 text-xs font-bold text-primary tracking-widest uppercase">
                Latest Record
              </div>
              <div className="p-4">
                <VisitRow visit={visits[0]} />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'visits' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-primary/60 tracking-widest uppercase">{visits.length} RECORD{visits.length !== 1 ? 'S' : ''}</p>
            <button className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center" onClick={() => setVisitModalOpen(true)}>
              <Plus className="w-3 h-3 mr-2" /> Log Visit
            </button>
          </div>

          {visitsLoading ? (
            <div className="flex items-center justify-center h-32 text-primary/40 text-xs tracking-widest uppercase">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" /> Loading...
            </div>
          ) : visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border border-dashed border-primary/30 text-primary/40 gap-4">
              <Calendar className="w-6 h-6 text-primary/20" />
              <p className="text-[10px] tracking-widest uppercase">No visits logged.</p>
              <button className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center" onClick={() => setVisitModalOpen(true)}>
                <Plus className="w-3 h-3 mr-2" /> Initialize Visit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((v) => <VisitRow key={v.visit_id} visit={v} />)}
            </div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <AddPatientModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleUpdate}
        editPatient={patient}
      />

      <AddVisitModal
        open={visitModalOpen}
        patientId={patient.patient_id}
        onClose={() => setVisitModalOpen(false)}
        onSave={handleCreateVisit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="PURGE RECORD"
        description={`WARNING: This will permanently erase "${patient.name}" and all telemetry data from the system. Proceed with caution.`}
        confirmLabel="Confirm Purge"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
