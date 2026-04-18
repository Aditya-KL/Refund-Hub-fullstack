import React, { useState, useEffect } from 'react';
import { apiService } from '../services/db_service';
import {
  Settings, Shield, Globe, Landmark, Save, RefreshCcw,
  AlertTriangle, CheckCircle2, Database, Bell, Lock,
  ChevronDown, ChevronUp, Server, FileText, Zap,
} from 'lucide-react';

const API_BASE = '/api';

interface ServerSettings {
  // --- REPLACED portalActive WITH 3 NEW PORTALS ---
  messPortalActive: boolean; 
  festPortalActive: boolean; 
  hospitalPortalActive: boolean; 
  // ------------------------------------------------
  registrationOpen: boolean; maintenanceMode: boolean; maintenanceMessage: string;
  messRebateRateDaily: number; maxFestReimbursement: number; maxMedicalReimbursement: number;
  maxAccountClaim: number; maxMessRebateDays: number; autoApproveBelow: number;
  maxClaimsPerMonth: number; claimExpiryDays: number; maxFileUploadMB: number; sessionTimeoutMinutes: number;
  emailNotificationsEnabled: boolean; smsNotificationsEnabled: boolean; notifyOnNewClaim: boolean;
  notifyOnApproval: boolean; notifyOnRejection: boolean; adminEmailCc: string;
  maxLoginAttempts: number; lockoutDurationMinutes: number; requireTwoFactor: boolean;
  passwordExpiryDays: number; allowMultipleSessions: boolean;
  dbBackupEnabled: boolean; dbBackupFrequencyHours: number; logRetentionDays: number; rateLimitRequestsPerMin: number;
}

const defaultSettings: ServerSettings = {
  // --- DEFAULT VALUES FOR NEW PORTALS ---
  messPortalActive: true, 
  festPortalActive: true, 
  hospitalPortalActive: true,
  // --------------------------------------
  registrationOpen: true, maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please check back shortly.',
  messRebateRateDaily: 150, maxFestReimbursement: 5000, maxMedicalReimbursement: 10000,
  maxAccountClaim: 25000, maxMessRebateDays: 30, autoApproveBelow: 500,
  maxClaimsPerMonth: 5, claimExpiryDays: 90, maxFileUploadMB: 10, sessionTimeoutMinutes: 60,
  emailNotificationsEnabled: true, smsNotificationsEnabled: false, notifyOnNewClaim: true,
  notifyOnApproval: true, notifyOnRejection: true, adminEmailCc: 'superadmin@institution.edu',
  maxLoginAttempts: 5, lockoutDurationMinutes: 30, requireTwoFactor: false,
  passwordExpiryDays: 90, allowMultipleSessions: false,
  dbBackupEnabled: true, dbBackupFrequencyHours: 24, logRetentionDays: 365, rateLimitRequestsPerMin: 100,
};

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, iconColor, title, children, defaultOpen = true }: {
  icon: any; iconColor: string; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-800/80 hover:bg-slate-700/30 transition-colors">
        <div className="flex items-center gap-3">
          <Icon size={17} className={iconColor} />
          <h3 className="font-bold text-slate-200 text-sm sm:text-base">{title}</h3>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && <div className="p-4 sm:p-6">{children}</div>}
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-700/40 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="text-slate-200 font-semibold text-sm">{label}</h4>
        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-blue-600' : 'bg-slate-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────
