import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import NoteDetail from './pages/NoteDetail';
import Search from './pages/Search';
import My from './pages/My';
import Login from './pages/Login';
import VIP from './pages/VIP';
import Trash from './pages/Trash';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/note/:id" element={<NoteDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/vip" element={<VIP />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/my" element={<My />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
