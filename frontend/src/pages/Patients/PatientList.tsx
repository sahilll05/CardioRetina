import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Activity, Calendar, MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { usePatients, type PatientData, type PatientCreate } from '@/hooks/usePatients';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

const PAGE_SIZE = 10;

function RiskBadge({ history }: { history: { diabetes: boolean; hypertension: boolean } }) {
  if (history.diabetes && history.hypertension)
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">High History</span>;
  if (history.diabetes || history.hypertension)
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">Moderate History</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">No History</span>;
}

function PatientCard({ patient, onEdit, onDelete }: {
  patient: PatientData;
  onEdit: (p: PatientData) => void;
  onDelete: (p: PatientData) => void;
}) {
  const initials = patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hasRisk = patient.diabetes_history || patient.hypertension;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card
        className="hover:shadow-md transition-all border-l-4"
        style={{
          borderLeftColor: patient.diabetes_history && patient.hypertension
            ? 'hsl(var(--destructive))'
            : hasRisk
            ? 'hsl(var(--warning))'
            : 'hsl(var(--success))',
        }}
      >
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {initials}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{patient.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Age: {patient.age} | {patient.gender || 'N/A'} | {patient.patient_id}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(patient)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(patient)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4 text-primary/70" />
              <span>Joined {new Date(patient.created_at).toLocaleDateString()}</span>
            </div>
            {patient.phone && (
              <div className="flex items-center text-muted-foreground">
                <Activity className="mr-2 h-4 w-4 text-primary/70" />
                <span>{patient.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge history={{ diabetes: patient.diabetes_history, hypertension: patient.hypertension }} />
            {patient.diabetes_history && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">Diabetes</span>
            )}
            {patient.hypertension && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">Hypertension</span>
            )}
          </div>

          <div className="mt-5 pt-4 border-t flex space-x-3">
            <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20" variant="secondary" asChild>
              <Link to={`/patients/${patient.patient_id}`}>View Details</Link>
            </Button>
            <Button className="w-full" asChild>
              <Link to={`/analysis/new?patientId=${patient.patient_id}`}>New Analysis</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PatientList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<PatientData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatientData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { patients, loading, fetchPatients, createPatient, updatePatient, deletePatient } = usePatients();

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (data: PatientCreate) => {
    const result = await createPatient(data);
    if (result) {
      await fetchPatients();
    }
    return result;
  };

  const handleUpdate = async (data: PatientCreate) => {
    if (!editPatient) return null;
    const result = await updatePatient(editPatient.patient_id, data);
    if (result) {
      await fetchPatients();
      setEditPatient(null);
    }
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const ok = await deletePatient(deleteTarget.patient_id);
    if (ok) {
      await fetchPatients();
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1 text-sm">Browse, search, and manage all patients.</p>
        </div>
        <Button className="shadow-md" onClick={() => setAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Patient
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              className="pl-9 h-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading patients...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
          <p>{search ? 'No patients match your search.' : 'No patients registered yet.'}</p>
          {!search && (
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Register First Patient
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence>
            {paginated.map((p) => (
              <PatientCard
                key={p.patient_id}
                patient={p}
                onEdit={(pat) => setEditPatient(pat)}
                onDelete={(pat) => setDeleteTarget(pat)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <div className="text-sm font-medium">Page {page} of {totalPages}</div>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleCreate}
      />

      {/* Edit Patient Modal */}
      <AddPatientModal
        open={!!editPatient}
        onClose={() => setEditPatient(null)}
        onSave={handleUpdate}
        editPatient={editPatient}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Patient"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}" and all their data? This cannot be undone.`}
        confirmLabel="Delete Patient"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
