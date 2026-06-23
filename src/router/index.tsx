import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import MovieDetailPage from "@/pages/MovieDetailPage";
import CinemaListPage from "@/pages/CinemaListPage";
import CinemaDetailPage from "@/pages/CinemaDetailPage";
import SeatSelectionPage from "@/pages/SeatSelectionPage";
import ConcessionsPage from "@/pages/ConcessionsPage";
import MemberCenterPage from "@/pages/MemberCenterPage";
import PointsRedeemPage from "@/pages/PointsRedeemPage";
import PromotionsPage from "@/pages/PromotionsPage";
import OrderHistoryPage from "@/pages/OrderHistoryPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminMoviesPage from "@/pages/AdminMoviesPage";
import AdminInventoryPage from "@/pages/AdminInventoryPage";
import MainLayout from "@/components/MainLayout";
import AdminLayout from "@/components/AdminLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "", element: <HomePage /> },
      { path: "movies/:movieId", element: <MovieDetailPage /> },
      { path: "cinemas", element: <CinemaListPage /> },
      { path: "cinemas/:cinemaId", element: <CinemaDetailPage /> },
      { path: "booking/:showtimeId", element: <SeatSelectionPage /> },
      { path: "concessions", element: <ConcessionsPage /> },
      { path: "member", element: <MemberCenterPage /> },
      { path: "member/redeem", element: <PointsRedeemPage /> },
      { path: "promotions", element: <PromotionsPage /> },
      { path: "orders", element: <OrderHistoryPage /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { path: "", element: <AdminDashboardPage /> },
      { path: "movies", element: <AdminMoviesPage /> },
      { path: "inventory", element: <AdminInventoryPage /> },
    ],
  },
]);
