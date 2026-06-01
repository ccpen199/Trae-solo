import api from './client';
import { TodoItem } from '../types';

export { TodoItem };

export const getTodos = async (status?: string): Promise<TodoItem[]> => {
  const url = status ? `/todos?status=${status}` : '/todos';
  const response = await api.get(url);
  return response.data;
};

export const createTodo = async (data: Partial<TodoItem>): Promise<TodoItem> => {
  const response = await api.post('/todos', data);
  return response.data;
};

export const updateTodo = async (id: number, data: { status: string }): Promise<TodoItem> => {
  const response = await api.put(`/todos/${id}`, data);
  return response.data;
};

export const deleteTodo = async (id: number): Promise<void> => {
  await api.delete(`/todos/${id}`);
};
