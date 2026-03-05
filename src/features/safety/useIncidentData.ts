import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Incident } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const useIncidentData = () => {
  const incidents = useLiveQuery(() => db.incidents.toArray()) || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || i.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const addIncident = async (incident: Omit<Incident, 'id'>) => {
    await db.incidents.add({ ...incident, id: uuidv4() });
  };

  const deleteIncident = async (id: string) => {
    await db.incidents.delete(id);
  };

  return {
    incidents: filteredIncidents,
    isLoading: !incidents,
    searchTerm,
    setSearchTerm,
    filterSeverity,
    setFilterSeverity,
    addIncident,
    deleteIncident
  };
};
