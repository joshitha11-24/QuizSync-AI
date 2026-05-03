import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ArrowRight, Save, Activity } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReviewQuestionsPage() {
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const draft = sessionStorage.getItem("draft_quiz");
    if (!draft) {
      navigate("/admin/topics");
      return;
    }
    const data = JSON.parse(draft);
    setQuizData(data);
    setQuestions(data.questions);
  }, []);

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleDelete = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setQuestions([...questions, {
      question: "New Question",
      options: ["", "", "", ""],
      correctAnswer: ""
    }]);
  };

  const handleSaveAndContinue = () => {
    // Validate
    const isValid = questions.every(q => 
      q.question && q.options.every(o => o) && q.correctAnswer && q.options.includes(q.correctAnswer)
    );

    if (!isValid) {
      toast.error("Please fill all fields and ensure correct answer matches an option.");
      return;
    }

    sessionStorage.setItem("draft_quiz", JSON.stringify({ ...quizData, questions }));
    navigate("/admin/settings");
  };

  if (!quizData) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Technical Grids */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-6xl mx-auto p-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-primary font-black text-xs uppercase tracking-[0.3em]">
               <Activity className="h-4 w-4 animate-pulse" />
               <span>Status: Engineering</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">DATA <span className="text-primary italic">REFINERY</span></h1>
            <p className="text-slate-400 font-medium">Verify the integrity of AI-generated intelligence modules.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleAdd} className="h-14 px-8 rounded-2xl font-bold bg-transparent border-white/10 hover:bg-white/5 transition-all">
              <Plus className="mr-2 h-5 w-5" />
              ADD BLOCK
            </Button>
            <Button onClick={handleSaveAndContinue} className="h-14 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 transition-all hover:scale-105">
              DEPLOY TO PRODUCTION
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 pb-24">
          {questions.map((q, qIndex) => (
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden group bg-white/5 backdrop-blur-3xl border border-white/5">
                <div className="flex flex-col lg:flex-row h-full">
                  {/* Hex Counter */}
                  <div className="lg:w-24 bg-primary/10 flex items-center justify-center border-r border-white/5 relative overflow-hidden group-hover:bg-primary/20 transition-colors">
                    <span className="text-5xl font-black text-primary/30 group-hover:text-primary transition-colors font-mono z-10">
                      {String(qIndex + 1).padStart(2, '0')}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  </div>

                  <div className="flex-1 p-12 relative">
                    <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" className="text-red-400 h-12 w-12 rounded-2xl hover:bg-red-500/10" onClick={() => handleDelete(qIndex)}>
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    </div>
                    
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 ml-1">Question Vector</Label>
                        <textarea 
                          className="w-full text-3xl font-black bg-white/5 border border-white/5 rounded-[2rem] p-8 focus:ring-2 focus:ring-primary/50 min-h-[140px] resize-none outline-none leading-tight text-white transition-all placeholder:text-white/10" 
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(qIndex, "question", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Node {String.fromCharCode(65 + oIndex)}</Label>
                              {q.correctAnswer === option && <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Validated</span>}
                            </div>
                            <div className="relative group/opt">
                              <Input 
                                value={option}
                                onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                                className={`h-16 text-xl font-bold rounded-2xl transition-all border-white/10 bg-white/5 text-white ${
                                  q.correctAnswer === option 
                                    ? "border-green-500 ring-4 ring-green-900/30 bg-green-950/20" 
                                    : "hover:border-primary/50"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 w-full">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 block">Designated Truth</Label>
                          <Select 
                            value={q.correctAnswer} 
                            onValueChange={(v) => handleUpdateQuestion(qIndex, "correctAnswer", v)}
                          >
                            <SelectTrigger className="h-16 rounded-2xl border-white/10 bg-white/5 text-white font-black text-lg">
                              <SelectValue placeholder="Select Validated Node" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/10 bg-slate-900 text-white shadow-2xl">
                              {q.options.map((opt, i) => opt && (
                                <SelectItem key={i} value={opt} className="font-bold py-4 focus:bg-primary focus:text-white transition-colors uppercase italic">{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:w-56 bg-white/5 rounded-[2rem] p-6 border border-white/5 flex items-center justify-center">
                           <div className="text-center">
                              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Weight Value</div>
                              <div className="text-4xl font-black text-white">100.00</div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
