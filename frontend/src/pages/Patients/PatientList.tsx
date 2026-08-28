import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Activity, Calendar, MoreVertical, Edit2, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { usePatients, type PatientData, type PatientCreate } from '@/hooks/usePatients';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

const PAGE_SIZE = 10;

function RiskBadge({ history }: { history: { diabetes: boolean; hypertension: boolean } }) {
  if (history.diabetes && history.hypertension)
    return <span className="px-2 py-1 text-[10px] uppercase tracking-widest border border-red-500 text-red-500 bg-red-500/10">High Risk</span>;
  if (history.diabetes || history.hypertension)
    return <span className="px-2 py-1 text-[10px] uppercase tracking-widest border border-yellow-500 text-yellow-500 bg-yellow-500/10">Moderate</span>;
  return <span className="px-2 py-1 text-[10px] uppercase tracking-widest border border-primary/40 text-primary/70 bg-primary/5">No History</span>;
}

function PatientCard({ patient, onEdit, onDelete }: {
  patient: PatientData;
  onEdit: (p: PatientData) => void;
  onDelete: (p: PatientData) => void;
}) {
  const initials = patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hasRisk = patient.diabetes_history || patient.hypertension;
  const riskColor = patient.diabetes_history && patient.hypertension ? 'bg-red-500' : hasRisk ? 'bg-yellow-500' : 'bg-primary';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }} className="group">
      <div className="border border-primary/20 bg-black p-5 relative overflow-hidden transition-colors hover:border-primary/50">
        <div className={`absolute left-0 top-0 w-1 h-full ${riskColor} opacity-50 group-hover:opacity-100 transition-opacity`} />
        
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4 pl-2">
            <div className="h-10 w-10 border border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
            <div>
              <h3 className="font-light text-lg text-white uppercase tracking-widest">{patient.name}</h3>
              <p className="text-[10px] text-primary/60 uppercase tracking-widest mt-1">
                Age: {patient.age} | {patient.gender || 'N/A'} | ID: {patient.patient_id}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 text-primary/40 hover:text-primary transition-colors flex items-center justify-center">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black border-primary/20 rounded-none text-primary uppercase tracking-widest text-[10px]">
              <DropdownMenuItem onClick={() => onEdit(patient)} className="hover:bg-primary/20 hover:text-white cursor-pointer">
                <Edit2 className="w-3 h-3 mr-2" /> Edit Record
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500 hover:bg-red-500/20 hover:text-red-400 cursor-pointer" onClick={() => onDelete(patient)}>
                <Trash2 className="w-3 h-3 mr-2" /> Delete Record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-xs tracking-widest uppercase pl-2">
          <div className="flex items-center text-primary/60">
            <Calendar className="mr-2 h-3 w-3 text-primary/40" />
            <span>Joined: {new Date(patient.created_at).toLocaleDateString()}</span>
          </div>
          {patient.phone && (
            <div className="flex items-center text-primary/60">
              <Activity className="mr-2 h-3 w-3 text-primary/40" />
              <span>{patient.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pl-2">
          <RiskBadge history={{ diabetes: patient.diabetes_history, hypertension: patient.hypertension }} />
          {patient.diabetes_history && (
            <span className="px-2 py-1 text-[10px] uppercase tracking-widest border border-primary/20 text-primary/60 bg-black">Diabetes</span>
          )}
          {patient.hypertension && (
            <span className="px-2 py-1 text-[10px] uppercase tracking-widest border border-primary/20 text-primary/60 bg-black">Hypertension</span>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-primary/10 flex space-x-3 pl-2">
          <Link to={`/patients/${patient.patient_id}`} className="flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 hover:bg-primary/10 transition-colors">
            View Details
          </Link>
          <Link to={`/analysis/new?patientId=${patient.patient_id}`} className="flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-black bg-primary border border-primary hover:bg-green-400 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.2)]">
            New Analysis
          </Link>
        </div>
      </div>
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
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
        <div>
          <h1 className="text-3xl font-light text-white uppercase tracking-widest">Patient Directory</h1>
        </div>
        <button className="px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-colors flex items-center shadow-[0_0_15px_rgba(34,197,94,0.3)]" onClick={() => setAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </button>
      </div>

      <div className="border border-primary/20 bg-black p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <input
            placeholder="SEARCH RECORDS..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-primary/30 text-white placeholder-primary/30 focus:outline-none focus:border-primary transition-colors text-xs uppercase tracking-widest"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary/60">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-primary/40 text-xs uppercase tracking-widest">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Accessing database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-primary/20 text-primary/40 gap-4">
          <p className="text-xs uppercase tracking-widest">{search ? 'No records match parameters.' : 'Database empty.'}</p>
          {!search && (
            <button className="px-4 py-2 border border-primary text-primary hover:bg-primary/10 transition-colors text-xs uppercase tracking-widest flex items-center" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Initialize Record
            </button>
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
        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
          <button className="px-4 py-2 border border-primary/20 text-primary/60 hover:text-primary hover:border-primary text-xs uppercase tracking-widest transition-colors flex items-center disabled:opacity-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </button>
          <div className="text-[10px] uppercase tracking-widest text-primary/60">Page {page} of {totalPages}</div>
          <button className="px-4 py-2 border border-primary/20 text-primary/60 hover:text-primary hover:border-primary text-xs uppercase tracking-widest transition-colors flex items-center disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </button>
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
        title="DELETE RECORD"
        description={`WARNING: This action will permanently purge "${deleteTarget?.name}" and all associated telemetry from the system.`}
        confirmLabel="Confirm Purge"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
