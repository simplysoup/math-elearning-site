import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200">
      <nav className="flex flex-col space-y-2">
        <Link to="/courses/1" className="hover:underline">Syllabus</Link>
        <Link to="/lessons/intro" className="hover:underline">Lesson 1</Link>
        <Link to="/problemsets/1" className="hover:underline">Problem Set 1</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
