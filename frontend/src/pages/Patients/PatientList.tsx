import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Activity, Calendar, MoreVertical, Edit2, Trash2, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { usePatients, type PatientData, type PatientCreate } from '@/hooks/usePatients';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 10;

function RiskBadge({ history }: { history: { diabetes: boolean; hypertension: boolean } }) {
  if (history.diabetes && history.hypertension)
    return <Badge variant="destructive">High Risk History</Badge>;
  if (history.diabetes || history.hypertension)
    return <Badge variant="warning">Moderate Risk History</Badge>;
  return <Badge variant="secondary">No Prior History</Badge>;
}

function PatientCard({
  patient,
  onEdit,
  onDelete,
}: {
  patient: PatientData;
  onEdit: (p: PatientData) => void;
  onDelete: (p: PatientData) => void;
}) {
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasRisk = patient.diabetes_history || patient.hypertension;

  return (
    <div className="panel p-5 space-y-4 hover:border-border-strong transition-colors duration-150">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="h-9 w-9 rounded border border-border bg-surface-deep flex items-center justify-center text-foreground font-mono text-xs shrink-0 font-medium">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate">
              {patient.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              ID: {patient.patient_id} · {patient.age} yrs · {patient.gender || 'Unspecified'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Patient options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-border-strong text-xs">
            <DropdownMenuItem
              onClick={() => onEdit(patient)}
              className="cursor-pointer text-foreground hover:bg-surface-deep"
            >
              <Edit2 className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Edit record
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(patient)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-y border-border py-2.5">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">Registered: {new Date(patient.created_at).toLocaleDateString()}</span>
        </div>
        {patient.phone ? (
          <div className="flex items-center gap-1.5 truncate">
            <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate font-mono">{patient.phone}</span>
          </div>
        ) : (
          <div className="text-muted-foreground/60 italic text-[11px]">No contact phone</div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <RiskBadge history={{ diabetes: patient.diabetes_history, hypertension: patient.hypertension }} />
        {patient.diabetes_history && (
          <Badge variant="outline" className="text-[11px]">
            Diabetes Mellitus
          </Badge>
        )}
        {patient.hypertension && (
          <Badge variant="outline" className="text-[11px]">
            Hypertension
          </Badge>
        )}
      </div>

      <div className="pt-2 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
          <Link to={`/patients/${patient.patient_id}`}>View Clinical Details</Link>
        </Button>
        <Button asChild size="sm" className="flex-1 text-xs h-8">
          <Link to={`/analysis/new?patientId=${patient.patient_id}`}>New Scan Analysis</Link>
        </Button>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">
            Patient Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active patient clinical records and history
          </p>
        </div>

        <Button onClick={() => setAddModalOpen(true)} size="sm" className="text-xs h-8">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Register new patient
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="panel p-3 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search patient by name or ID…"
            className="w-full pl-9 pr-3 py-1.5 bg-surface-deep border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-border-strong text-xs rounded"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          <span>
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''} in directory
          </span>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Accessing patient records…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-8 text-center text-muted-foreground text-xs space-y-3">
          <p>{search ? 'No patient records match the search query.' : 'Patient registry is currently empty.'}</p>
          {!search && (
            <Button onClick={() => setAddModalOpen(true)} variant="outline" size="sm" className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Initialize first record
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
          </Button>
          <div className="font-mono text-[11px]">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
        title="Delete Patient Record"
        description={`This action will permanently delete "${deleteTarget?.name}" (ID: ${deleteTarget?.patient_id}) and any associated retinal scans.`}
        confirmLabel="Confirm Deletion"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
