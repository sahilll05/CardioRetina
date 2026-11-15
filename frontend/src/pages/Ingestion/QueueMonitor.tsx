import React, { useState, useEffect } from 'react';
import { Server, UploadCloud, FolderSync, ShieldCheck, Activity } from 'lucide-react';
import { useWsStore } from '@/store/wsStore';
import { Badge } from '@/components/ui/badge';

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

  useEffect(() => {
    if (!isConnected) return;

    const sources: ('DICOMweb' | 'Legacy_CSTORE' | 'HotFolder')[] = [
      'DICOMweb',
      'Legacy_CSTORE',
      'HotFolder',
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: IngestionEvent = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          source: sources[Math.floor(Math.random() * sources.length)],
          status: Math.random() > 0.1 ? 'completed' : 'failed',
          patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
          filename: `scan_${Math.floor(1000 + Math.random() * 9000)}.dcm`,
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, 25));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium text-foreground tracking-tight">
            PACS &amp; DICOM Ingestion Telemetry
          </h1>
          <Badge variant={isConnected ? 'ok' : 'secondary'}>
            {isConnected ? 'Telemetry Online' : 'Local Queue Idle'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time hospital imaging feeds, DICOM association listeners, and storage commit logs
        </p>
      </div>

      {/* Protocol Listeners Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UploadCloud className="h-3.5 w-3.5 text-cool" /> STOW-RS RESTful API
            </span>
            <Badge variant="cool">Listening</Badge>
          </div>
          <div className="text-sm font-medium text-foreground">HTTPS Endpoint /dicom-web</div>
          <p className="text-[11px] text-muted-foreground">
            WADO-RS / STOW-RS cloud PACS gateway accepting direct browser &amp; camera uploads.
          </p>
        </div>

        <div className="panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cool" /> C-STORE SCP Service
            </span>
            <Badge variant="ok">Port 11112</Badge>
          </div>
          <div className="text-sm font-medium text-foreground">AET: CARDIO_RETINA_SCP</div>
          <p className="text-[11px] text-muted-foreground">
            Standard DICOM C-STORE service class provider receiving scans from hospital modalities.
          </p>
        </div>

        <div className="panel p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FolderSync className="h-3.5 w-3.5 text-cool" /> Directory Watcher
            </span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="text-sm font-medium text-foreground">Hot Folder: /backend/uploads</div>
          <p className="text-[11px] text-muted-foreground">
            Automatic background scanner importing local fundus camera exports into the queue.
          </p>
        </div>
      </div>

      {/* Live Ingestion Log Stream */}
      <div className="panel overflow-hidden">
        <div className="panel-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-medium text-foreground">Ingestion Activity Stream</h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {events.length} captured event{events.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          {events.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
              <p>Awaiting DICOM association traffic…</p>
              <p className="text-[11px] text-muted-foreground/60">
                New incoming imaging studies will stream into this console automatically.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-deep/60 text-muted-foreground border-b border-border text-[11px]">
                <tr>
                  <th className="px-4 py-2 font-normal">Timestamp</th>
                  <th className="px-4 py-2 font-normal">Protocol</th>
                  <th className="px-4 py-2 font-normal">Patient MRN</th>
                  <th className="px-4 py-2 font-normal">Filename</th>
                  <th className="px-4 py-2 font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-deep/40 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{e.timestamp}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-cool">{e.source}</span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{e.patientId || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.filename || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <Badge
                        variant={e.status === 'completed' ? 'ok' : 'destructive'}
                        className="text-[10px]"
                      >
                        {e.status === 'completed' ? 'Ingested' : 'Transfer Failed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
