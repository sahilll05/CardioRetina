import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud, CheckCircle2, ChevronRight, ChevronLeft,
  Search, User as UserIcon, Calendar, Plus, Loader2, X
} from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 font-mono">
      <div className="mb-8 border-b border-primary/20 pb-4">
        <h1 className="text-3xl font-light text-white tracking-widest uppercase">New Analysis</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/20 -z-10 -translate-y-1/2" />
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center bg-black px-4">
              <div className={`w-8 h-8 rounded-none flex items-center justify-center border transition-colors ${
                isActive ? 'border-primary bg-primary text-black' :
                isCompleted ? 'border-primary bg-primary/20 text-primary' :
                'border-primary/20 bg-black text-primary/40'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{step.id}</span>}
              </div>
              <span className={`mt-2 text-center text-xs tracking-widest uppercase ${isActive ? 'text-primary' : 'text-primary/40'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border border-primary/20 bg-black shadow-2xl min-h-[420px] flex flex-col">
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">

            {/* Step 1: Patient & Visit Selection */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                {/* Patient Search */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                    <h3 className="text-sm font-semibold tracking-widest uppercase text-primary flex items-center"><UserIcon className="w-4 h-4 mr-2" /> Select Patient</h3>
                    <button onClick={() => setAddPatientOpen(true)} className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center uppercase tracking-widest">
                      <Plus className="w-3 h-3 mr-1" /> New Patient
                    </button>
                  </div>

                  {selectedPatient ? (
                    <div className="flex items-center justify-between border border-primary p-4 bg-primary/5">
                      <div>
                        <p className="font-semibold text-white">{selectedPatient.name} <span className="text-primary/60 mx-2">/</span> {selectedPatient.patient_id}</p>
                        <p className="text-xs text-primary/60 uppercase tracking-widest mt-1">Age: {selectedPatient.age} | {selectedPatient.gender || 'N/A'}</p>
                      </div>
                      <button onClick={() => { setSelectedPatient(null); setSelectedVisit(null); }} className="text-primary/40 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                        <input
                          placeholder="SEARCH BY NAME OR ID..."
                          className="w-full pl-10 pr-4 py-3 bg-black border border-primary/20 text-white focus:outline-none focus:border-primary placeholder-primary/30 transition-colors uppercase tracking-widest text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {pLoading ? (
                        <div className="flex items-center justify-center h-20 text-primary/40 text-sm tracking-widest uppercase">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border border-primary/20 divide-y divide-primary/10">
                          {filteredPatients.length === 0 ? (
                            <div className="p-4 text-center text-sm text-primary/40 tracking-widest uppercase">
                              No records found.
                            </div>
                          ) : (
                            filteredPatients.slice(0, 10).map((p) => (
                              <div
                                key={p.patient_id}
                                className="p-3 cursor-pointer hover:bg-primary/10 transition-colors text-white"
                                onClick={() => handleSelectPatient(p)}
                              >
                                <p className="font-medium text-sm">{p.name} <span className="text-primary/40 mx-2">/</span> {p.patient_id}</p>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                      <h3 className="text-sm font-semibold tracking-widest uppercase text-primary flex items-center"><Calendar className="w-4 h-4 mr-2" /> Select Visit</h3>
                      <button onClick={() => setAddVisitOpen(true)} className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center uppercase tracking-widest">
                        <Plus className="w-3 h-3 mr-1" /> New Visit
                      </button>
                    </div>

                    {vLoading ? (
                      <div className="flex items-center justify-center h-20 text-primary/40 text-sm tracking-widest uppercase">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                      </div>
                    ) : visits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-primary/30 text-primary/40 gap-3">
                        <p className="text-xs uppercase tracking-widest">No visits for this patient.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {visits.map((v) => (
                          <div
                            key={v.visit_id}
                            className={`border p-4 cursor-pointer transition-colors ${
                              selectedVisit?.visit_id === v.visit_id
                                ? 'border-primary bg-primary/10'
                                : 'border-primary/20 hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedVisit(v)}
                          >
                            <div className="flex justify-between items-center text-white">
                              <p className="font-medium text-sm tracking-widest uppercase">{new Date(v.visit_date).toLocaleDateString()}</p>
                              {selectedVisit?.visit_id === v.visit_id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
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
                <div className="p-3 border border-primary/20 flex justify-between items-center text-xs tracking-widest uppercase text-primary/60">
                  <span>Patient: <span className="text-white">{selectedPatient?.name}</span></span>
                  <span>Visit: <span className="text-white">{selectedVisit && new Date(selectedVisit.visit_date).toLocaleDateString()}</span></span>
                </div>

                <div
                  {...getRootProps()}
                  className={`border border-dashed p-12 text-center transition-colors cursor-pointer ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-primary/40 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-primary/40'}`} />
                  <p className={`text-sm tracking-widest uppercase ${isDragActive ? 'text-primary' : 'text-primary/60'}`}>
                    {isDragActive ? 'Drop scan here' : 'Select or drop retinal scan'}
                  </p>
                </div>

                {preview && (
                  <div className="mt-6 flex flex-col items-center">
                    <div className="border border-primary/40 w-full max-w-[320px] relative p-1 bg-primary/5">
                      <div className="absolute top-2 right-2 flex items-center bg-black/60 px-2 py-1 text-[10px] text-primary uppercase tracking-widest border border-primary/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                      </div>
                      <img src={preview} alt="Preview" className="h-48 w-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <button onClick={() => { setFile(null); setPreview(null); }} className="mt-4 text-xs text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center">
                      <X className="w-3 h-3 mr-1" /> Remove
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 border-b border-primary/20 pb-2">Target Subject</h4>
                      <div className="text-sm space-y-2 text-white">
                        <p><span className="text-primary/60 inline-block w-24">NAME:</span> {selectedPatient?.name}</p>
                        <p><span className="text-primary/60 inline-block w-24">ID:</span> {selectedPatient?.patient_id}</p>
                        <p><span className="text-primary/60 inline-block w-24">VISIT:</span> {selectedVisit && new Date(selectedVisit.visit_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 border-b border-primary/20 pb-2">Scan Data</h4>
                    {preview ? (
                      <div className="border border-primary/20 bg-primary/5 p-1">
                        <img src={preview} alt="Preview" className="w-full h-40 object-cover opacity-80" />
                        <div className="p-2 text-[10px] text-center text-primary/60 truncate uppercase tracking-widest">{file?.name}</div>
                      </div>
                    ) : (
                      <div className="w-full h-40 border border-dashed border-primary/20 flex items-center justify-center text-primary/30 uppercase text-xs tracking-widest">No data</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-primary/20 p-6 flex justify-between items-center bg-black">
          <button 
            className="px-6 py-2 text-xs tracking-widest uppercase border border-primary/20 text-primary/60 hover:text-primary hover:border-primary transition-colors disabled:opacity-30 flex items-center"
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))} 
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </button>
          
          {currentStep < 3 ? (
            <button
              className="px-6 py-2 text-xs tracking-widest uppercase border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 flex items-center"
              onClick={() => setCurrentStep((p) => Math.min(p + 1, 3))}
              disabled={currentStep === 1 ? !canGoToStep2 : currentStep === 2 ? !file : false}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={submitAnalysis}
              disabled={!canSubmit || submitting}
              className="px-8 py-2 text-xs font-bold tracking-widest uppercase bg-primary text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Initiate Sequence'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal open={addPatientOpen} onClose={() => setAddPatientOpen(false)} onSave={handleCreatePatient} />
      {selectedPatient && (
        <AddVisitModal open={addVisitOpen} patientId={selectedPatient.patient_id} onClose={() => setAddVisitOpen(false)} onSave={handleCreateVisit} />
      )}
    </div>
  );
}
