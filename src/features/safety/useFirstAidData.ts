import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { FirstAidLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useFirstAidData() {
  const logs = useLiveQuery(() => db.first_aid_logs.toArray()) || [];
  const isLoading = logs === undefined;

  const addFirstAid = async (log: Omit<FirstAidLog, 'id'>) => {
    await db.first_aid_logs.add({
      ...log,
      id: uuidv4(),
    });
  };

  const deleteFirstAid = async (id: string) => {
    await db.first_aid_logs.delete(id);
  };

  return {
    logs,
    isLoading,
    addFirstAid,
    deleteFirstAid
  };
}
