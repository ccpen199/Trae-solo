import { create } from 'zustand';
import { studentApi } from '@/api/endpoints';
import type {
  Student,
  StudentQueryParams,
  PageResponse,
} from '@shared/types';

interface StudentState {
  students: Student[];
  currentStudent: Student | null;
  fetchStudents: (
    params?: StudentQueryParams
  ) => Promise<PageResponse<Student>>;
  getStudentDetail: (id: number) => Promise<Student>;
  createStudent: (data: Partial<Student>) => Promise<Student>;
  updateStudent: (id: number, data: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: number) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  currentStudent: null,

  fetchStudents: async (params?: StudentQueryParams) => {
    const response = await studentApi.getList(params || {});
    set({ students: response.list });
    return response;
  },

  getStudentDetail: async (id: number) => {
    const student = await studentApi.getDetail(id);
    set({ currentStudent: student });
    return student;
  },

  createStudent: async (data: Partial<Student>) => {
    const newStudent = await studentApi.create(data);
    set((state) => ({
      students: [newStudent, ...state.students],
    }));
    return newStudent;
  },

  updateStudent: async (id: number, data: Partial<Student>) => {
    const updatedStudent = await studentApi.update(id, data);
    set((state) => ({
      students: state.students.map((s) =>
        s.id === id ? updatedStudent : s
      ),
      currentStudent:
        state.currentStudent?.id === id
          ? updatedStudent
          : state.currentStudent,
    }));
    return updatedStudent;
  },

  deleteStudent: async (id: number) => {
    await studentApi.delete(id);
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
      currentStudent:
        state.currentStudent?.id === id ? null : state.currentStudent,
    }));
  },
}));
