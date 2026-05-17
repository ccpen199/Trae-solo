import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Search from "@/pages/Search";
import Vip from "@/pages/Vip";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Books from "@/pages/Books";
import BookDetail from "@/pages/BookDetail";
import MiniPlayer from "@/components/MiniPlayer";

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/search" element={<Search />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/books" element={<Books />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/mall" element={<div className="p-8 text-center"><h2 className="text-xl">商城</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
            <Route path="/book/:id" element={<BookDetail />} />
          </Routes>
          <MiniPlayer />
        </div>
      </Router>
    </ConfigProvider>
  );
}
