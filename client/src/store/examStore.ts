import { create } from 'zustand';
import { ExamQuestion, QuestionType } from '@/types';

interface ExamAnswer {
  questionId: string;
  answerContent?: string;
  answerOptions?: string[];
}

interface ExamState {
  userExamId: string | null;
  examId: string | null;
  examName: string;
  duration: number;
  endTime: Date | null;
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  answers: ExamAnswer[];
  isStarted: boolean;
  isSubmitting: boolean;
  timeRemaining: number;
  warningCount: number;
}

interface ExamActions {
  startExam: (data: {
    userExamId: string;
    examId: string;
    examName: string;
    duration: number;
    endTime: Date;
    questions: ExamQuestion[];
  }) => void;
  setCurrentQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  saveAnswer: (questionId: string, data: { answerContent?: string; answerOptions?: string[] }) => void;
  toggleOption: (questionId: string, optionId: string, isMultiple: boolean) => void;
  setAnswerContent: (questionId: string, content: string) => void;
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  setIsSubmitting: (value: boolean) => void;
  addWarning: () => void;
  resetExam: () => void;
  getAnswer: (questionId: string) => ExamAnswer | undefined;
  isQuestionAnswered: (questionId: string) => boolean;
  getProgress: () => { answered: number; total: number };
}

export const useExamStore = create<ExamState & ExamActions>((set, get) => ({
  userExamId: null,
  examId: null,
  examName: '',
  duration: 0,
  endTime: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  isStarted: false,
  isSubmitting: false,
  timeRemaining: 0,
  warningCount: 0,

  startExam: (data) => {
    set({
      userExamId: data.userExamId,
      examId: data.examId,
      examName: data.examName,
      duration: data.duration,
      endTime: new Date(data.endTime),
      questions: data.questions,
      timeRemaining: data.duration * 60,
      currentQuestionIndex: 0,
      answers: [],
      isStarted: true,
      isSubmitting: false,
      warningCount: 0,
    });
  },

  setCurrentQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  saveAnswer: (questionId, data) => {
    const { answers } = get();
    const existingIndex = answers.findIndex((a) => a.questionId === questionId);
    
    const newAnswers = [...answers];
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId, ...data };
    } else {
      newAnswers.push({ questionId, ...data });
    }
    
    set({ answers: newAnswers });
  },

  toggleOption: (questionId, optionId, isMultiple) => {
    const { answers } = get();
    const existing = answers.find((a) => a.questionId === questionId);
    const currentOptions = existing?.answerOptions || [];
    
    let newOptions: string[];
    if (isMultiple) {
      if (currentOptions.includes(optionId)) {
        newOptions = currentOptions.filter((id) => id !== optionId);
      } else {
        newOptions = [...currentOptions, optionId];
      }
    } else {
      newOptions = [optionId];
    }
    
    get().saveAnswer(questionId, { answerOptions: newOptions });
  },

  setAnswerContent: (questionId, content) => {
    get().saveAnswer(questionId, { answerContent: content });
  },

  setTimeRemaining: (time) => {
    set({ timeRemaining: time });
  },

  decrementTime: () => {
    const { timeRemaining } = get();
    if (timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  setIsSubmitting: (value) => {
    set({ isSubmitting: value });
  },

  addWarning: () => {
    const { warningCount } = get();
    set({ warningCount: warningCount + 1 });
  },

  resetExam: () => {
    set({
      userExamId: null,
      examId: null,
      examName: '',
      duration: 0,
      endTime: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      isStarted: false,
      isSubmitting: false,
      timeRemaining: 0,
      warningCount: 0,
    });
  },

  getAnswer: (questionId) => {
    return get().answers.find((a) => a.questionId === questionId);
  },

  isQuestionAnswered: (questionId) => {
    const answer = get().answers.find((a) => a.questionId === questionId);
    if (!answer) return false;
    
    const question = get().questions.find((q) => q.id === questionId);
    if (!question) return false;
    
    if (
      question.type === QuestionType.SINGLE_CHOICE ||
      question.type === QuestionType.MULTIPLE_CHOICE
    ) {
      return answer.answerOptions !== undefined && answer.answerOptions.length > 0;
    }
    
    return answer.answerContent !== undefined && answer.answerContent.trim() !== '';
  },

  getProgress: () => {
    const { questions, isQuestionAnswered } = get();
    const answered = questions.filter((q) => isQuestionAnswered(q.id)).length;
    return { answered, total: questions.length };
  },
}));
