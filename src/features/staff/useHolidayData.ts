import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/db';
import { Holiday, LeaveType, HolidayStatus } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';

export function useHolidayData() {
  const holidays = useLiveQuery(() => db.holidays.toArray(), []);

  const addHoliday = async (holiday: Omit<Holiday, 'id'>) => {
    await db.holidays.add({
      ...holiday,
      id: uuidv4()
    });
  };

  const deleteHoliday = async (id: string) => {
    await db.holidays.delete(id);
  };

  const seedHolidays = async () => {
    const count = await db.holidays.count();
    if (count === 0) {
      await db.holidays.bulkAdd([
        {
          id: uuidv4(),
          staff_name: 'John Doe',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          leave_type: LeaveType.ANNUAL,
          status: HolidayStatus.APPROVED,
          notes: 'Summer vacation'
        },
        {
          id: uuidv4(),
          staff_name: 'Jane Smith',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          leave_type: LeaveType.SICK,
          status: HolidayStatus.PENDING,
          notes: 'Flu'
        }
      ]);
    }
  };

  return {
    holidays: holidays || [],
    addHoliday,
    deleteHoliday,
    seedHolidays
  };
}
