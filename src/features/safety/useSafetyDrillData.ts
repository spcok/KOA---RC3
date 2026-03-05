import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { SafetyDrill } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useSafetyDrillData() {
  const drills = useLiveQuery(() => db.safety_drills.toArray()) || [];
  const isLoading = drills === undefined;

  const addDrillLog = async (drill: Omit<SafetyDrill, 'id'>) => {
    await db.safety_drills.add({
      ...drill,
      id: uuidv4(),
    });
  };

  const deleteDrillLog = async (id: string) => {
    await db.safety_drills.delete(id);
  };

  return {
    drills,
    isLoading,
    addDrillLog,
    deleteDrillLog
  };
}
