import { useState } from 'react';
import { User, Bell, Palette, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance'>('profile');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1000px] mx-auto font-mono">
      <div className="border-b border-primary/20 pb-4">
        <h1 className="text-3xl font-light tracking-widest text-white uppercase">System Preferences</h1>
        <p className="text-primary/60 mt-1 text-xs tracking-widest uppercase">Configure user profile and environment parameters.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col w-full md:w-[250px] space-y-2 border-r border-primary/20 pr-4">
          <button 
            className={`flex items-center text-xs tracking-widest uppercase px-4 py-3 border transition-colors ${activeTab === 'profile' ? 'bg-primary/10 border-primary text-primary' : 'bg-black border-transparent text-primary/40 hover:bg-primary/5 hover:text-primary/80'}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-4 h-4 mr-3" /> Profile
          </button>
          <button 
            className={`flex items-center text-xs tracking-widest uppercase px-4 py-3 border transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 border-primary text-primary' : 'bg-black border-transparent text-primary/40 hover:bg-primary/5 hover:text-primary/80'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="w-4 h-4 mr-3" /> Notifications
          </button>
          <button 
            className={`flex items-center text-xs tracking-widest uppercase px-4 py-3 border transition-colors ${activeTab === 'appearance' ? 'bg-primary/10 border-primary text-primary' : 'bg-black border-transparent text-primary/40 hover:bg-primary/5 hover:text-primary/80'}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette className="w-4 h-4 mr-3" /> Appearance
          </button>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="border border-primary/20 bg-black">
                <div className="px-6 py-3 border-b border-primary/20 bg-primary/5 text-xs font-bold text-primary tracking-widest uppercase">
                  Account Details
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">Full Name</label>
                    <input className="w-full bg-black border border-primary/30 p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors" defaultValue="Dr. Sarah Johnson" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">Email</label>
                    <input className="w-full bg-black border border-primary/30 p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors" type="email" defaultValue="sarah.johnson@hospital.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">Role</label>
                    <input className="w-full bg-primary/5 border border-primary/10 p-2 text-primary/40 text-sm cursor-not-allowed" readOnly defaultValue="Ophthalmologist" />
                  </div>
                </div>
                <div className="border-t border-primary/20 p-4 bg-primary/5 flex justify-end">
                  <button className="px-6 py-2 bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-green-400 transition-colors flex items-center shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </div>

              <div className="border border-primary/20 bg-black">
                <div className="px-6 py-3 border-b border-primary/20 bg-primary/5 text-xs font-bold text-primary tracking-widest uppercase">
                  Security
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">Current Password</label>
                    <input className="w-full bg-black border border-primary/30 p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors" type="password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">New Password</label>
                    <input className="w-full bg-black border border-primary/30 p-2 text-white text-sm focus:border-primary focus:outline-none transition-colors" type="password" />
                  </div>
                </div>
                <div className="border-t border-primary/20 p-4 flex justify-end">
                  <button className="px-6 py-2 border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors">
                    Update Security
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="border border-primary/20 bg-black">
                <div className="px-6 py-3 border-b border-primary/20 bg-primary/5 text-xs font-bold text-primary tracking-widest uppercase">
                  Alert Preferences
                </div>
                <div className="p-6 space-y-8">
                  <div>
                    <h3 className="mb-4 text-xs tracking-widest uppercase text-primary/80 border-b border-primary/20 pb-2">Email Routing</h3>
                    <div className="space-y-4 text-sm text-white">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="accent-primary" defaultChecked />
                        <span className="group-hover:text-primary transition-colors">Analysis sequence completed</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="accent-primary" defaultChecked />
                        <span className="group-hover:text-primary transition-colors">High-risk anomalies detected</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="accent-primary" />
                        <span className="text-primary/40 group-hover:text-primary/70 transition-colors">Weekly telemtry digest</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-4 text-xs tracking-widest uppercase text-primary/80 border-b border-primary/20 pb-2">Dashboard Alerts</h3>
                    <div className="space-y-4 text-sm text-white">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="accent-primary" defaultChecked />
                        <span className="group-hover:text-primary transition-colors">Real-time processing updates</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="accent-primary" defaultChecked />
                        <span className="group-hover:text-primary transition-colors">Database activity</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="border-t border-primary/20 p-4 bg-primary/5 flex justify-end">
                  <button className="px-6 py-2 bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-green-400 transition-colors flex items-center shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <Save className="w-4 h-4 mr-2" /> Commit Settings
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="border border-primary/20 bg-black">
                <div className="px-6 py-3 border-b border-primary/20 bg-primary/5 text-xs font-bold text-primary tracking-widest uppercase">
                  Interface Engine
                </div>
                <div className="p-6 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">Color Scheme</label>
                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                      <div className="border border-primary bg-primary/10 cursor-pointer p-4 text-center">
                        <div className="text-primary text-xs uppercase tracking-widest font-bold">Terminal Dark</div>
                      </div>
                      <div className="border border-primary/20 opacity-30 cursor-not-allowed p-4 text-center flex items-center justify-center">
                        <div className="text-primary text-xs uppercase tracking-widest">Light (Disabled)</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-primary/20 max-w-sm">
                    <label className="text-[10px] tracking-widest uppercase text-primary/60">Language Pack</label>
                    <select className="w-full bg-black border border-primary/30 p-2 text-white text-xs uppercase tracking-widest focus:border-primary focus:outline-none transition-colors cursor-pointer">
                      <option>English (US) [Active]</option>
                      <option>Spanish [Pending Update]</option>
                      <option>French [Pending Update]</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-primary/20 p-4 bg-primary/5 flex justify-end">
                  <button className="px-6 py-2 bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-green-400 transition-colors flex items-center shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <Save className="w-4 h-4 mr-2" /> Apply Config
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
