import { useState } from 'react';
import { User, Bell, Palette, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/auth/authStore';

export function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-medium text-foreground tracking-tight">
          System Preferences &amp; Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage clinical workstation credentials, notification routes, and display settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full md:w-52 shrink-0 space-y-1">
          <button
            type="button"
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded transition-colors duration-150 text-left border ${
              activeTab === 'profile'
                ? 'bg-surface border-border-strong text-foreground font-medium shadow-sm'
                : 'border-transparent text-muted-foreground hover:bg-surface hover:text-foreground'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Profile &amp; Security</span>
          </button>

          <button
            type="button"
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded transition-colors duration-150 text-left border ${
              activeTab === 'notifications'
                ? 'bg-surface border-border-strong text-foreground font-medium shadow-sm'
                : 'border-transparent text-muted-foreground hover:bg-surface hover:text-foreground'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Clinical Alerts</span>
          </button>

          <button
            type="button"
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded transition-colors duration-150 text-left border ${
              activeTab === 'appearance'
                ? 'bg-surface border-border-strong text-foreground font-medium shadow-sm'
                : 'border-transparent text-muted-foreground hover:bg-surface hover:text-foreground'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Display &amp; Locale</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Account Details */}
              <div className="panel overflow-hidden">
                <div className="panel-header">
                  <h2 className="text-xs font-medium text-foreground">Clinician Profile</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Full clinician name</label>
                    <input
                      className="w-full bg-surface-deep border border-border p-2 text-foreground text-xs rounded focus:border-border-strong focus:outline-none"
                      defaultValue={user?.name || 'Dr. Sarah Johnson'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Clinical email</label>
                    <input
                      className="w-full bg-surface-deep border border-border p-2 text-foreground text-xs rounded focus:border-border-strong focus:outline-none"
                      type="email"
                      defaultValue={user?.email || 'sarah.johnson@hospital.org'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Medical specialty</label>
                    <input
                      className="w-full bg-surface-deep border border-border p-2 text-muted-foreground text-xs rounded cursor-not-allowed"
                      readOnly
                      defaultValue={user?.specialization || 'Cardiology / Ophthalmology'}
                    />
                  </div>
                </div>

                <div className="border-t border-border p-3.5 bg-surface-deep/40 flex items-center justify-between">
                  {saveSuccess && (
                    <span className="text-xs text-ok flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Preferences saved
                    </span>
                  )}
                  <div className="ml-auto">
                    <Button onClick={handleSave} size="sm" className="text-xs h-8">
                      <Save className="w-3.5 h-3.5 mr-1.5" /> Save changes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="panel overflow-hidden">
                <div className="panel-header">
                  <h2 className="text-xs font-medium text-foreground">Workstation Security</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Current password</label>
                    <input
                      className="w-full bg-surface-deep border border-border p-2 text-foreground text-xs rounded focus:border-border-strong focus:outline-none font-mono"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">New password</label>
                    <input
                      className="w-full bg-surface-deep border border-border p-2 text-foreground text-xs rounded focus:border-border-strong focus:outline-none font-mono"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="border-t border-border p-3.5 bg-surface-deep/40 flex justify-end">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Update security password
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="panel overflow-hidden">
              <div className="panel-header">
                <h2 className="text-xs font-medium text-foreground">Clinical Alert Routing</h2>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-xs font-medium text-foreground pb-2 border-b border-border">
                    Automated Event Notifications
                  </h3>
                  <div className="mt-3 space-y-3 text-xs text-foreground">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border bg-surface-deep text-primary focus:ring-0"
                        defaultChecked
                      />
                      <span>Notify when retinal scan analysis completes</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border bg-surface-deep text-primary focus:ring-0"
                        defaultChecked
                      />
                      <span>Flag immediate alert on high cardiovascular risk detection</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border bg-surface-deep text-primary focus:ring-0"
                      />
                      <span className="text-muted-foreground">Send weekly clinical digest report</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-foreground pb-2 border-b border-border">
                    PACS Ingestion Feed Alerts
                  </h3>
                  <div className="mt-3 space-y-3 text-xs text-foreground">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border bg-surface-deep text-primary focus:ring-0"
                        defaultChecked
                      />
                      <span>Display banner for incoming DICOM modality transfers</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border bg-surface-deep text-primary focus:ring-0"
                        defaultChecked
                      />
                      <span>Alert when hot folder watcher detects new images</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-3.5 bg-surface-deep/40 flex justify-end">
                <Button onClick={handleSave} size="sm" className="text-xs h-8">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save routing preferences
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="panel overflow-hidden">
              <div className="panel-header">
                <h2 className="text-xs font-medium text-foreground">Interface Configuration</h2>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Visual Clinical Theme
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                    <div className="p-3.5 rounded border border-border-strong bg-surface flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-foreground">Graphite Console</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          High-contrast clinical telemetry
                        </div>
                      </div>
                      <Badge variant="ok">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border max-w-sm space-y-1.5">
                  <label className="text-xs text-muted-foreground block">
                    Diagnostic Report Language
                  </label>
                  <select className="w-full bg-surface-deep border border-border p-2 text-foreground text-xs rounded focus:border-border-strong focus:outline-none">
                    <option>English (Clinical Standard)</option>
                    <option>Spanish (ES-LA)</option>
                    <option>French (FR)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border p-3.5 bg-surface-deep/40 flex justify-end">
                <Button onClick={handleSave} size="sm" className="text-xs h-8">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Apply preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
