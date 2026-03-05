import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { User } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function useUsersData() {
  const usersData = useLiveQuery(() => db.users.toArray());
  const isLoading = usersData === undefined;
  const users = usersData || [];

  const addUser = async (user: Omit<User, 'id'>) => {
    const id = uuidv4();
    await db.users.add({ ...user, id } as User);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    await db.users.update(id, updates);
  };

  const deleteUser = async (id: string) => {
    await db.users.delete(id);
  };

  return { users, isLoading, addUser, updateUser, deleteUser };
}
