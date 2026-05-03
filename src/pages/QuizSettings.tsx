import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Clock, Trophy, Shuffle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { db, auth, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function QuizSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [settings, setSettings] = useState({
    title: "",
    timePerQuestion: 10,
    marksPerQuestion: 1,
    speedBonus: true,
    showLeaderboard: true,
    shuffleOptions: false,
  });

  useEffect(() => {
    const draft = sessionStorage.getItem("draft_quiz");
    if (!draft) {
      navigate("/admin/topics");
      return;
    }
    const data = JSON.parse(draft);
    setQuizData(data);
    setSettings(prev => ({ ...prev, title: data.title }));
  }, [navigate]);

  const handleGoLive = async () => {
    if (!settings.title) {
      toast.error("Please provide a quiz title");
      return;
    }

    setLoading(true);
    try {
      const fullQuiz = {
        ...quizData,
        ...settings,
        adminId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "quizzes"), fullQuiz);
      toast.success("Quiz saved successfully!");
      
      // Generate unique PIN for session (6 digits)
      const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      try {
        const sessionRef = await addDoc(collection(db, "quiz_sessions"), {
          quizId: docRef.id,
          pin: pinCode,
          status: "waiting",
          adminId: auth.currentUser?.uid,
          currentQuestionIndex: 0,
          createdAt: serverTimestamp(),
        });
        navigate(`/admin/waiting/${sessionRef.id}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "quiz_sessions");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "quizzes");
    } finally {
      setLoading(false);
    }
  };

  if (!quizData) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-dark.png')] opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] -z-10 animate-pulse" />

      <div className="max-w-4xl w-full p-8 relative z-10">
        <div className="mb-20 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4"
          >
            Phase 04: Deployment
          </motion.div>
          <h1 className="text-7xl font-black tracking-tighter uppercase italic">
            LAUNCH <span className="text-primary">COMMAND</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium">Finalize the sync parameters for your live arena session.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Identity Block */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl">
            <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black text-white">ARENA ID</CardTitle>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Public Session Identity</p>
              </div>
              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                 <Rocket className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Session Headline</Label>
                <Input 
                  value={settings.title}
                  onChange={(e) => setSettings({...settings, title: e.target.value})}
                  placeholder="EX: QUANTUM BRAWL #01"
                  className="h-20 rounded-2xl border-white/10 bg-white/5 focus-visible:ring-primary text-2xl font-black text-white placeholder:text-white/5 px-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logic Block */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl">
            <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black text-white">LOGIC</CardTitle>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Game Physics & Scoring</p>
              </div>
              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                 <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <Clock className="h-7 w-7 text-blue-500" />
                  </div>
                  <div>
                    <Label className="block mb-1 font-black text-white text-lg">PACE</Label>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">SEC / DATA BLOCK</p>
                  </div>
                </div>
                <Select value={settings.timePerQuestion.toString()} onValueChange={(v) => setSettings({...settings, timePerQuestion: parseInt(v)})}>
                  <SelectTrigger className="w-40 h-16 rounded-22xl border-white/10 bg-white/5 font-black text-xl text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-white/10 bg-slate-900 text-white shadow-2xl">
                    {[10, 15, 30, 60].map(s => (
                      <SelectItem key={s} value={s.toString()} className="font-black py-4 focus:bg-primary">{s}s</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="h-14 w-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                    <Trophy className="h-7 w-7 text-yellow-500" />
                  </div>
                  <div>
                    <Label className="block mb-1 font-black text-white text-lg">WEIGHT</Label>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">PTS / CORRECT</p>
                  </div>
                </div>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="w-40 h-16 rounded-2xl border-white/10 bg-white/5 font-black text-2xl text-white pr-12 pl-6" 
                    value={settings.marksPerQuestion}
                    onChange={(e) => setSettings({...settings, marksPerQuestion: parseInt(e.target.value)})}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest">PTS</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tactical Switches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[
            { id: 'speedBonus', label: 'ACCELERATOR', icon: <Rocket className="h-5 w-5" />, desc: 'DYNAMIC SCORING' },
            { id: 'showLeaderboard', label: 'INTEL FEED', icon: <Trophy className="h-5 w-5" />, desc: 'LIVE RANKINGS' },
            { id: 'shuffleOptions', label: 'ENTROPY', icon: <Shuffle className="h-5 w-5" />, desc: 'SHUFFLE NODES' }
          ].map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 transition-all hover:bg-white/10 hover:border-primary/40 group">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  {rule.icon}
                </div>
                <div>
                  <Label className="block text-sm font-black text-white tracking-widest uppercase">{rule.label}</Label>
                  <p className="text-[10px] text-slate-500 font-bold tracking-tight uppercase">{rule.desc}</p>
                </div>
              </div>
              <Switch 
                checked={(settings as any)[rule.id]} 
                onCheckedChange={(v) => setSettings({...settings, [rule.id]: v})} 
                className="data-[state=checked]:bg-primary h-8 w-14"
              />
            </div>
          ))}
        </div>

        <Button 
          className="w-full h-24 text-3xl font-black rounded-[3rem] mt-16 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] group overflow-hidden" 
          size="lg" 
          onClick={handleGoLive} 
          disabled={loading}
        >
          {loading ? (
             <Loader2 className="animate-spin h-10 w-10" />
          ) : (
            <div className="flex items-center space-x-6">
              <Rocket className="h-10 w-10 fill-current group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              <span className="tracking-tighter">IGNITE ARENA</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
