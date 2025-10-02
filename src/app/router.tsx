import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/features/home/HomePage";
import DietPage from "@/features/diet/DietPage";
import DietConfigPage from "@/features/diet/DietConfigPage";
import WaterPage from "@/features/water/WaterPage";
import WaterConfigPage from "@/features/water/WaterConfigPage";
import TrainingPage from "@/features/training/TrainingPage";
import TrainingConfigPage from "@/features/training/TrainingConfigPage";
import WeightPage from "@/features/weight/WeightPage";
import WeightConfigPage from "@/features/weight/WeightConfigPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/diet", element: <DietPage /> },
  { path: "/diet/config", element: <DietConfigPage /> },
  { path: "/water", element: <WaterPage /> },
  { path: "/water/config", element: <WaterConfigPage /> },
  { path: "/training", element: <TrainingPage /> },
  { path: "/training/config", element: <TrainingConfigPage /> },
  { path: "/weight", element: <WeightPage /> },
  { path: "/weight/config", element: <WeightConfigPage /> },
]);
