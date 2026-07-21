import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import UserLayout from "./layouts/UserLayout"
import AdminLayout from "./layouts/AdminLayout"
import Dashboard from "./pages/Dashboard"
import VocabularyLibrary from "./pages/user/VocabularyLibrary"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminUsers from "./pages/admin/Users"
import AdminPendingVocabulary from "./pages/admin/PendingVocabulary"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "user",
        element: <UserLayout />,
        children: [
          {
            index: true,
            element: <VocabularyLibrary />,
          },
          {
            path: "library",
            element: <VocabularyLibrary />,
          },
        ],
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: "users",
            element: <AdminUsers />,
          },
          {
            path: "pending-vocabulary",
            element: <AdminPendingVocabulary />,
          },
        ],
      },
    ],
  },
])
