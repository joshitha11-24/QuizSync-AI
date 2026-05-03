/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/src/lib/AuthContext";
import LandingPage from "@/src/pages/Landing";
import AdminDashboard from "@/src/pages/AdminDashboard";
import QuizTopicPage from "@/src/pages/QuizTopic";
import GenerateQuizPage from "@/src/pages/GenerateQuiz";
import ReviewQuestionsPage from "@/src/pages/ReviewQuestions";
import QuizSettingsPage from "@/src/pages/QuizSettings";
import WaitingRoomPage from "@/src/pages/WaitingRoom";
import QuizSessionPage from "@/src/pages/QuizSession";
import PlayerJoinPage from "@/src/pages/PlayerJoin";
import MyQuizzesPage from "@/src/pages/MyQuizzes";
import { Toaster } from "@/components/ui/sonner";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  // If no user, we'll assume the AuthContext handles automatic anonymous login or just let them through
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<PlayerJoinPage />} />
          <Route path="/join/:pin" element={<PlayerJoinPage />} />
          <Route path="/session" element={<QuizSessionPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/topics" element={<QuizTopicPage />} />
          <Route path="/admin/my-quizzes" element={<MyQuizzesPage />} />
          <Route path="/admin/generate" element={<GenerateQuizPage />} />
          <Route path="/admin/review" element={<ReviewQuestionsPage />} />
          <Route path="/admin/settings" element={<QuizSettingsPage />} />
          <Route path="/admin/waiting/:sessionId" element={<WaitingRoomPage />} />
          <Route path="/admin/session/:sessionId" element={<QuizSessionPage />} />
        </Routes>
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}

