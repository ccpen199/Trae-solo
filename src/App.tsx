import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Translate from "@/pages/Translate";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import PocketTranslator from "@/pages/PocketTranslator";
import News from "@/pages/News";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/translate" element={<Translate />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/pocket-translator" element={<PocketTranslator />} />
          <Route path="/news" element={<News />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/about"
            element={
              <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="section-title mb-4">
                  关于中意桥 / Informazioni su Ponte Cina-Italia
                </h1>
                <p className="text-charcoal-400 max-w-2xl mx-auto text-lg">
                  中意双语国际资讯与公共服务平台，服务于两国政府机构、文化组织与普通民众。
                  Piattaforma bilingue di informazione e servizi pubblici internazionali Cina-Italia,
                  al servizio di agenzie governative, organizzazioni culturali e cittadini di entrambi i paesi.
                </p>
              </div>
            }
          />
          <Route path="*" element={
            <div className="container mx-auto px-4 py-24 text-center">
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-text-gradient-cnit mb-4">404</h1>
              <p className="text-charcoal-400 text-lg">
                页面未找到 / Pagina non trovata
              </p>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}
