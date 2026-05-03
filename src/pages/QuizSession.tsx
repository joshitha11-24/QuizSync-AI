import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, query, where, getDocs, doc, onSnapshot, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, Users, ArrowRight, AlertTriangle, Activity } from "lucide-react";
import socket from "@/src/lib/socket";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

export default function QuizSessionPage() {
  const [searchParams] = useSearchParams();
  const { sessionId: sessionIdParam } = useParams();
  const navigate = useNavigate();
  const pin = searchParams.get("pin");
  
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [status, setStatus] = useState<"waiting" | "question" | "leaderboard" | "finished">("waiting");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!pin && !sessionIdParam) return;

    const init = async () => {
      try {
        // Ensure user is signed in
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }

        let sessionData: any = null;
        let sessionId: string | null = sessionIdParam || null;

        if (pin) {
          // Find session by pin
          const q = query(collection(db, "quiz_sessions"), where("pin", "==", pin));
          let snap;
          try {
            snap = await getDocs(q);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, "quiz_sessions");
            return;
          }
          if (snap.empty) {
            toast.error("Session not found");
            navigate("/");
            return;
          }
          sessionData = snap.docs[0].data();
          sessionId = snap.docs[0].id;
        } else if (sessionId) {
          // Find session by id
          let snap;
          try {
            snap = await getDoc(doc(db, "quiz_sessions", sessionId));
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `quiz_sessions/${sessionId}`);
            return;
          }
          if (!snap.exists()) {
            toast.error("Session not found");
            navigate("/");
            return;
          }
          sessionData = snap.data();
        }

        setSession({ id: sessionId, ...sessionData });
        setIsAdmin(sessionData.adminId === auth.currentUser?.uid);
        setStatus(sessionData.status);

        // Fetch Quiz
        let quizSnap;
        try {
          quizSnap = await getDoc(doc(db, "quizzes", sessionData.quizId));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `quizzes/${sessionData.quizId}`);
          return;
        }
        if (quizSnap.exists()) {
          const qData = quizSnap.data();
          setQuiz(qData);
          setTimeLeft(qData.timePerQuestion || 10);
        }

        // Socket Listeners
        const finalPin = sessionData.pin;
        const joinPayload = { 
          pin: finalPin, 
          name: auth.currentUser?.displayName || "Player", 
          uid: auth.currentUser?.uid, 
          isAdmin: sessionData.adminId === auth.currentUser?.uid,
          status: sessionData.status
        };
        
        const initSocket = () => {
          socket.emit("join-session", joinPayload);
        };

        initSocket();

        socket.off("connect");
        socket.on("connect", initSocket);

        socket.off("room-update");
        socket.on("room-update", (data) => {
          if (data.participants) {
            // Deduplicate participants by uid just in case
            const uniqueParticipants = data.participants.reduce((acc: any[], current: any) => {
              const x = acc.find(item => item.uid === current.uid);
              if (!x) {
                return acc.concat([current]);
              } else {
                return acc;
              }
            }, []);
            setParticipants(uniqueParticipants);
          }
          if (data.currentQuestionIndex !== undefined) {
            setCurrentQIndex(data.currentQuestionIndex);
          }
          if (data.status) {
            // Only update status from server if it's not "waiting" OR if we are currently "waiting"
            // This prevents a server restart (re-defaulting to waiting) from breaking an active session UI
            setStatus(prev => {
              if (prev !== "waiting" && data.status === "waiting") return prev;
              return data.status as any;
            });
          }
        });

        socket.off("question-changed");
        socket.on("question-changed", ({ index }) => {
          setCurrentQIndex(index);
          setStatus("question");
          setSelectedAnswer(null);
          setHasAnswered(false);
          // Use qData local reference since state might not be updated yet
          const time = (quizSnap.data() as any)?.timePerQuestion || 10;
          setTimeLeft(time);
        });

        socket.off("quiz-ended");
        socket.on("quiz-ended", () => {
          setStatus("finished");
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "quiz_sessions or quizzes");
      }
    };

    init();

    const handleVisibilityChange = () => {
      if (document.hidden && status === "question") {
        toast.warning("Don't leave the tab! Focus on the quiz.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("room-update");
      socket.off("question-changed");
      socket.off("quiz-ended");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pin, sessionIdParam, navigate]);

  // Use a second effect for timer to ensure it restarts when currentQIndex or status changes
  useEffect(() => {
    if (status !== "question" || !quiz) return;

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, currentQIndex, quiz?.id]);

  const handleTimeUp = () => {
    if (isAdmin) {
      // Admin notifies server to switch to leaderboard for everyone
      socket.emit("change-status", { pin: session.pin, status: "leaderboard" });
    }
    // Locally switch too (server will also broadcast back but this makes it snappier)
    setStatus("leaderboard");
    if (!isAdmin && !hasAnswered) {
      toast.error("Time's up! You didn't answer.");
    }
  };

  const handleAnswer = (answer: string) => {
    if (hasAnswered || status !== "question") return;
    setSelectedAnswer(answer);
    setHasAnswered(true);

    const isCorrect = answer === quiz.questions[currentQIndex].correctAnswer;
    const scoreIncrement = isCorrect ? (quiz.marksPerQuestion || 1) : 0;
    
    socket.emit("submit-answer", { 
      pin: session.pin, 
      uid: auth.currentUser?.uid, 
      isCorrect, 
      scoreIncrement 
    });

    if (isCorrect) {
      toast.success("Correct Answer!");
    } else {
      toast.error(`Wrong! Correct was: ${quiz.questions[currentQIndex].correctAnswer}`);
    }
  };

  const handleNext = () => {
    if (currentQIndex + 1 < quiz.questions.length) {
      socket.emit("next-question", { pin: session.pin, index: currentQIndex + 1 });
    } else {
      socket.emit("quiz-finished", { pin: session.pin });
    }
  };

  if (!quiz || !session) return <div className="min-h-screen flex items-center justify-center">Loading quiz scene...</div>;

  const currentQ = quiz.questions[currentQIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Background Grids & FX */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/10 rounded-full blur-[200px] -z-10 animate-pulse pointer-events-none" />

      {/* HUD Header */}
      <header className="bg-white/5 backdrop-blur-2xl border-b border-white/10 p-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-8">
          <div className="bg-primary/20 px-6 py-3 rounded-2xl border border-primary/30 shadow-lg shadow-primary/20">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-1">Vector</span>
            <div className="text-3xl font-black italic tracking-tighter">
               {String(currentQIndex + 1).padStart(2, '0')} <span className="text-slate-600">/ {String(quiz.questions.length).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="hidden md:block space-y-1">
            <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500">Active Arena</h2>
            <div className="text-xl font-black italic tracking-tight text-white uppercase">{quiz.title}</div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className={`px-6 py-3 rounded-2xl flex items-center space-x-4 border transition-all ${timeLeft < 5 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
            <Clock className={`h-6 w-6 ${timeLeft < 5 ? 'text-red-500' : 'text-primary'}`} />
            <span className="text-3xl font-black font-mono tracking-tighter">{String(timeLeft).padStart(2, '0')}s</span>
          </div>
          {isAdmin && status === "question" && (
            <Button variant="outline" className="h-16 px-6 rounded-2xl font-black border-white/10 bg-white/10 hover:bg-white/20 text-white" onClick={handleTimeUp}>
              SKIP TO RESULTS
            </Button>
          )}
          {isAdmin && status === "leaderboard" && (
            <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40" onClick={handleNext}>
              {currentQIndex + 1 === quiz.questions.length ? "FINALIZE SESSION" : "NEXT COMMAND"}
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          {status === "question" && (
            <motion.div
              key="q"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-12"
            >
              <Card className="border-white/10 shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[3.5rem] overflow-hidden relative border">
                <div className="absolute top-0 left-0 w-full h-2 bg-white/5">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: quiz.timePerQuestion || 10, ease: "linear" }}
                    className={`h-full transition-colors ${timeLeft < 5 ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]'}`}
                  />
                </div>
                <CardContent className="p-16 text-center">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter italic"
                  >
                    "{currentQ.question}"
                  </motion.h1>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {currentQ.options.map((option: string, i: number) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={hasAnswered || isAdmin}
                    onClick={() => handleAnswer(option)}
                    className={`
                      p-8 rounded-[2.5rem] text-3xl font-black text-left border border-white/10 transition-all backdrop-blur-xl relative overflow-hidden group
                      ${selectedAnswer === option ? 'bg-primary text-white border-primary shadow-[0_0_40px_rgba(59,130,246,0.3)] scale-[1.03]' : 'bg-white/5 text-slate-300 hover:border-primary/50 hover:bg-white/10'}
                      ${isAdmin ? 'cursor-default opacity-80' : 'cursor-pointer'}
                      ${hasAnswered && selectedAnswer !== option ? 'opacity-40 grayscale-[0.5]' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-8 relative z-10">
                      <span className={`h-16 w-16 rounded-[1.25rem] flex items-center justify-center font-black text-2xl transition-colors ${selectedAnswer === option ? 'bg-white text-primary' : 'bg-white/5 text-slate-500 group-hover:text-primary'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="tracking-tighter uppercase">{option}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {status === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, rotateX: 45 }}
              animate={{ opacity: 1, rotateX: 0 }}
              className="space-y-10"
            >
              <div className="text-center mb-16 space-y-4">
                <Trophy className="h-32 w-32 text-primary mx-auto mb-6 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-bounce" />
                <h2 className="text-7xl font-black uppercase italic tracking-tighter text-white">INTEL <span className="text-primary">FEED</span></h2>
                <div className="text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Real-time Rankings Update</div>
              </div>

              <div className="grid gap-6 max-w-4xl mx-auto">
                {[...participants].sort((a, b) => b.score - a.score).map((p, i) => (
                  <motion.div
                    key={`${p.uid}-${i}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={`border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden ${i === 0 ? 'bg-primary/20 border-primary/50 ring-2 ring-primary/30' : 'bg-white/5 backdrop-blur-xl'}`}>
                      <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl ${i === 0 ? 'bg-primary text-white' : 'bg-white/5 text-slate-500'}`}>
                            {i + 1}
                          </div>
                          <div className="space-y-1">
                            <div className="text-3xl font-black text-white italic truncate max-w-[300px] uppercase">{p.name}</div>
                            {i === 0 && <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Dominating</div>}
                          </div>
                        </div>
                        <div className="text-5xl font-black text-primary font-mono tracking-tighter">{p.score} <span className="text-lg text-slate-500">PTS</span></div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {status === "finished" && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl font-black uppercase italic text-primary tracking-[0.2em] mb-16 animate-pulse">GAME OVER</div>
              <div className="max-w-2xl mx-auto space-y-12">
                <div className="p-20 bg-white/5 backdrop-blur-3xl rounded-[5rem] border border-white/10 shadow-2xl relative">
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                    <div className="h-40 w-40 bg-primary/20 rounded-full blur-3xl absolute inset-0 -z-10" />
                    <Trophy className="h-32 w-32 text-primary drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]" />
                  </div>
                  <h3 className="text-6xl font-black mb-4 uppercase italic tracking-tighter text-white mt-8">
                    {[...participants].sort((a, b) => b.score - a.score)[0]?.name || "UNKNOWN"}
                  </h3>
                  <div className="text-xs font-black text-primary uppercase tracking-[0.5em] mb-8">Supreme Champion</div>
                  <div className="h-[1px] w-full bg-white/10 mb-10" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Arena Simulation Terminated Successfully.</p>
                </div>
                <Button 
                  className="w-full h-24 text-3xl font-black rounded-[3rem] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-all hover:scale-105" 
                  onClick={() => navigate("/")}
                >
                   RETURN TO HUB
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "waiting" && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
              <Users className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black italic tracking-tighter uppercase">Initializing Arena</h2>
              <p className="text-slate-500 font-bold tracking-widest uppercase italic">Awaiting Host Command...</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-10 py-5 rounded-[2rem] font-mono text-3xl">
              PIN: {session.pin}
            </div>
          </div>
        )}
      </main>

      {/* HUD Footer */}
      <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 p-6 flex justify-center text-slate-500 font-black text-xs uppercase tracking-[0.4em] space-x-12 relative z-20">
        <div className="flex items-center space-x-3">
          <Users className="h-4 w-4 text-primary" />
          <span>{participants.length} CONTESTANTS ACTIVE</span>
        </div>
        <div className="flex items-center space-x-3">
          <Activity className="h-4 w-4 text-primary" />
          <span>LIVE DATA FEED SYNCED</span>
        </div>
      </footer>
    </div>

  );
}
