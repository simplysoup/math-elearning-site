import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
} from "react-router-dom"
import LandingPage from "../pages/LandingPage";
import CoursePage from "../pages/CoursePage";
import LessonPage from "../pages/LessonPage";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const Layout = () => (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-4">
            <Outlet />
        </main>
        <Footer />
    </div>
);

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <LandingPage /> },
            { 
                path: "courses/:courseId",
                element: <CoursePage />,
            },
            { 
                path: "courses/:courseId/chapters/:chapterId/lessons/:lessonId",
                element: <LessonPage />,
            },
            { path: "*", element: <LandingPage /> }, 
        ],
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}