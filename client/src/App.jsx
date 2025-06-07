// course-platform-frontend/src/App.js
import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

// Corrected import paths:
import { useAuth } from "./context/AuthContext.jsx";
import Hero from "./pages/Hero.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import CourseDetailPage from "./components/CourseDetailPage.jsx";
import MyCourses from "./components/MyCourses.jsx";
import LessonContentPage from "./components/LessonContentPage.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import Header from "./components/Header.jsx";
import StorybooksPage from "./pages/StorybooksPage.jsx";
import JobsListPage from "./pages/JobsListPage.jsx";
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import CreateJobPage from "./pages/CreateJobPage.jsx";
import EditJobPage from "./pages/EditJobPage.jsx";
import MyPostedJobsPage from "./pages/MyPostedJobsPage.jsx"; 

function App() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 font-inter flex flex-col">
      <Header />
      <main className="container mx-auto p-4 flex-grow">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route
            path="/register"
            element={<Register onRegisterSuccess={() => navigate("/")} />}
          />
          <Route
            path="/login"
            element={<Login onLoginSuccess={() => navigate("/")} />}
          />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route
            path="/courses/:courseId/lessons/:lessonId"
            element={<LessonContentPage />}
          />
          <Route
            path="/instructor/dashboard"
            element={<InstructorDashboard />}
          />
          <Route path="/storybooks" element={<StorybooksPage />} />
          <Route path="/jobs" element={<JobsListPage />} />
          <Route path="/jobs/new" element={<CreateJobPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/jobs/edit/:id" element={<EditJobPage />} />
          <Route path="/jobs/my" element={<MyPostedJobsPage />} />
          <Route
            path="*"
            element={
              <div className="text-center text-xl text-gray-700">
                Page Not Found
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center mt-8">
        <div className="container mx-auto">
          <p>
            &copy; {new Date().getFullYear()} SkillForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
