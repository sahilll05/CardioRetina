import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud, CheckCircle2, ChevronRight, ChevronLeft,
  Search, User as UserIcon, Calendar, Plus, Loader2, AlertTriangle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { usePatients, type PatientData } from '@/hooks/usePatients';
import { useVisits, type VisitData } from '@/hooks/useVisits';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AddPatientModal } from '@/components/modals/AddPatientModal';
import { AddVisitModal } from '@/components/modals/AddVisitModal';

const steps = [
  { id: 1, title: 'Select Patient & Visit' },
  { id: 2, title: 'Upload Retinal Image' },
  { id: 3, title: 'Review & Submit' },
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

  // Pre-fill from URL params (e.g. from PatientDetail "New Analysis" button)
  useEffect(() => {
    fetchPatients();
    const prePatientId = searchParams.get('patientId');
    if (prePatientId) {
      // will be set once patients load
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
      visit_id: selectedVisit.visit_id,
      age: selectedPatient.age,
      bp_systolic: selectedVisit.bp_systolic || undefined,
      bp_diastolic: selectedVisit.bp_diastolic || undefined,
      blood_sugar: selectedVisit.blood_sugar || undefined,
      cholesterol: selectedVisit.cholesterol || undefined,
      diabetes_history: selectedPatient.diabetes_history,
      image: file,
    });

    if (jobId) {
      navigate(`/analysis/${jobId}`);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-muted-foreground mt-1">Upload a retinal image to begin AI processing.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border -z-10 -translate-y-1/2" />
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center bg-background px-2 sm:px-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                isActive ? 'border-primary bg-primary text-primary-foreground' :
                isCompleted ? 'border-primary bg-primary/10 text-primary' :
                'border-border bg-background text-muted-foreground'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="font-semibold text-sm sm:text-base">{step.id}</span>}
              </div>
              <span className={`mt-2 text-center text-xs sm:text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="shadow-lg min-h-[420px] flex flex-col">
        <CardContent className="p-8 flex-1">
          <AnimatePresence mode="wait">

            {/* Step 1: Patient & Visit Selection */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                {/* Patient Search */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center"><UserIcon className="w-5 h-5 mr-2 text-primary" /> Select Patient</h3>
                    <Button variant="outline" size="sm" onClick={() => setAddPatientOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> New Patient
                    </Button>
                  </div>

                  {selectedPatient ? (
                    <div className="flex items-center justify-between border rounded-lg p-4 bg-primary/5 border-primary">
                      <div>
                        <p className="font-semibold">{selectedPatient.name} — {selectedPatient.patient_id}</p>
                        <p className="text-sm text-muted-foreground">Age: {selectedPatient.age} | {selectedPatient.gender || 'N/A'}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedPatient(null); setSelectedVisit(null); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search patient by name or ID..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {pLoading ? (
                        <div className="flex items-center justify-center h-20 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading patients...
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                          {filteredPatients.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No patients found. <button className="text-primary underline" onClick={() => setAddPatientOpen(true)}>Create one</button>
                            </div>
                          ) : (
                            filteredPatients.slice(0, 10).map((p) => (
                              <div
                                key={p.patient_id}
                                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelectPatient(p)}
                              >
                                <p className="font-medium text-sm">{p.name} — {p.patient_id}</p>
                                <p className="text-xs text-muted-foreground">Age: {p.age} | {p.gender || 'N/A'}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Visit Selection */}
                {selectedPatient && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center"><Calendar className="w-5 h-5 mr-2 text-primary" /> Select Visit</h3>
                      <Button variant="outline" size="sm" onClick={() => setAddVisitOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> New Visit
                      </Button>
                    </div>

                    {vLoading ? (
                      <div className="flex items-center justify-center h-20 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading visits...
                      </div>
                    ) : visits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground gap-3">
                        <p className="text-sm">No visits for this patient.</p>
                        <Button size="sm" onClick={() => setAddVisitOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" /> Create First Visit
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {visits.map((v) => (
                          <div
                            key={v.visit_id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedVisit?.visit_id === v.visit_id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedVisit(v)}
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-sm">{new Date(v.visit_date).toLocaleDateString()}</p>
                              {selectedVisit?.visit_id === v.visit_id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {v.bp_systolic ? `BP: ${v.bp_systolic}/${v.bp_diastolic} mmHg` : ''}
                              {v.blood_sugar ? ` · Sugar: ${v.blood_sugar} mg/dL` : ''}
                              {!v.bp_systolic && !v.blood_sugar ? 'No measurements recorded' : ''}
                            </p>
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
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-muted/50 p-3 rounded-md flex justify-between items-center text-sm font-medium border">
                  <span>Patient: {selectedPatient?.name}</span>
                  <span className="text-muted-foreground">Visit: {selectedVisit && new Date(selectedVisit.visit_date).toLocaleDateString()}</span>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  {isDragActive ? (
                    <p className="text-lg font-medium text-primary">Drop the image here...</p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-1">Drag & drop retinal image</p>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                      <Button variant="secondary">Browse Files</Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">JPEG, PNG · Max 10MB</p>
                </div>

                {preview && (
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-sm font-medium mb-2 text-success flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Image ready
                    </p>
                    <div className="rounded-lg overflow-hidden border shadow-sm flex justify-center w-full max-w-[320px]">
                      <img src={preview} alt="Preview" className="h-48 w-full object-cover" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={() => { setFile(null); setPreview(null); }}>
                      <X className="w-3.5 h-3.5 mr-1.5" /> Remove
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Patient</h4>
                      <div className="bg-muted/30 p-4 rounded-lg border text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {selectedPatient?.name}</p>
                        <p><span className="font-medium">Age:</span> {selectedPatient?.age}</p>
                        <p><span className="font-medium">ID:</span> {selectedPatient?.patient_id}</p>
                        <p><span className="font-medium">Diabetes:</span> {selectedPatient?.diabetes_history ? 'Yes' : 'No'}</p>
                        <p><span className="font-medium">Hypertension:</span> {selectedPatient?.hypertension ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visit Data</h4>
                      <div className="bg-muted/30 p-4 rounded-lg border text-sm space-y-1">
                        <p><span className="font-medium">Date:</span> {selectedVisit && new Date(selectedVisit.visit_date).toLocaleDateString()}</p>
                        {selectedVisit?.bp_systolic && <p><span className="font-medium">BP:</span> {selectedVisit.bp_systolic}/{selectedVisit.bp_diastolic} mmHg</p>}
                        {selectedVisit?.blood_sugar && <p><span className="font-medium">Blood Sugar:</span> {selectedVisit.blood_sugar} mg/dL</p>}
                        {selectedVisit?.cholesterol && <p><span className="font-medium">Cholesterol:</span> {selectedVisit.cholesterol} mg/dL</p>}
                        {selectedVisit?.hba1c && <p><span className="font-medium">HbA1c:</span> {selectedVisit.hba1c}%</p>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Retinal Image</h4>
                    {preview ? (
                      <div className="rounded-lg overflow-hidden border shadow-sm">
                        <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                        <div className="bg-muted p-2 text-xs text-center border-t text-muted-foreground truncate">{file?.name}</div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-muted border rounded-lg flex items-center justify-center text-muted-foreground">No image</div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> AI analysis may take 2–5 minutes depending on image resolution and server load. Do not close this page after submitting.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <div className="border-t p-6 bg-muted/20 flex justify-between items-center">
          <Button variant="outline" onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))} disabled={currentStep === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep((p) => Math.min(p + 1, 3))}
              disabled={currentStep === 1 ? !canGoToStep2 : currentStep === 2 ? !file : false}
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submitAnalysis}
              disabled={!canSubmit || submitting}
              className="bg-primary shadow-md"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                'Start Analysis'
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Modals */}
      <AddPatientModal open={addPatientOpen} onClose={() => setAddPatientOpen(false)} onSave={handleCreatePatient} />
      {selectedPatient && (
        <AddVisitModal open={addVisitOpen} patientId={selectedPatient.patient_id} onClose={() => setAddVisitOpen(false)} onSave={handleCreateVisit} />
      )}
    </div>
  );
}
