import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud, CheckCircle2, ChevronRight, ChevronLeft,
  Search, User as UserIcon, Calendar, Plus, Loader2, X, Activity, Image as ImageIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { usePatients, type PatientData } from '@/hooks/usePatients';
import { useVisits, type VisitData } from '@/hooks/useVisits';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { AddVisitModal } from '@/components/modals/AddVisitModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const steps = [
  { id: 1, title: 'Patient & Visit' },
  { id: 2, title: 'Retinal Image Scan' },
  { id: 3, title: 'Review & Execute' },
];

export function NewAnalysisWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [addVisitOpen, setAddVisitOpen] = useState(false);

  const { patients, loading: pLoading, fetchPatients, createPatient } = usePatients();
  const { visits, loading: vLoading, fetchPatientVisits, createVisit } = useVisits();
  const { startAnalysis, submitting } = useAnalysis();

  // Pre-fill from URL params
  useEffect(() => {
    fetchPatients();
    const prePatientId = searchParams.get('patientId');
    if (prePatientId) {
      setSearchQuery(prePatientId);
    }
  }, []);

  // Auto-select patient from URL param once patients load
  useEffect(() => {
    const prePatientId = searchParams.get('patientId');
    if (prePatientId && patients.length > 0) {
      const found = patients.find((p) => p.patient_id === prePatientId);
      if (found) {
        setSelectedPatient(found);
        fetchPatientVisits(found.patient_id);
        setSearchQuery('');
      }
    }
  }, [patients]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxSize: 10485760,
  });

  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatient(patient);
    setSelectedVisit(null);
    fetchPatientVisits(patient.patient_id);
  };

  const handleCreatePatient = async (data: any) => {
    const result = await createPatient(data);
    if (result) {
      await fetchPatients();
      handleSelectPatient(result);
    }
    return result;
  };

  const handleCreateVisit = async (data: any) => {
    const result = await createVisit(data);
    if (result && selectedPatient) {
      await fetchPatientVisits(selectedPatient.patient_id);
      setSelectedVisit(result);
    }
    return result;
  };

  const canGoToStep2 = selectedPatient && selectedVisit;
  const canSubmit = selectedPatient && selectedVisit && file;

  const submitAnalysis = async () => {
    if (!selectedPatient || !selectedVisit || !file) return;

    const jobId = await startAnalysis({
      patient_id: selectedPatient.patient_id,
      visit_id: String(selectedVisit.visit_id),
      age: selectedPatient.age,
      bp_systolic: selectedVisit.bp_systolic ?? undefined,
      bp_diastolic: selectedVisit.bp_diastolic ?? undefined,
      blood_sugar: selectedVisit.blood_sugar ?? undefined,
      cholesterol: selectedVisit.cholesterol ?? undefined,
      diabetes_history: selectedPatient.diabetes_history,
      image: file,
    });

    if (jobId) {
      const saved: Array<{ job_id: string; patient_name: string }> = JSON.parse(
        localStorage.getItem('cr_completed_jobs') || '[]'
      );
      if (!saved.find((j) => j.job_id === jobId)) {
        saved.push({ job_id: jobId, patient_name: selectedPatient.name });
        localStorage.setItem('cr_completed_jobs', JSON.stringify(saved));
      }
      navigate(`/analysis/${jobId}`);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-medium text-foreground tracking-tight">
          New Retinal Analysis
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select patient case, upload fundus scan, and initiate neural pipeline.
        </p>
      </div>

      {/* Step Tracker */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute top-1/2 left-6 right-6 h-px bg-border -translate-y-1/2 -z-0" />
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center bg-background px-3">
              <div
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono transition-colors duration-150 border ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : isCompleted
                    ? 'border-ok/60 bg-ok/10 text-ok'
                    : 'border-border bg-surface text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium text-center ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Wizard Step Box */}
      <div className="panel overflow-hidden">
        <div className="p-6 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Patient & Visit */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6 flex-1"
              >
                {/* Patient Search Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      Patient Record Selection
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddPatientOpen(true)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New patient
                    </button>
                  </div>

                  {selectedPatient ? (
                    <div className="panel p-3.5 flex items-center justify-between bg-surface-deep border-border-strong">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {selectedPatient.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          ID: {selectedPatient.patient_id} · Age: {selectedPatient.age} · {selectedPatient.gender || 'Not specified'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setSelectedVisit(null);
                        }}
                        className="text-muted-foreground hover:text-foreground p-1 rounded"
                        aria-label="Deselect patient"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          placeholder="Search patient by name or medical record ID…"
                          className="w-full pl-9 pr-3 py-2 bg-surface-deep border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-border-strong text-xs rounded"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {pLoading ? (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Loading records…</span>
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border border-border rounded divide-y divide-border bg-surface-deep/40">
                          {filteredPatients.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No matching patient records found.
                            </div>
                          ) : (
                            filteredPatients.slice(0, 8).map((p) => (
                              <button
                                key={p.patient_id}
                                type="button"
                                className="w-full p-2.5 text-left hover:bg-surface text-foreground flex justify-between items-center transition-colors text-xs"
                                onClick={() => handleSelectPatient(p)}
                              >
                                <span className="font-medium">{p.name}</span>
                                <span className="font-mono text-muted-foreground text-[11px]">
                                  {p.patient_id}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Visit Selection Section */}
                {selectedPatient && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Clinical Visit
                      </span>
                      <button
                        type="button"
                        onClick={() => setAddVisitOpen(true)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> New visit
                      </button>
                    </div>

                    {vLoading ? (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Loading visits…</span>
                      </div>
                    ) : visits.length === 0 ? (
                      <div className="p-4 border border-dashed border-border rounded text-center text-xs text-muted-foreground space-y-2">
                        <p>No historical visits found for this patient.</p>
                        <Button
                          onClick={() => setAddVisitOpen(true)}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Log today’s visit
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {visits.map((v) => (
                          <div
                            key={v.visit_id}
                            className={`p-3 rounded border cursor-pointer transition-colors duration-150 flex justify-between items-center text-xs ${
                              selectedVisit?.visit_id === v.visit_id
                                ? 'border-primary bg-surface text-foreground font-medium'
                                : 'border-border bg-surface-deep/50 text-muted-foreground hover:bg-surface hover:text-foreground'
                            }`}
                            onClick={() => setSelectedVisit(v)}
                          >
                            <div>
                              <span className="font-mono">Visit #{v.visit_id}</span>
                              <span className="mx-2 text-border-strong">·</span>
                              <span>
                                {new Date(v.visit_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            {selectedVisit?.visit_id === v.visit_id && (
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Image Upload */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4 flex-1"
              >
                <div className="p-2.5 rounded border border-border bg-surface-deep text-xs text-muted-foreground flex justify-between items-center">
                  <span>
                    Selected: <strong className="text-foreground">{selectedPatient?.name}</strong>
                  </span>
                  <span>
                    Visit #{selectedVisit?.visit_id} (
                    {selectedVisit && new Date(selectedVisit.visit_date).toLocaleDateString()}
                    )
                  </span>
                </div>

                <div
                  {...getRootProps()}
                  className={`border border-dashed rounded p-10 text-center transition-colors duration-150 cursor-pointer ${
                    isDragActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-border-strong bg-surface-deep/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">
                    {isDragActive ? 'Drop retinal scan file here' : 'Drop retinal fundus image here, or click to browse'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Accepts JPEG or PNG format up to 10 MB. High-resolution color fundus photographs recommended.
                  </p>
                </div>

                {preview && (
                  <div className="pt-2 flex flex-col items-center">
                    <div className="panel p-2 w-full max-w-sm relative">
                      <div className="absolute top-3 right-3 bg-surface/90 border border-border px-2 py-0.5 rounded text-[11px] text-ok flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </div>
                      <img
                        src={preview}
                        alt="Retinal Fundus Preview"
                        className="h-44 w-full object-cover rounded border border-border"
                      />
                      <div className="mt-2 text-center text-xs text-muted-foreground truncate">
                        {file?.name} ({(file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="mt-3 text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove scan
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6 flex-1"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="panel p-4 space-y-3">
                    <h3 className="text-xs font-medium text-foreground border-b border-border pb-2">
                      Patient Clinical Profile
                    </h3>
                    <div className="text-xs space-y-1.5 text-muted-foreground">
                      <p>
                        <span className="inline-block w-28 text-muted-foreground">Name:</span>
                        <strong className="text-foreground">{selectedPatient?.name}</strong>
                      </p>
                      <p>
                        <span className="inline-block w-28 text-muted-foreground">Record ID:</span>
                        <span className="font-mono text-foreground">{selectedPatient?.patient_id}</span>
                      </p>
                      <p>
                        <span className="inline-block w-28 text-muted-foreground">Age / Sex:</span>
                        <span className="text-foreground">{selectedPatient?.age} yrs / {selectedPatient?.gender || 'N/A'}</span>
                      </p>
                      <p>
                        <span className="inline-block w-28 text-muted-foreground">Visit date:</span>
                        <span className="text-foreground">
                          {selectedVisit && new Date(selectedVisit.visit_date).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="panel p-4 space-y-3">
                    <h3 className="text-xs font-medium text-foreground border-b border-border pb-2">
                      Scan Telemetry Ready
                    </h3>
                    {preview ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={preview}
                          alt="Retinal Preview"
                          className="w-16 h-16 object-cover rounded border border-border shrink-0"
                        />
                        <div className="text-xs min-w-0">
                          <p className="font-medium text-foreground truncate">{file?.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Status: Validated for sequential pipeline
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No scan file uploaded.
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel p-4 bg-surface-deep text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span>Neural Pipeline Verification</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Executing sequential inference: Stage 1 Quality Check (MobileNetV3) &rarr; Stage 2 Vessel Segmentation (U-Net++) &rarr; Stage 3 Arteriolar/Venular Ratio &rarr; Stage 4 Diabetic Retinopathy Classification (EfficientNet-B3).
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls */}
        <div className="border-t border-border p-4 bg-surface-deep flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>

          {currentStep < 3 ? (
            <Button
              size="sm"
              className="text-xs h-8"
              onClick={() => setCurrentStep((p) => Math.min(p + 1, 3))}
              disabled={currentStep === 1 ? !canGoToStep2 : currentStep === 2 ? !file : false}
            >
              Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={submitAnalysis}
              disabled={!canSubmit || submitting}
              className="text-xs h-8 font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Initiating neural pipeline…
                </>
              ) : (
                'Run Retinal Analysis'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        open={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        onSave={handleCreatePatient}
      />
      {selectedPatient && (
        <AddVisitModal
          open={addVisitOpen}
          patientId={selectedPatient.patient_id}
          onClose={() => setAddVisitOpen(false)}
          onSave={handleCreateVisit}
        />
      )}
    </div>
  );
}
