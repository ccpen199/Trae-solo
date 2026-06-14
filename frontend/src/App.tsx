import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Library from '@/pages/Library';
import BookDetail from '@/pages/BookDetail';
import ReadingTimer from '@/pages/ReadingTimer';
import OCRNotes from '@/pages/OCRNotes';
import KnowledgeGraph from '@/pages/KnowledgeGraph';
import ReviewBoard from '@/pages/ReviewBoard';
import ExportCenter from '@/pages/ExportCenter';
import Admin from '@/pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:bookId" element={<BookDetail />} />
          <Route path="/timer" element={<ReadingTimer />} />
          <Route path="/ocr" element={<OCRNotes />} />
          <Route path="/graph" element={<KnowledgeGraph />} />
          <Route path="/review" element={<ReviewBoard />} />
          <Route path="/export" element={<ExportCenter />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
