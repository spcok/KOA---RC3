import React, { useState } from 'react';
import { Activity, Database, HardDrive, Download, Upload, Loader2, AlertTriangle, X } from 'lucide-react';
import { useSystemHealthData } from '../useSystemHealthData';
import { db } from '../../../lib/db';

const SystemHealth: React.FC = () => {
  const { storageStats, exportDatabase, importDatabase } = useSystemHealthData();
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeProgress, setWipeProgress] = useState(0);

  const handleExportData = async () => {
    await exportDatabase();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (window.confirm("WARNING: Importing a database will overwrite all current data. This cannot be undone. Continue?")) {
        setIsProcessingBackup(true);
        const content = event.target?.result as string;
        const success = await importDatabase(content);
        if (success) {
          alert("Database imported successfully. System will reload.");
          window.location.reload();
        } else {
          alert("Import failed. Invalid file format.");
        }
        setIsProcessingBackup(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
    setIsWiping(true);
    setWipeProgress(20);
    
    try {
      await db.close();
      setWipeProgress(50);
      await db.delete();
      setWipeProgress(100);
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Wipe failed:", err);
      alert("Failed to wipe database.");
      setIsWiping(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
      <div className="border-b-2 border-slate-200 pb-6">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <Activity size={28} className="text-emerald-600" /> System Health & Data
        </h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Database Management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Storage Stats */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-6">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Database size={16} className="text-blue-500" /> Database Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Animals</p>
              <p className="text-2xl font-black text-slate-900">{storageStats.totalAnimals}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
              <p className="text-2xl font-black text-slate-900">{storageStats.totalLogs}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Size</p>
              <p className="text-2xl font-black text-slate-900">{storageStats.dbSizeMB} MB</p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-6">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <HardDrive size={16} className="text-emerald-500" /> Data Management
          </h4>
          <div className="space-y-4">
            <button onClick={handleExportData} className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md">
              <Download size={16} /> Export Full Database
            </button>

            <div className="relative">
              <input type="file" id="import-db" className="hidden" accept=".json" onChange={handleFileImport} disabled={isProcessingBackup} />
              <label htmlFor="import-db" className={`w-full bg-rose-50 text-rose-600 border-2 border-rose-200 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all cursor-pointer ${isProcessingBackup ? 'opacity-50 pointer-events-none' : ''}`}>
                {isProcessingBackup ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import & Overwrite Database
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-200 shadow-sm space-y-4">
        <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600" /> Danger Zone
        </h4>
        <p className="text-sm text-rose-700">This action will permanently delete all local data. Use with extreme caution.</p>
        <button 
          onClick={() => setShowConfirmModal(true)}
          className="bg-rose-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md"
        >
          Wipe Database (Factory Reset)
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-rose-600" /> Confirm Factory Reset
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you absolutely sure you want to wipe the database? This will delete all animals, logs, and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFactoryReset();
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overlay */}
      {isWiping && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm space-y-4 text-center">
            <Loader2 className="animate-spin text-rose-600 mx-auto" size={48} />
            <h3 className="text-xl font-bold text-slate-900">Wiping Database...</h3>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div className="bg-rose-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${wipeProgress}%` }}></div>
            </div>
            <p className="text-sm text-slate-500">Please do not close this window.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
