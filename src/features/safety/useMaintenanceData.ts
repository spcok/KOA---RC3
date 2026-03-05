import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { MaintenanceLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useMaintenanceData() {
  const logs = useLiveQuery(() => db.maintenance_logs.toArray()) || [];
  const isLoading = logs === undefined;

  const addLog = async (log: Omit<MaintenanceLog, 'id'>) => {
    await db.maintenance_logs.add({
      ...log,
      id: uuidv4(),
    });
  };

  const updateLog = async (log: MaintenanceLog) => {
    await db.maintenance_logs.put(log);
  };

  const deleteLog = async (id: string) => {
    await db.maintenance_logs.delete(id);
  };

  return {
    logs,
    isLoading,
    addLog,
    updateLog,
    deleteLog
  };
}
