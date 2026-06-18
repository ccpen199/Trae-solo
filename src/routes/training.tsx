import { Route } from 'react-router-dom';
import CourseListPage from '../pages/training/CourseListPage';
import CourseDetailPage from '../pages/training/CourseDetailPage';
import ExamListPage from '../pages/training/ExamListPage';
import ExamTakePage from '../pages/training/ExamTakePage';
import RankingPage from '../pages/training/RankingPage';

const trainingRoutes = (
  <>
    <Route path="training/courses" element={<CourseListPage />} />
    <Route path="training/courses/:id" element={<CourseDetailPage />} />
    <Route path="training/exam" element={<ExamListPage />} />
    <Route path="training/exam/:id" element={<ExamTakePage />} />
    <Route path="training/ranking" element={<RankingPage />} />
  </>
);

export default trainingRoutes;