function NumberInput({ label, value, onChange, min, max, prefix, suffix, description }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; prefix?: string; suffix?: string; description?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {description && <p className="text-slate-500 text-xs mb-2 leading-relaxed">{description}</p>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-slate-500 font-semibold text-sm pointer-events-none">{prefix}</span>}
        <input type="number" value={value} min={min} max={max} onChange={e => onChange(Number(e.target.value))}
          className={`w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors ${prefix ? 'pl-8 pr-4' : suffix ? 'pl-4 pr-12' : 'px-4'}`} />
        {suffix && <span className="absolute right-3 text-slate-500 text-xs font-medium pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────
function TextInput({ label, value, onChange, placeholder, description }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; description?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {description && <p className="text-slate-500 text-xs mb-2">{description}</p>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PortalSettingsView() {
  const [settings, setSettings] = useState<ServerSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await apiService.getSettings();
        setSettings(prev => ({ ...prev, ...dbSettings }));
      } catch (error) {
        console.error("Error loading settings from DB:", error);
      }
    };
    loadSettings();
  }, []);

  const update = <K extends keyof ServerSettings>(key: K, value: ServerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = await apiService.updateSettings(settings);
      
      if (updatedData && updatedData.settings) {
         setSettings(prev => ({ ...prev, ...updatedData.settings }));
      }

      setLastSaved(new Date());
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center gap-3">
          {lastSaved && <p className="text-slate-500 text-xs hidden sm:block">Saved {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
          <button onClick={handleSave} disabled={isSaving}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-70 ${saveSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/30'}`}>
            {isSaving ? <RefreshCcw className="animate-spin" size={15} /> : saveSuccess ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes '}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">You have unsaved changes. Click <strong>Deploy</strong> to apply them.</p>
        </div>
      )}

      {/* Mobile status strip */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <div className={`flex items-center gap-2 p-3 rounded-xl border ${settings.maintenanceMode ? 'bg-red-900/20 border-red-900/30' : 'bg-emerald-900/20 border-emerald-900/30'}`}>
          {settings.maintenanceMode ? <AlertTriangle size={14} className="text-red-400" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
          <p className={`text-xs font-semibold ${settings.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`}>{settings.maintenanceMode ? 'Maintenance ON' : 'System Healthy'}</p>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl border bg-blue-900/10 border-blue-900/20">
          <Shield size={14} className="text-blue-400" />
          <p className="text-xs text-blue-300 font-semibold">Changes are instant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main Settings */}
        <div className="xl:col-span-2 space-y-4">

          <SectionCard icon={Globe} iconColor="text-blue-400" title="System Availability">
            
            {/* --- NEW GRANULAR PORTAL TOGGLES --- */}
            <ToggleRow label="Mess Portal Status" description="Enable/Disable new claims and access for Mess rebates." value={settings.messPortalActive} onChange={v => update('messPortalActive', v)} />
            <ToggleRow label="Fest Portal Status" description="Enable/Disable new claims and access for Fest reimbursements." value={settings.festPortalActive} onChange={v => update('festPortalActive', v)} />
            <ToggleRow label="Hospital Portal Status" description="Enable/Disable new claims and access for Medical reimbursements." value={settings.hospitalPortalActive} onChange={v => update('hospitalPortalActive', v)} />
            {/* ----------------------------------- */}

            <ToggleRow label="Public Registration" description="Allow new secretary accounts via institutional email." value={settings.registrationOpen} onChange={v => update('registrationOpen', v)} />
            <ToggleRow label="Maintenance Mode" description="Block all claim submissions and show a maintenance banner." value={settings.maintenanceMode} onChange={v => update('maintenanceMode', v)} />
            
            {settings.maintenanceMode && (
              <div className="mt-4">
                <TextInput label="Maintenance Message" value={settings.maintenanceMessage} onChange={v => update('maintenanceMessage', v)} placeholder="System under maintenance..." description="Shown to users when maintenance mode is active" />
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Landmark} iconColor="text-green-400" title="Financial Rules & Thresholds">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput label="Mess Rebate (Daily)" value={settings.messRebateRateDaily} onChange={v => update('messRebateRateDaily', v)} prefix="₹" min={0} description="Per-day rebate for mess absence" />
              <NumberInput label="Max Rebate Days" value={settings.maxMessRebateDays} onChange={v => update('maxMessRebateDays', v)} suffix="days" min={1} max={180} description="Max claimable days per semester" />
              <NumberInput label="Max Fest Reimbursement" value={settings.maxFestReimbursement} onChange={v => update('maxFestReimbursement', v)} prefix="₹" min={0} description="Upper cap per fest claim" />
              <NumberInput label="Max Medical Claim" value={settings.maxMedicalReimbursement} onChange={v => update('maxMedicalReimbursement', v)} prefix="₹" min={0} description="Upper cap per medical claim" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <NumberInput label="Max Claims / Month" value={settings.maxClaimsPerMonth} onChange={v => update('maxClaimsPerMonth', v)} suffix="claims" min={1} description="Per-student monthly limit" />
              <NumberInput label="Max File Upload" value={settings.maxFileUploadMB} onChange={v => update('maxFileUploadMB', v)} suffix="MB" min={1} max={100} description="Per-attachment size limit" />
            </div>
          </SectionCard>

        </div>

        {/* Sidebar — hidden on mobile unless toggled, always visible on xl */}
        <div className="hidden xl:block space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h4 className="text-slate-200 font-bold flex items-center gap-2 mb-4 text-sm">
              <Shield className="text-blue-400" size={16} /> Deployment Guard
            </h4>
            <div className="space-y-3">
              <div className="bg-amber-900/20 p-3 rounded-xl border border-amber-900/30">
                <p className="text-xs text-amber-300 leading-relaxed"><AlertTriangle size={11} className="inline mr-1 mb-0.5" />Changes deploy <strong>immediately</strong> and affect all 1,250+ active users.</p>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${settings.maintenanceMode ? 'bg-red-900/20 border-red-900/30' : 'bg-emerald-900/20 border-emerald-900/30'}`}>
                {settings.maintenanceMode ? <AlertTriangle size={13} className="text-red-400" /> : <CheckCircle2 size={13} className="text-emerald-400" />}
                <p className={`text-xs font-semibold ${settings.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`}>{settings.maintenanceMode ? 'Maintenance Mode ON' : 'System Healthy'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h4 className="text-slate-200 font-bold flex items-center gap-2 mb-4 text-sm">
              <FileText className="text-slate-400" size={15} /> Current Config
            </h4>
            <div className="space-y-2.5">
              {[
                // --- UPDATED SIDEBAR STATUSES ---
                { label: 'Mess Portal', value: settings.messPortalActive ? 'Active' : 'Disabled', color: settings.messPortalActive ? 'text-green-400' : 'text-red-400' },
                { label: 'Fest Portal', value: settings.festPortalActive ? 'Active' : 'Disabled', color: settings.festPortalActive ? 'text-green-400' : 'text-red-400' },
                { label: 'Hospital Portal', value: settings.hospitalPortalActive ? 'Active' : 'Disabled', color: settings.hospitalPortalActive ? 'text-green-400' : 'text-red-400' },
                // --------------------------------
                { label: 'Mess Rate', value: `₹${settings.messRebateRateDaily}/day`, color: 'text-slate-300' },
                { label: 'Max Rebate Days', value: `${settings.maxMessRebateDays} days`, color: 'text-slate-300' },
                { label: 'Max Fest Claim', value: `₹${settings.maxFestReimbursement.toLocaleString('en-IN')}`, color: 'text-slate-300' },
                { label: 'Log Retention', value: `${settings.logRetentionDays} days`, color: 'text-slate-300' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{item.label}</span>
                  <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}