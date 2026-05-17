import { Routes, Route } from 'react-router-dom';
import VideoList from './pages/VideoList';
import VideoDetail from './pages/VideoDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<VideoList />} />
      <Route path="/video/:id" element={<VideoDetail />} />
    </Routes>
  );
}

export default App;
