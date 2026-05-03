import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BrainCircuit, Loader2, ChevronLeft, Zap, CheckCircle2, Users } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { generateQuizQuestions } from "@/src/lib/gemini";

export default function GenerateQuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get("topic") || "";
  const type = searchParams.get("type") || "subject";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    grade: "12th",
    chapter: "",
    difficulty: "Medium",
    numQuestions: "10",
    language: "English",
  });

  const handleGenerate = async () => {
    if (type === "subject" && !formData.chapter) {
      toast.error("Please specify a chapter");
      return;
    }

    setLoading(true);
    try {
      const questions = await generateQuizQuestions(
        topic,
        formData.chapter,
        formData.difficulty,
        parseInt(formData.numQuestions),
        formData.language,
        type === "exam"
      );
      // Store in session storage for review
      sessionStorage.setItem("draft_quiz", JSON.stringify({
        topic,
        title: type === "exam" ? `${topic} Mock Test` : `${topic}: ${formData.chapter}`,
        difficulty: formData.difficulty,
        numQuestions: formData.numQuestions,
        language: formData.language,
        questions,
      }));
      
      navigate("/admin/review");
    } catch (err) {
      toast.error("AI Error: Could not generate quiz questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Cinematic Backgrounds */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" 
          alt="bg" 
          className="w-full h-full object-cover opacity-20 scale-110 blur-[2px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
      </div>

      {/* Floating Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animation-delay-2000" />

      <div className="w-full max-w-4xl px-6 relative z-10 py-12">
        <Button 
          variant="ghost" 
          className="mb-8 text-white/50 hover:text-white hover:bg-white/5 rounded-2xl h-12 px-6 font-bold transition-all" 
          onClick={() => navigate("/admin/topics")}
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Abort Launch
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Info Side */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="h-20 w-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 mb-8 group overflow-hidden">
                <BrainCircuit className="h-10 w-10 text-white transition-transform group-hover:scale-125" />
              </div>
              <h1 className="text-5xl font-black text-white leading-none tracking-tighter">
                ENGINEERING <br />
                <span className="text-primary italic">THE ARENA</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Topic: <span className="text-white font-black uppercase tracking-widest">{topic}</span>
              </p>
              <div className="h-1 w-20 bg-primary rounded-full" />
            </motion.div>

            <div className="space-y-6">
              {[
                { icon: <Zap className="h-5 w-5" />, text: "Gemini 1.5 Flash Precision" },
                { icon: <CheckCircle2 className="h-5 w-5" />, text: "Balanced MCQ Complexity" },
                { icon: <Users className="h-5 w-5" />, text: "Sync Ready Layout" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl"
            >
              <div className="space-y-8">
                {type === "subject" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Academic Grade</Label>
                        <Select value={formData.grade} onValueChange={(v) => setFormData({...formData, grade: v})}>
                          <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 text-white focus:ring-primary font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            <SelectItem value="11th" className="font-bold">Class 11th</SelectItem>
                            <SelectItem value="12th" className="font-bold">Class 12th</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Linguistic Base</Label>
                        <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                          <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 text-white focus:ring-primary font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            <SelectItem value="English" className="font-bold">English</SelectItem>
                            <SelectItem value="Tamil" className="font-bold">Tamil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Detailed Chapter Path</Label>
                      <Input 
                        placeholder="Ex: Quantum Mechanics, Organic Chemistry..." 
                        value={formData.chapter}
                        onChange={(e) => setFormData({...formData, chapter: e.target.value})}
                        className="h-14 rounded-2xl border-white/10 bg-white/5 text-white focus-visible:ring-primary text-lg font-bold placeholder:text-white/20"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Complexity Level</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                      <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 text-white focus:ring-primary font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                        <SelectItem value="Easy" className="text-green-400 font-bold">Lvl 1: Novice</SelectItem>
                        <SelectItem value="Medium" className="text-yellow-400 font-bold">Lvl 2: Expert</SelectItem>
                        <SelectItem value="Hard" className="text-red-400 font-bold">Lvl 3: Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Inventory Size</Label>
                    <Select value={formData.numQuestions} onValueChange={(v) => setFormData({...formData, numQuestions: v})}>
                      <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-white/5 text-white focus:ring-primary font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                        <SelectItem value="5" className="font-bold">5 Items</SelectItem>
                        <SelectItem value="10" className="font-bold">10 Items</SelectItem>
                        <SelectItem value="15" className="font-bold">15 Items</SelectItem>
                        <SelectItem value="20" className="font-bold">20 Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full h-20 text-2xl font-black rounded-[2rem] mt-6 shadow-2xl shadow-primary/40 transition-all hover:scale-[1.03] active:scale-[0.97] bg-primary text-white" 
                  onClick={handleGenerate} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                      SYNTHESIZING...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-4 h-8 w-8 fill-current" />
                      INITIATE GENERATION
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
