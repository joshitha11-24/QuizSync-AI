import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LayoutDashboard, BookOpen, History, PlusCircle, Users, PlayCircle, CheckCircle2, Trophy, BrainCircuit, Trash2 } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";
import socket from "@/src/lib/socket";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    liveNow: 0,
    completed: 0,
    students: 0,
    avgScore: 0,
  });

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!user) return;

      // Real-time updates via Firestore snapshot
      // Removing orderBy to avoid index requirement for new users
      const quizzesRef = collection(db, "quizzes");
      const q = query(
        quizzesRef, 
        where("adminId", "==", user.uid)
      );
      
      unsubscribeSnap = onSnapshot(q, (snapshot) => {
        setStats(prev => ({ ...prev, totalQuizzes: snapshot.size }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "quizzes");
      });

      // Real-time updates via Socket.IO for live sessions
      socket.emit("get-admin-stats", { adminId: user.uid });
      const handleStatsUpdate = (data: any) => {
        const { totalQuizzes, ...otherStats } = data;
        setStats(prev => ({ ...prev, ...otherStats }));
      };
      
      socket.on("stats-update", handleStatsUpdate);
    });

    return () => {
      unsubAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col hidden md:flex">
        <div className="p-6 border-b flex items-center space-x-2">
          <div className="bg-primary p-1 rounded-lg">
            <PlayCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">QuizSync AI</span>
        </div>
        
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border">
              <img 
                src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
                alt="avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate">{auth.currentUser?.displayName}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link to="/admin" className="flex items-center space-x-3 p-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/topics" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
            <BookOpen className="h-5 w-5" />
            <span>New Quiz</span>
          </Link>
          <Link to="/admin/my-quizzes" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
            <History className="h-5 w-5" />
            <span>Collections</span>
          </Link>
          <Link to="/admin/my-quizzes" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
            <Users className="h-5 w-5" />
            <span>Students</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 mb-10 relative overflow-hidden text-white">
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {auth.currentUser?.displayName?.split(' ')[0]}!</h1>
            <p className="text-slate-300">Your AI engine is ready to generate new challenges for today.</p>
            <div className="mt-6 flex space-x-3">
              <Button onClick={() => navigate("/admin/topics")} className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold">
                <PlusCircle className="mr-2 h-4 w-4" />
                Launch Session
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 -mr-10" />
          <BrainCircuit className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {[
            { label: "Total Quizzes", value: stats.totalQuizzes, icon: <BookOpen className="text-blue-500" /> },
            { label: "Live Now", value: stats.liveNow, icon: <PlayCircle className="text-red-500" /> },
            { label: "Completed", value: stats.completed, icon: <CheckCircle2 className="text-green-500" /> },
            { label: "Students", value: stats.students, icon: <Users className="text-purple-500" /> },
            { label: "Avg Score", value: `${stats.avgScore}%`, icon: <Trophy className="text-yellow-500" /> },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-slate-100 rounded-lg">{stat.icon}</div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

      </main>
    </div>
  );
}
