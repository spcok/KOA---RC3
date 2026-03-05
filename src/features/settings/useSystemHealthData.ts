import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

export function useSystemHealthData() {
  const animalsRaw = useLiveQuery(() => db.animals.toArray());
  const logEntriesRaw = useLiveQuery(() => db.logEntries.toArray());
  const tasksRaw = useLiveQuery(() => db.tasks.toArray());
  const usersRaw = useLiveQuery(() => db.users.toArray());

  const animals = useMemo(() => animalsRaw || [], [animalsRaw]);
  const logEntries = useMemo(() => logEntriesRaw || [], [logEntriesRaw]);
  const tasks = useMemo(() => tasksRaw || [], [tasksRaw]);
  const users = useMemo(() => usersRaw || [], [usersRaw]);

  const storageStats = useMemo(() => {
    const totalAnimals = animals?.length || 0;
    const totalLogs = logEntries?.length || 0;
    const dbSizeEst = JSON.stringify(animals || []).length + 
                      JSON.stringify(tasks || []).length + 
                      JSON.stringify(users || []).length + 
                      JSON.stringify(logEntries || []).length;
    const dbSizeMB = (dbSizeEst / (1024 * 1024)).toFixed(2);
    return { totalAnimals, totalLogs, dbSizeMB };
  }, [animals, tasks, users, logEntries]);

  const exportDatabase = async () => {
    const data = {
      animals,
      log_entries: logEntries,
      tasks,
      users
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koa_backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabase = async (content: string) => {
    try {
      const data = JSON.parse(content);
      await db.transaction('rw', db.animals, db.logEntries, db.tasks, db.users, async () => {
        await db.animals.clear();
        await db.logEntries.clear();
        await db.tasks.clear();
        await db.users.clear();
        
        if (data.animals) await db.animals.bulkAdd(data.animals);
        if (data.log_entries) await db.logEntries.bulkAdd(data.log_entries);
        if (data.tasks) await db.tasks.bulkAdd(data.tasks);
        if (data.users) await db.users.bulkAdd(data.users);
      });
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  };

  return { storageStats, exportDatabase, importDatabase };
}
