import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Play, Copy, CheckCircle2, Activity } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import socket from "@/src/lib/socket";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function WaitingRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const initSocket = (pin: string, status: string = "waiting") => {
      socket.emit("join-session", { 
        pin, 
        name: auth.currentUser?.displayName || "Admin", 
        uid: auth.currentUser?.uid,
        isAdmin: true,
        status: status
      });
    };

    const unsubscribe = onSnapshot(doc(db, "quiz_sessions", sessionId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSession(data);
        if (data.pin) initSocket(data.pin, data.status);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `quiz_sessions/${sessionId}`);
    });

    const onConnect = () => {
      if (session?.pin) initSocket(session.pin);
    };

    socket.on("connect", onConnect);
    socket.on("room-update", (data) => {
      setParticipants(data.participants);
    });

    return () => {
      unsubscribe();
      socket.off("connect", onConnect);
      socket.off("room-update");
    };
  }, [sessionId, session?.pin]);

  const handleStart = async () => {
    if (!session?.pin) return;
    try {
      await updateDoc(doc(db, "quiz_sessions", sessionId!), {
        status: "question",
        startTime: new Date().toISOString()
      });
      socket.emit("start-quiz", { pin: session.pin });
      navigate(`/admin/session/${sessionId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `quiz_sessions/${sessionId}`);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join/${session?.pin}`;
    navigator.clipboard.writeText(link);
    toast.success("Join link copied to clipboard!");
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center">Loading session arena...</div>;

  const joinUrl = `${window.location.origin}/join/${session.pin}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 relative overflow-hidden flex flex-col items-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[150px] -z-10" />

      <div className="max-w-7xl w-full relative z-10">
        <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 text-primary">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Broadcast Live</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic">
              ARENA <span className="text-primary italic">ASSEMBLY</span>
            </h1>
            <p className="text-slate-400 text-xl font-medium">Gathering contestants for <span className="text-white font-black">{session.title || "The Ultimate Challenge"}</span></p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
            <div className="text-center px-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Session ID</div>
              <div className="text-4xl font-black text-white font-mono">{session.pin}</div>
            </div>
            <div className="hidden md:block h-12 w-[1px] bg-white/10" />
            <div className="flex-1 min-w-0 px-4 text-center md:text-left">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Join Link</div>
              <div className="text-sm font-bold text-primary truncate max-w-[200px] md:max-w-xs">{joinUrl}</div>
            </div>
            <Button variant="ghost" onClick={copyLink} className="h-14 px-6 rounded-2xl bg-white/5 hover:bg-primary hover:text-white transition-all shrink-0 flex items-center space-x-2 font-black text-[10px] uppercase tracking-widest">
               <Copy className="h-5 w-5" />
               <span className="hidden sm:inline">Copy Arena Link</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Sidebar: Intel & Action */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-3xl rounded-[3rem] overflow-hidden">
              <CardContent className="p-10 text-center flex flex-col items-center">
                <div className="bg-white p-6 rounded-[2.5rem] mb-8 shadow-2xl">
                  <QRCodeSVG value={joinUrl} size={200} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 leading-relaxed">
                  Contestants scan above <br /> to enter the fray
                </h3>
                <Button 
                  className="w-full h-20 text-2xl font-black rounded-3xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 group transition-all" 
                  onClick={handleStart}
                >
                  <div className="flex items-center space-x-4">
                    <span>START ARENA</span>
                    <Play className="h-8 w-8 fill-current group-hover:scale-125 transition-transform" />
                  </div>
                </Button>
                {participants.length === 0 && (
                  <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic animate-pulse">
                    Awaiting contestants... but you can start anytime
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <div className="flex items-center space-x-4 mb-4">
                 <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                 </div>
                 <h4 className="font-black text-sm uppercase tracking-widest">Network Stability</h4>
              </div>
              <div className="space-y-4">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-green-500" />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Connection: Optimal • Socket: Active</p>
              </div>
            </div>
          </div>

          {/* Right Area: Enlisted Players */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-white/5 h-14 w-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-4xl font-black tracking-tight">{participants.length} <span className="text-slate-500 italic">ENLISTED</span></h2>
              </div>
              <div className="px-6 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                Real-time Syncing
              </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-white/5 border border-white/10 rounded-[3rem] p-10 overflow-hidden relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <AnimatePresence>
                  {participants.map((p, i) => (
                    <motion.div
                      key={`${p.uid}-${i}`}
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all hover:bg-white/10"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {p.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-white truncate text-lg">{p.name}</div>
                          <div className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center mt-1">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 animate-pulse" />
                            Synchronized
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {participants.length === 0 && (
                  <div className="col-span-full py-32 text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="h-32 w-32 mx-auto mb-8 text-white/5" />
                    </motion.div>
                    <p className="text-2xl font-black text-white/20 uppercase tracking-tighter">Awaiting first contestant...</p>
                    <p className="text-slate-600 mt-4 font-bold">Broadcast PIN {session.pin} to initiate intake.</p>
                  </div>
                )}
              </div>
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-20 bg-[length:100%_4px,3px_100%]" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
