import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import AnalysisPage from "@/pages/AnalysisPage";
import SynthesisPage from "@/pages/SynthesisPage";
import VocabularyPage from "@/pages/VocabularyPage";
import KnowledgePage from "@/pages/KnowledgePage";
import JournalPage from "@/pages/JournalPage";
import AboutPage from "@/pages/AboutPage";

export default function App() {
  return (
    <Router>
      <PageLayout>
        <Routes>
          <Route path="/" element={<AnalysisPage />} />
          <Route path="/synthesize" element={<SynthesisPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </PageLayout>
    </Router>
  );
}
