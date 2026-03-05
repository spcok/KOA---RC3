import { db, AppDatabase } from './db';
import { supabase } from './supabase';
import { Animal, User, LogEntry, ClinicalNote } from '../types';

export async function pull15DayCache() {
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const isoDate = fifteenDaysAgo.toISOString();

  try {
    // Fetch animals and users
    const [animals, users] = await Promise.all([
      supabase.from('animals').select('*'),
      supabase.from('users').select('*')
    ]);

    if (animals.data) await db.animals.bulkPut(animals.data as Animal[]);
    if (users.data) await db.users.bulkPut(users.data as User[]);

    // Fetch logs
    const [dailyLogs, medicalLogs] = await Promise.all([
      supabase.from('daily_logs').select('*').gte('log_date', isoDate),
      supabase.from('medical_logs').select('*').gte('date', isoDate)
    ]);

    if (dailyLogs.data) await db.daily_logs.bulkPut(dailyLogs.data as LogEntry[]);
    if (medicalLogs.data) await db.medical_logs.bulkPut(medicalLogs.data as ClinicalNote[]);

    // Cleanup
    await db.daily_logs.where('log_date').below(isoDate).delete();
    await db.medical_logs.where('date').below(isoDate).delete();
  } catch (error) {
    console.error('Error pulling 15-day cache:', error);
  }
}

export async function processSyncQueue() {
  const queue = await db.sync_queue.toArray();
  
  for (const item of queue) {
    try {
      const payload = item.payload as Record<string, unknown>;
      if (item.operation === 'upsert') {
        await supabase.from(item.table_name).upsert(payload).throwOnError();
      } else if (item.operation === 'delete') {
        await supabase.from(item.table_name).delete().eq('id', payload.id as string).throwOnError();
      }
      await db.sync_queue.delete(item.id!);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
    }
  }
}

export async function mutateOnlineFirst(tableName: keyof AppDatabase, payload: Record<string, unknown>, operation: 'upsert' | 'delete' = 'upsert') {
  const table = db[tableName] as import('dexie').Table<unknown, string>;
  try {
    // Try online
    if (operation === 'upsert') {
      await supabase.from(tableName).upsert(payload).throwOnError();
      // Update local cache
      await table.put(payload);
    } else {
      await supabase.from(tableName).delete().eq('id', payload.id as string).throwOnError();
      // Update local cache
      await table.delete(payload.id as string);
    }
  } catch (error) {
    console.warn('Offline mode: queuing mutation', error);
    // Queue for later
    await db.sync_queue.add({
      table_name: tableName,
      operation,
      payload,
      created_at: new Date().toISOString()
    });
    // Update local cache anyway
    if (operation === 'upsert') {
      await table.put(payload);
    } else {
      await table.delete(payload.id as string);
    }
  }
}
