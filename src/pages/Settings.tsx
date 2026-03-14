import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { 
  Globe, 
  Mail, 
  Shield, 
  Bell, 
  Database,
  Save,
  Loader2,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'QuizMaster LMS',
    supportEmail: 'support@quizmaster.com',
    allowPublicRegistration: true,
    maintenanceMode: false,
    defaultLanguage: 'English',
    timezone: 'UTC'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'platform'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, 'settings', 'platform'), settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Header title="Platform Settings" />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-1">
          <TabButton active={activeTab === 'general'} icon={<Building2 size={18} />} label="General" onClick={() => setActiveTab('general')} />
          <TabButton active={activeTab === 'email'} icon={<Mail size={18} />} label="Email" onClick={() => setActiveTab('email')} />
          <TabButton active={activeTab === 'security'} icon={<Shield size={18} />} label="Security" onClick={() => setActiveTab('security')} />
          <TabButton active={activeTab === 'notifications'} icon={<Bell size={18} />} label="Notifications" onClick={() => setActiveTab('notifications')} />
          <TabButton active={activeTab === 'backup'} icon={<Database size={18} />} label="Backup & Data" onClick={() => setActiveTab('backup')} />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold capitalize">{activeTab} Settings</h3>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {activeTab === 'general' && (
                <>
                  <SettingField 
                    label="Platform Name" 
                    description="The name of your LMS visible to all users."
                    value={settings.platformName}
                    onChange={(v: string) => setSettings({...settings, platformName: v})}
                  />
                  <SettingField 
                    label="Support Email" 
                    description="The email address for system notifications and support."
                    value={settings.supportEmail}
                    onChange={(v: string) => setSettings({...settings, supportEmail: v})}
                  />
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="font-bold text-sm">Public Registration</h4>
                      <p className="text-xs text-slate-500">Allow new students to create accounts.</p>
                    </div>
                    <Toggle 
                      enabled={settings.allowPublicRegistration} 
                      onChange={(v: boolean) => setSettings({...settings, allowPublicRegistration: v})} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="font-bold text-sm">Maintenance Mode</h4>
                      <p className="text-xs text-slate-500">Disable all features except for administrators.</p>
                    </div>
                    <Toggle 
                      enabled={settings.maintenanceMode} 
                      onChange={(v: boolean) => setSettings({...settings, maintenanceMode: v})} 
                    />
                  </div>
                </>
              )}
              {activeTab !== 'general' && (
                <div className="py-12 text-center text-slate-500">
                  <p>Settings for {activeTab} are coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
      active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
    )}
  >
    {icon}
    {label}
  </button>
);

const SettingField = ({ label, description, value, onChange }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <div>
        <h4 className="font-bold text-sm">{label}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <input 
      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all" 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Toggle = ({ enabled, onChange }: any) => (
  <button 
    onClick={() => onChange(!enabled)}
    className={cn(
      "w-12 h-6 rounded-full transition-all relative",
      enabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
    )}
  >
    <div className={cn(
      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
      enabled ? "left-7" : "left-1"
    )} />
  </button>
);
