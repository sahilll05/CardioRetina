import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, FileText, Trash2, Edit2, Activity, Calendar,
  Plus, Loader2, AlertCircle, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { usePatients, type PatientData } from '@/hooks/usePatients';
import { useVisits, type VisitData } from '@/hooks/useVisits';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { AddVisitModal } from '@/components/modals/AddVisitModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { API_BASE_URL } from '@/config/api';

function VisitCard({ visit }: { visit: VisitData }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-sm">{visit.visit_id}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(visit.visit_date).toLocaleDateString('en-US', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/analysis/new?visitId=${visit.visit_id}`}>
            <Activity className="w-3.5 h-3.5 mr-1.5" /> Analyze
          </Link>
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {visit.bp_systolic && (
          <div className="bg-muted/50 rounded px-3 py-1.5">
            <span className="text-xs text-muted-foreground block">Blood Pressure</span>
            <span className="font-medium">{visit.bp_systolic}/{visit.bp_diastolic} mmHg</span>
          </div>
        )}
        {visit.blood_sugar && (
          <div className="bg-muted/50 rounded px-3 py-1.5">
            <span className="text-xs text-muted-foreground block">Blood Sugar</span>
            <span className="font-medium">{visit.blood_sugar} mg/dL</span>
          </div>
        )}
        {visit.cholesterol && (
          <div className="bg-muted/50 rounded px-3 py-1.5">
            <span className="text-xs text-muted-foreground block">Cholesterol</span>
            <span className="font-medium">{visit.cholesterol} mg/dL</span>
          </div>
        )}
        {visit.hba1c && (
          <div className="bg-muted/50 rounded px-3 py-1.5">
            <span className="text-xs text-muted-foreground block">HbA1c</span>
            <span className="font-medium">{visit.hba1c}%</span>
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
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading patient...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
        <AlertCircle className="h-10 w-10 text-destructive/60" />
        <p>Patient not found.</p>
        <Button variant="outline" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Patients
        </Button>
      </div>
    );
  }

  const initials = patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hasHighRisk = patient.diabetes_history && patient.hypertension;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-2 -ml-4 hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={() => navigate('/patients')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
      </Button>

      {/* Patient Header */}
      <Card className="shadow-sm overflow-hidden">
        <div className={`h-1.5 ${hasHighRisk ? 'bg-destructive' : patient.diabetes_history || patient.hypertension ? 'bg-warning' : 'bg-success'}`} />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
                  <Button variant="outline" size="sm" className="h-8 shadow-sm" onClick={() => setEditOpen(true)}>
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                </div>
                <p className="text-muted-foreground mt-1">
                  {patient.age} years • {patient.gender || 'N/A'} • {patient.patient_id}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  {patient.phone && (
                    <span className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-1.5" /> {patient.phone}
                    </span>
                  )}
                  {patient.email && (
                    <span className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-1.5" />
                      <a href={`mailto:${patient.email}`} className="hover:text-primary transition-colors">{patient.email}</a>
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {patient.diabetes_history && (
                    <span className="px-2.5 py-0.5 border rounded-full text-xs bg-muted text-muted-foreground">Diabetes</span>
                  )}
                  {patient.hypertension && (
                    <span className="px-2.5 py-0.5 border rounded-full text-xs bg-muted text-muted-foreground">Hypertension</span>
                  )}
                  {!patient.diabetes_history && !patient.hypertension && (
                    <span className="px-2.5 py-0.5 border border-success/20 rounded-full text-xs bg-success/10 text-success">No significant history</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button className="flex-1 md:flex-none shadow-sm" asChild>
                <Link to={`/analysis/new?patientId=${patient.patient_id}`}>
                  <Activity className="w-4 h-4 mr-2" /> New Analysis
                </Link>
              </Button>
              <Button variant="destructive" size="icon" className="shadow-sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[350px] mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Visits</p>
                <p className="text-2xl font-bold">{visits.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Patient Since</p>
                <p className="text-2xl font-bold">{new Date(patient.created_at).getFullYear()}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Risk Profile</p>
                <p className={`text-2xl font-bold ${hasHighRisk ? 'text-destructive' : patient.diabetes_history || patient.hypertension ? 'text-warning' : 'text-success'}`}>
                  {hasHighRisk ? 'HIGH' : patient.diabetes_history || patient.hypertension ? 'MODERATE' : 'LOW'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Latest visit summary */}
          {visits.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Latest Visit Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <VisitCard visit={visits[0]} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visits">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{visits.length} visit{visits.length !== 1 ? 's' : ''} recorded</p>
              <Button size="sm" onClick={() => setVisitModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Visit
              </Button>
            </div>

            {visitsLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading visits...
              </div>
            ) : visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-3 border-2 border-dashed rounded-lg">
                <Calendar className="w-8 h-8 opacity-40" />
                <p>No visits recorded yet.</p>
                <Button size="sm" onClick={() => setVisitModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create First Visit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((v) => <VisitCard key={v.visit_id} visit={v} />)}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
        title="Delete Patient"
        description={`Permanently delete "${patient.name}" and all associated data? This action cannot be undone.`}
        confirmLabel="Delete Patient"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
