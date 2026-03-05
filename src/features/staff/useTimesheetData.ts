import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { Timesheet, TimesheetStatus } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';

export function useTimesheetData() {
  const timesheets = useLiveQuery(() => db.timesheets.toArray(), []);

  const addTimesheet = async (timesheet: Omit<Timesheet, 'id'>) => {
    await db.timesheets.add({
      ...timesheet,
      id: uuidv4()
    });
  };

  const deleteTimesheet = async (id: string) => {
    await db.timesheets.delete(id);
  };

  const seedTimesheets = async () => {
    const count = await db.timesheets.count();
    if (count === 0) {
      await db.timesheets.bulkAdd([
        {
          id: uuidv4(),
          staff_name: 'John Doe',
          date: new Date().toISOString().split('T')[0],
          clock_in: '08:00',
          clock_out: '16:00',
          total_hours: 8,
          notes: 'Completed shift',
          status: TimesheetStatus.COMPLETED
        },
        {
          id: uuidv4(),
          staff_name: 'Jane Smith',
          date: new Date().toISOString().split('T')[0],
          clock_in: '09:00',
          status: TimesheetStatus.ACTIVE
        }
      ]);
    }
  };

  return {
    timesheets: timesheets || [],
    addTimesheet,
    deleteTimesheet,
    seedTimesheets
  };
}
