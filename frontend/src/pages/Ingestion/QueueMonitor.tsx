import React, { useState, useEffect } from 'react';
import { Activity, Server, UploadCloud, Terminal } from 'lucide-react';
import { useWsStore } from '@/store/wsStore';
import { motion, AnimatePresence } from 'framer-motion';

interface IngestionEvent {
  id: string;
  timestamp: string;
  source: 'DICOMweb' | 'Legacy_CSTORE' | 'HotFolder';
  status: 'processing' | 'completed' | 'failed';
  patientId?: string;
  filename?: string;
}

export const QueueMonitor: React.FC = () => {
  const { isConnected } = useWsStore();
  const [events, setEvents] = useState<IngestionEvent[]>([]);

  // Mocking real-time events for UI demonstration
  useEffect(() => {
    if (!isConnected) return;
    
    const sources: ('DICOMweb' | 'Legacy_CSTORE' | 'HotFolder')[] = ['DICOMweb', 'Legacy_CSTORE', 'HotFolder'];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: IngestionEvent = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          source: sources[Math.floor(Math.random() * sources.length)],
          status: Math.random() > 0.1 ? 'completed' : 'failed',
          patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
          filename: `scan_${Math.floor(1000 + Math.random() * 9000)}.dcm`
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 20));
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-mono">
      <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
        <Terminal className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Ingestion Queue</h1>
          <p className="text-primary/50 mt-1 text-xs uppercase tracking-widest">
            Live DICOM Traffic Monitor
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border border-primary/20 bg-black/60 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <div className="flex items-center gap-2 text-primary/60 text-xs uppercase tracking-widest mb-2">
            <UploadCloud className="h-4 w-4" /> STOW-RS
          </div>
          <div className="text-xl text-white">Listening</div>
          <p className="text-xs text-primary mt-1">Cloud API Active</p>
        </div>
        
        <div className="p-4 border border-primary/20 bg-black/60 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <div className="flex items-center gap-2 text-primary/60 text-xs uppercase tracking-widest mb-2">
            <Server className="h-4 w-4" /> C-STORE SCP
          </div>
          <div className="text-xl text-white">Port 11112</div>
          <p className="text-xs text-primary mt-1">Accepting associations</p>
        </div>

        <div className="p-4 border border-primary/20 bg-black/60 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
          <div className="flex items-center gap-2 text-primary/60 text-xs uppercase tracking-widest mb-2">
            <Activity className="h-4 w-4" /> Watchdog
          </div>
          <div className="text-xl text-white">Hot Folder</div>
          <p className="text-xs text-primary mt-1">Scanning directory</p>
        </div>
      </div>

      <div className="border border-primary/20 bg-black/80 rounded-none">
        <div className="p-3 border-b border-primary/20 bg-primary/5 text-primary text-xs uppercase tracking-widest flex justify-between items-center">
          <span>Live Activity Feed</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Active</span>
        </div>
        <div className="p-4 h-[400px] overflow-y-auto font-mono text-sm">
          <div className="space-y-2">
            <AnimatePresence>
              {events.length === 0 ? (
                <div className="text-primary/40 py-4 opacity-50 flex items-center gap-2">
                  <span className="animate-pulse">_</span> Waiting for events...
                </div>
              ) : (
                events.map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors px-2"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'completed' ? 'bg-primary' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                      <div>
                        <span className="text-white mr-4">[{event.timestamp}]</span>
                        <span className="text-primary/80">{event.patientId}</span>
                        <span className="text-primary/40 mx-2">/</span>
                        <span className="text-primary/60">{event.filename}</span>
                      </div>
                    </div>
                    <span className="text-xs border border-primary/30 px-2 py-0.5 text-primary/70 uppercase tracking-wider bg-primary/10">
                      {event.source}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
