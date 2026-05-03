import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Play, Trash2, Edit, ChevronLeft, Calendar, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function MyQuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "quizzes"), 
        where("adminId", "==", user.uid)
      );
      
      unsubscribeSnap = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date()
          };
        });

        // Client-side sort
        const sortedData = [...data].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setQuizzes(sortedData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "quizzes");
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    
    console.log("Attempting to delete quiz:", id);
    try {
      await deleteDoc(doc(db, "quizzes", id));
      console.log("Quiz deleted successfully");
      toast.success("Quiz deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete quiz. Check console for details.");
      handleFirestoreError(err, OperationType.DELETE, `quizzes/${id}`);
    }
  };

  const handleReuse = (quiz: any) => {
    sessionStorage.setItem("draft_quiz", JSON.stringify(quiz));
    navigate("/admin/settings");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" className="mb-8" onClick={() => navigate("/admin")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">My Quizzes</h1>
            <p className="text-slate-500 text-lg">Manage your created quizzes and reuse them for sessions.</p>
          </div>
          <Button onClick={() => navigate("/admin/topics")}>Create New</Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading your quizzes...</div>
        ) : quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                whileHover={{ y: -5 }}
              >
                <Card className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white rounded-3xl">
                  <div className="h-2 bg-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 mb-1">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5" onClick={() => handleReuse(quiz)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-red-500 hover:bg-red-50" onClick={() => handleDelete(quiz.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {quiz.topic}
                      </span>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {quiz.questions.length} Qs
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-400 mb-6 font-medium">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      Created {quiz.createdAt?.toDate ? quiz.createdAt.toDate().toLocaleDateString() : "Just now"}
                    </div>
  
                    <Button className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20" onClick={() => handleReuse(quiz)}>
                      <Play className="mr-2 h-4 w-4 fill-current" />
                      Host Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              <img 
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400" 
                alt="Empty state" 
                className="w-48 h-48 object-cover rounded-[2rem] mx-auto shadow-2xl rotate-3 relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-3xl font-black mb-4 text-slate-900 leading-tight">Your Quiz Galaxy is Empty</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Let's populate it with some AI-generated magic!</p>
            <Button size="lg" className="rounded-2xl px-10 font-bold h-14 shadow-xl shadow-primary/20" onClick={() => navigate("/admin/topics")}>Generate First Quiz</Button>
          </div>
        )}
      </div>
    </div>
  );
}
