import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Task, User, UserRole } from '../../types';

const mockUsers: User[] = [
  { id: 'u1', email: 'john@example.com', name: 'John Doe', initials: 'JD', role: UserRole.VOLUNTEER },
  { id: 'u2', email: 'jane@example.com', name: 'Jane Smith', initials: 'JS', role: UserRole.ADMIN }
];

export const useTaskData = () => {
  const tasks = useLiveQuery(async () => {
    return await db.tasks.toArray();
  }, []);
  const animals = useLiveQuery(async () => {
    return await db.animals.toArray();
  }, []);

  const [filter, setFilter] = useState<'assigned' | 'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const currentUser = mockUsers[0];

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      if (filter === 'completed' && !task.completed) return false;
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'assigned' && (task.assignedTo !== currentUser.id || task.completed)) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const animalName = animals?.find(a => a.id === task.animalId)?.name.toLowerCase() || '';
        const userName = mockUsers.find(u => u.id === task.assignedTo)?.name.toLowerCase() || '';
        
        return (
          task.title.toLowerCase().includes(searchLower) ||
          (task.type && task.type.toLowerCase().includes(searchLower)) ||
          animalName.includes(searchLower) ||
          userName.includes(searchLower)
        );
      }
      return true;
    });
  }, [tasks, filter, searchTerm, currentUser.id, animals]);

  const addTask = async (newTask: Omit<Task, 'id'>) => {
    await db.tasks.add(newTask as Task);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await db.tasks.update(id, updates);
  };

  const deleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  const toggleTaskCompletion = async (task: Task) => {
    await db.tasks.update(task.id, { completed: !task.completed });
  };

  return {
    tasks: filteredTasks,
    animals: animals || [],
    users: mockUsers,
    isLoading: tasks === undefined || animals === undefined,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    currentUser
  };
};
