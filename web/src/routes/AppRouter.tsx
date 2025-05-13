import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
} from "react-router-dom"
import LandingPage from "../pages/LandingPage";
import CoursePage from "../pages/CoursePage";
import LessonPage from "../pages/LessonPage";
import EditorSaveWrapper from "./EditorSaveWrapper"
import AboutPage from "../pages/AboutPage";
import Navbar from "../components/common/Navbar";

const Layout = () => (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-4">
            <Outlet />
        </main>
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
            { 
                path: "editor",
                element: <EditorSaveWrapper />,
            },
            { 
                path: "about",
                element: <AboutPage />,
            },
            { path: "*", element: <LandingPage /> }, 
        ],
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}