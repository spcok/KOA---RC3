import { useState, useEffect, useMemo } from 'react';
import { AnimalCategory, LogType, LogEntry } from '../../types';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { mutateOnlineFirst } from '../../lib/syncEngine';

export const useDailyLogData = (viewDate: string, activeCategory: AnimalCategory) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('Name');

  const liveAnimals = useLiveQuery(() => db.animals.toArray(), []);
  const liveLogs = useLiveQuery(() => db.daily_logs.where('log_date').equals(viewDate).toArray(), [viewDate]);

  const animals = useMemo(() => {
    const allAnimals = liveAnimals || [];
    return allAnimals.filter(a => a.category === activeCategory || activeCategory === AnimalCategory.ALL);
  }, [activeCategory, liveAnimals]);

  const logs = useMemo(() => liveLogs || [], [liveLogs]);

  useEffect(() => {
    if (liveAnimals !== undefined && liveLogs !== undefined) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [liveAnimals, liveLogs]);

  const cycleSort = () => {
    const options = ['Name', 'Location', 'Status'];
    const currentIndex = options.indexOf(sortOption);
    setSortOption(options[(currentIndex + 1) % options.length]);
  };

  const getTodayLog = (animalId: string, type: LogType) => {
    return logs.find(l => l.animal_id === animalId && l.log_type === type);
  };

  const handleQuickCheck = async (animalId: string, type: LogType) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      animal_id: animalId,
      log_type: type,
      log_date: viewDate,
      value: 'Done',
      created_at: new Date().toISOString(),
      created_by: 'System',
    };
    await mutateOnlineFirst('daily_logs', newLog as unknown as Record<string, unknown>);
  };

  const addLogEntry = async (entry: Partial<LogEntry>) => {
    const logEntry: LogEntry = {
      id: entry.id || crypto.randomUUID(),
      animal_id: entry.animal_id || '',
      log_type: entry.log_type || LogType.WEIGHT,
      log_date: entry.log_date || viewDate,
      value: entry.value || '',
      notes: entry.notes,
      weight_grams: entry.weight_grams,
      basking_temp_c: entry.basking_temp_c,
      cool_temp_c: entry.cool_temp_c,
      temperature_c: entry.temperature_c,
      health_record_type: entry.health_record_type,
      created_at: entry.created_at || new Date().toISOString(),
      created_by: entry.created_by || 'System',
    };
    await mutateOnlineFirst('daily_logs', logEntry as unknown as Record<string, unknown>);
  };

  return {
    animals,
    isLoading,
    sortOption,
    cycleSort,
    getTodayLog,
    handleQuickCheck,
    addLogEntry
  };
};
