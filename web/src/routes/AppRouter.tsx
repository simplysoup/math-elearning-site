import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
    Navigate,
    useParams,
} from "react-router-dom"
import LandingPage from "../pages/LandingPage";
import AuthPage from "../pages/AuthPage";
import ProfilePage from "../pages/ProfilePage";
import EditProfilePage from "../pages/EditProfilePage";
import CoursePage from "../pages/CoursePage";
import LessonPage from "../pages/LessonPage";
import EditorSaveWrapper from "./EditorSaveWrapper"
import AboutPage from "../pages/AboutPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Navbar from "../components/common/Navbar";


const Layout = () => (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-4">
            <Outlet />
        </main>
    </div>
);

/** Old chapter URLs redirect to the new unit URLs. */
const ChapterUrlRedirect = () => {
    const { courseId, chapterId, lessonId } = useParams();
    return (
        <Navigate
            to={`/courses/${courseId}/units/${chapterId}/lessons/${lessonId}`}
            replace
        />
    );
};

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
                path: "courses/:courseId/units/:unitId/lessons/:lessonId",
                element: <LessonPage />,
            },
            {
                path: "courses/:courseId/chapters/:chapterId/lessons/:lessonId",
                element: <ChapterUrlRedirect />,
            },
            {
                path: "editor",
                element: <ProtectedRoute />,
                children: [
                    { index: true, element: <EditorSaveWrapper /> },
                ],
            },
            {
                path: "about",
                element: <AboutPage />,
            },
            {
                path: "login",
                element: <AuthPage />,
            },
            {
                path: "profile",
                element: <ProtectedRoute />,
                children: [
                    { index: true, element: <ProfilePage /> },
                ],
            },
            {
                path: "edit-profile",
                element: <ProtectedRoute />,
                children: [
                    { index: true, element: <EditProfilePage /> },
                ],
            },

            { path: "*", element: <LandingPage /> },
        ],
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
