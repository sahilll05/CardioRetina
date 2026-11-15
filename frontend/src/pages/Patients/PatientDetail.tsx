import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Trash2, Edit2, Activity, Calendar,
  Plus, Loader2, AlertCircle, HeartPulse
} from 'lucide-react';
import { usePatients, type PatientData } from '@/hooks/usePatients';
import { useVisits, type VisitData } from '@/hooks/useVisits';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { AddVisitModal } from '@/components/modals/AddVisitModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function VisitRow({ visit }: { visit: VisitData }) {
  return (
    <div className="panel p-4 hover:border-border-strong transition-colors duration-150 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-mono text-xs font-medium text-foreground">
            Visit #{visit.visit_id}
          </span>
          <span className="text-xs text-muted-foreground ml-3">
            {new Date(visit.visit_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/analysis/new?visitId=${visit.visit_id}`}>
            <Activity className="w-3.5 h-3.5 mr-1 text-primary" />
            Analyze Retinal Scan
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-border">
        <div>
          <span className="text-muted-foreground block text-[11px]">Blood Pressure</span>
          <span className="font-mono text-foreground font-medium">
            {visit.bp_systolic && visit.bp_diastolic
              ? `${visit.bp_systolic}/${visit.bp_diastolic} mmHg`
              : '—'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Fasting Glucose</span>
          <span className="font-mono text-foreground font-medium">
            {visit.blood_sugar ? `${visit.blood_sugar} mg/dL` : '—'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Cholesterol</span>
          <span className="font-mono text-foreground font-medium">
            {visit.cholesterol ? `${visit.cholesterol} mg/dL` : '—'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">HbA1c</span>
          <span className="font-mono text-foreground font-medium">
            {visit.hba1c ? `${visit.hba1c}%` : '—'}
          </span>
        </div>
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
      <div className="flex items-center justify-center h-64 text-muted-foreground text-xs gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Loading patient record…</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="panel p-8 text-center text-muted-foreground text-xs space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p>Patient record not found in directory.</p>
        <Button onClick={() => navigate('/patients')} variant="outline" size="sm" className="text-xs">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Return to directory
        </Button>
      </div>
    );
  }

  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasHighRisk = patient.diabetes_history && patient.hypertension;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Patient directory</span>
        </button>

        <div className="flex items-center gap-2">
          <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="text-xs h-8">
            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit record
          </Button>
          <Button
            onClick={() => setDeleteOpen(true)}
            variant="destructive"
            size="sm"
            className="text-xs h-8"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="panel p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded border border-border-strong bg-surface-deep flex items-center justify-center text-foreground font-mono font-medium text-base">
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-medium text-foreground">{patient.name}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                ID: {patient.patient_id} · {patient.age} yrs · {patient.gender || 'Not specified'}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                {patient.phone && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3" /> {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${patient.email}`} className="hover:text-primary transition-colors">
                      {patient.email}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button asChild size="sm" className="text-xs h-9">
            <Link to={`/analysis/new?patientId=${patient.patient_id}`}>
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              New Retinal Scan
            </Link>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-6 text-xs">
        <button
          type="button"
          className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'overview'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Clinical Summary
        </button>
        <button
          type="button"
          className={`pb-3 font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'visits'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('visits')}
        >
          <span>Visits History</span>
          <span className="px-1.5 py-0.2 rounded bg-surface border border-border text-[10px] font-mono">
            {visits.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="panel p-4">
              <span className="text-xs text-muted-foreground block mb-1">Clinical Visits</span>
              <span className="reading">{visits.length}</span>
            </div>
            <div className="panel p-4">
              <span className="text-xs text-muted-foreground block mb-1">Registered Since</span>
              <span className="reading font-mono">{new Date(patient.created_at).getFullYear()}</span>
            </div>
            <div className="panel p-4">
              <span className="text-xs text-muted-foreground block mb-1">Risk Profile</span>
              <div className="mt-1">
                {hasHighRisk ? (
                  <Badge variant="destructive">High Risk History</Badge>
                ) : patient.diabetes_history || patient.hypertension ? (
                  <Badge variant="warning">Moderate Risk History</Badge>
                ) : (
                  <Badge variant="ok">Clear Baseline</Badge>
                )}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {patient.diabetes_history && (
                    <span className="text-[11px] text-muted-foreground">· Diabetes diagnosed</span>
                  )}
                  {patient.hypertension && (
                    <span className="text-[11px] text-muted-foreground">· Hypertension recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {visits.length > 0 && (
            <div className="panel overflow-hidden">
              <div className="panel-header">
                <h3 className="text-xs font-medium text-foreground">Most Recent Visit Record</h3>
              </div>
              <div className="p-4">
                <VisitRow visit={visits[0]} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {visits.length} logged visit{visits.length !== 1 ? 's' : ''}
            </span>
            <Button onClick={() => setVisitModalOpen(true)} size="sm" className="text-xs h-7">
              <Plus className="w-3 h-3 mr-1" /> Log new visit
            </Button>
          </div>

          {visitsLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Fetching visits…</span>
            </div>
          ) : visits.length === 0 ? (
            <div className="panel p-8 text-center text-muted-foreground text-xs space-y-3">
              <Calendar className="w-6 h-6 mx-auto text-muted-foreground/60" />
              <p>No visits logged for this patient yet.</p>
              <Button onClick={() => setVisitModalOpen(true)} variant="outline" size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Log initial visit
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((v) => (
                <VisitRow key={v.visit_id} visit={v} />
              ))}
            </div>
          )}
        </div>
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
        title="Delete Patient Record"
        description={`This action will permanently delete "${patient.name}" and all historical visit data.`}
        confirmLabel="Confirm Deletion"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
