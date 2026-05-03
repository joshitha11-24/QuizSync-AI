import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { auth, db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { onSnapshot, doc, collection, query, where, getDocs } from "firebase/firestore";
import socket from "@/src/lib/socket";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";

export default function PlayerJoinPage() {
  const [searchParams] = useSearchParams();
  const { pin: pinParam } = useParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState(pinParam || searchParams.get("pin") || "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (!hasCheckedAuth && auth.currentUser?.displayName) {
      setName(auth.currentUser.displayName);
      setHasCheckedAuth(true);
    }
  }, [auth.currentUser, hasCheckedAuth]);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      if (!waiting || !pin) return;
      
      // Find the session doc ID first
      const q = query(collection(db, "quiz_sessions"), where("pin", "==", pin.trim()));
      const snap = await getDocs(q);
      if (snap.empty) return;
      
      const sessionId = snap.docs[0].id;
      
      // Listen to the session doc for status changes
      unsubscribe = onSnapshot(doc(db, "quiz_sessions", sessionId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const activeStatuses = ["active", "question", "leaderboard"];
          if (activeStatuses.includes(data.status)) {
            navigate(`/session?pin=${pin.trim()}`);
          }
        }
      });
    };

    setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [waiting, pin, navigate]);

  useEffect(() => {
    const onQuizStarted = () => {
      if (pin) navigate(`/session?pin=${pin}`);
    };

    const onConnect = () => {
      if (waiting && pin && auth.currentUser) {
        socket.emit("join-session", { 
          pin: pin.trim(), 
          name: auth.currentUser.displayName || name, 
          uid: auth.currentUser.uid, 
          isAdmin: false 
        });
      }
    };

    socket.on("quiz-started", onQuizStarted);
    socket.on("connect", onConnect);
    return () => {
      socket.off("quiz-started", onQuizStarted);
      socket.off("connect", onConnect);
    };
  }, [pin, navigate, waiting, name]);

  // Handle case where user is already logged in and PIN is in URL
  useEffect(() => {
    const autoJoin = async () => {
      if (pin && auth.currentUser?.displayName && !waiting && !loading && (searchParams.has("pin") || pinParam)) {
        setName(auth.currentUser.displayName);
        // Automatically trigger join if we have everything
        handleJoin().catch(err => {
          console.error("Auto-join failed:", err);
        });
      }
    };
    autoJoin();
  }, [auth.currentUser]); // Only depend on authCurrentUser to trigger once when ready

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin || !name) return;

    setLoading(true);
    try {
      // Login anonymously if not already logged in BEFORE checking pin
      // This avoids permission denied errors for unauthenticated users
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }

      if (user.displayName !== name) {
        await updateProfile(user, { displayName: name });
      }

      // Check if session exists
      const q = query(collection(db, "quiz_sessions"), where("pin", "==", pin.trim()));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "quiz_sessions");
        setLoading(false);
        return;
      }
      
      if (snap.empty) {
        toast.error("Invalid PIN. Please check and try again.");
        setLoading(false);
        return;
      }

      const sessionData = snap.docs[0].data();
      const activeStatuses = ["active", "question", "leaderboard"];
      
      if (sessionData.status === "finished") {
        toast.error("This quiz session has already finished.");
        setLoading(false);
        return;
      }

      console.log(`[JOIN] Emitting join-session for pin: ${pin.trim()}, name: ${name}`);
      // Ensure socket is connected before emitting
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit("join-session", { 
        pin: pin.trim(), 
        name, 
        uid: user.uid, 
        isAdmin: false, 
        status: sessionData.status 
      });
      
      if (activeStatuses.includes(sessionData.status)) {
        navigate(`/session?pin=${pin.trim()}`);
      } else {
        setWaiting(true);
        toast.success("Joined ARENA! Awaiting host...");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "quiz_sessions");
    } finally {
      setLoading(false);
    }
  };

  if (waiting) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <Play className="h-12 w-12 fill-current" />
        </div>
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">You're In!</h1>
        <p className="text-xl opacity-80 mb-8 max-w-sm">Look at the big screen! The quiz will begin when the host is ready.</p>
        <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 font-mono text-2xl">
          PIN: {pin}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <div className="mb-12 text-center">
        <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl mx-auto mb-6 flex items-center justify-center rotate-3 relative overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=400" 
            alt="Quiz icon" 
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">QuizSync AI</h1>
        <p className="text-slate-500 font-medium">Ready to claim the top spot?</p>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[2rem] overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardContent className="p-10">
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Session PIN</label>
              <Input
                placeholder="000000"
                className="h-20 text-center text-4xl font-black focus-visible:ring-primary border-slate-200 rounded-2xl bg-slate-50"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Display Name</label>
              <Input
                placeholder="Ex: QuizMaster"
                className="h-14 text-center text-xl font-bold focus-visible:ring-primary border-slate-200 rounded-2xl bg-slate-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-16 text-2xl font-black rounded-2xl shadow-xl shadow-primary/30" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "JOIN ARENA"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-slate-400 text-sm font-medium">No account needed. Just sync and play.</p>
    </div>
  );
}
