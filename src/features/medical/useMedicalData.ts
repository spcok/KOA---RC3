import { useState, useEffect, useCallback } from 'react';
import { ClinicalNote, MARChart, QuarantineRecord, Animal } from '../../types';
import { db } from '../../lib/db';
import { mutateOnlineFirst } from '../../lib/syncEngine';

export function useMedicalData() {
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [marCharts, setMarCharts] = useState<MARChart[]>([]);
  const [quarantineRecords, setQuarantineRecords] = useState<QuarantineRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAnimals = await db.animals.toArray();
      setAnimals(fetchedAnimals);

      const fetchedNotes = await db.medical_logs.toArray();
      setClinicalNotes(fetchedNotes);

      const fetchedCharts = await db.mar_charts.toArray();
      setMarCharts(fetchedCharts);

      const fetchedQuarantine = await db.quarantine_records.toArray();
      setQuarantineRecords(fetchedQuarantine);
    } catch (error) {
      console.error("Failed to load medical data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addClinicalNote = async (note: Omit<ClinicalNote, 'id' | 'animal_name'>) => {
    const animal = await db.animals.get(note.animal_id);
    const newNote: ClinicalNote = {
      ...note,
      id: crypto.randomUUID(),
      animal_name: animal?.name || 'Unknown'
    };
    await mutateOnlineFirst('medical_logs', newNote as unknown as Record<string, unknown>);
    await loadData(); // Re-fetch
  };

  const updateClinicalNote = async (note: ClinicalNote) => {
    await mutateOnlineFirst('medical_logs', note as unknown as Record<string, unknown>);
    await loadData();
  };

  const addMarChart = async (chart: Omit<MARChart, 'id' | 'animal_name' | 'administered_dates' | 'status'>) => {
    const animal = await db.animals.get(chart.animal_id);
    const newChart: MARChart = {
      ...chart,
      id: crypto.randomUUID(),
      animal_name: animal?.name || 'Unknown',
      administered_dates: [],
      status: 'Active'
    };
    await mutateOnlineFirst('mar_charts', newChart as unknown as Record<string, unknown>);
    await loadData(); // Re-fetch
  };

  const updateMarChart = async (chart: MARChart) => {
    await mutateOnlineFirst('mar_charts', chart as unknown as Record<string, unknown>);
    await loadData();
  };

  const signOffDose = async (chartId: string, dateIso: string) => {
    const chart = await db.mar_charts.get(chartId);
    if (chart) {
      const updatedChart = {
        ...chart,
        administered_dates: [...chart.administered_dates, dateIso]
      };
      await mutateOnlineFirst('mar_charts', updatedChart as unknown as Record<string, unknown>);
      await loadData(); // Re-fetch
    }
  };

  const addQuarantineRecord = async (record: Omit<QuarantineRecord, 'id' | 'animal_name' | 'status'>) => {
    const animal = await db.animals.get(record.animal_id);
    const newRecord: QuarantineRecord = {
      ...record,
      id: crypto.randomUUID(),
      animal_name: animal?.name || 'Unknown',
      status: 'Active'
    };
    await mutateOnlineFirst('quarantine_records', newRecord as unknown as Record<string, unknown>);
    await loadData(); // Re-fetch
  };

  const updateQuarantineRecord = async (record: QuarantineRecord) => {
    await mutateOnlineFirst('quarantine_records', record as unknown as Record<string, unknown>);
    await loadData();
  };

  return { clinicalNotes, marCharts, quarantineRecords, animals, isLoading, addClinicalNote, updateClinicalNote, addMarChart, updateMarChart, signOffDose, addQuarantineRecord, updateQuarantineRecord };
}
