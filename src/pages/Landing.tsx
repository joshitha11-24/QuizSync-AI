import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Users, Zap, LayoutDashboard, DoorOpen, Activity } from "lucide-react";
import { motion } from "motion/react";

export default function LandingPage() {
  const navigate = useNavigate();

  const tutorials = [
    {
      title: "Generate with AI",
      desc: "Instant quiz creation from any topic using Gemini AI. Our advanced algorithms ensure accurate and challenging questions tailored to your needs.",
      icon: <BrainCircuit className="h-12 w-12 text-blue-500" />,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200",
      color: "from-blue-600/20 to-indigo-600/5"
    },
    {
      title: "Live Multiplayer",
      desc: "Real-time synchronization for students across any device. Host high-energy sessions with instant feedback and live participation.",
      icon: <Users className="h-12 w-12 text-green-500" />,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200",
      color: "from-emerald-600/20 to-teal-600/5"
    },
    {
      title: "Real-time Results",
      desc: "Dynamic leaderboards and performance analytics. Track progress, identify gaps, and celebrate achievements with visual insights.",
      icon: <Zap className="h-12 w-12 text-yellow-500" />,
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200",
      color: "from-amber-500/20 to-yellow-600/5"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">QuizSync AI</span>
        </div>
        <div className="flex space-x-4">
          <Button variant="ghost" onClick={() => navigate("/join")} className="font-bold rounded-xl px-6">
            <DoorOpen className="mr-2 h-4 w-4" />
            Join Quiz
          </Button>
          <Button onClick={() => navigate("/admin")} className="font-bold px-6 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Admin Portal
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 text-primary text-sm font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full mb-10 border border-primary/20"
        >
          Intelligence in Sync
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl md:text-9xl font-black text-slate-900 mb-10 tracking-tighter leading-[0.85]"
        >
          Live Arena, <br />
          <span className="text-primary tracking-[-0.05em] italic">AI Optimized</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl text-slate-500 mb-14 max-w-2xl font-medium"
        >
          The all-in-one platform to create, host, and analyze high-stakes 
          quizzes. Powered by Gemini, built for engagement.
        </motion.p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 items-center justify-center">
          <Button size="lg" className="h-20 px-14 text-2xl font-black rounded-3xl shadow-2xl shadow-primary/40 hover:scale-105 transition-transform" onClick={() => navigate("/admin")}>
            Create Now
          </Button>
          <Button size="lg" variant="outline" className="h-20 px-14 text-2xl font-semibold rounded-3xl border-2 hover:bg-slate-50 transition-colors" onClick={() => navigate("/join")}>
            Join Arena
          </Button>
        </div>


      </section>

      {/* Tutorial Carousel */}
      <section className="py-32 bg-white border-y relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tight mb-6">Experience the AI Advantage</h2>
            <div className="h-2 w-32 bg-primary mx-auto rounded-full" />
          </div>
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {tutorials.map((t, i) => (
                <CarouselItem key={i}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center p-4">
                    <div className="space-y-8">
                      <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center shadow-inner">
                        {t.icon}
                      </div>
                      <h3 className="text-5xl font-black text-slate-900 tracking-tight">{t.title}</h3>
                      <p className="text-2xl text-slate-500 leading-tight font-medium">{t.desc}</p>
                      <Button variant="outline" size="lg" className="rounded-2xl font-black px-10 h-14 border-2 hover:bg-slate-50">
                        View Demo
                      </Button>
                    </div>
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className={`relative rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] bg-gradient-to-br ${t.color} p-4 h-[450px]`}
                    >
                      <img 
                        src={t.image} 
                        alt={t.title} 
                        className="w-full h-full rounded-[2.5rem] object-cover grayscale-[0.2] contrast-125 transition-all duration-1000 hover:scale-110 hover:grayscale-0"
                        referrerPolicy="no-referrer"
                      />
                      {/* Decorative Badge for the 3rd item (Real-time Results) */}
                      {i === 2 && (
                        <div className="absolute top-8 right-8 bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-3 shadow-2xl animate-bounce">
                          <Activity className="h-5 w-5 text-green-500" />
                          <div className="text-left">
                            <div className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Sync</div>
                            <div className="text-white font-black text-sm">99.9% Uptime</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </motion.div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:flex justify-center space-x-6 mt-16">
              <CarouselPrevious className="relative static translate-y-0 h-16 w-16 border-2 hover:bg-slate-50" />
              <CarouselNext className="relative static translate-y-0 h-16 w-16 border-2 hover:bg-slate-50 shadow-xl shadow-slate-200" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Interactive Flow */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black tracking-tighter mb-6 underline decoration-primary/30 decoration-8 underline-offset-8">THE GAME PLAN</h2>
          <p className="text-xl text-slate-500 font-bold tracking-widest uppercase italic">Deploy your arena in seconds</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { 
              step: "01", 
              title: "SELECT TOPIC", 
              desc: "Choose from our preset vertical or input any custom prompt for Gemini to process.",
              image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600"
            },
            { 
              step: "02", 
              title: "AI GENERATION", 
              desc: "Context-aware questions generated instantly with intelligent distractor options.",
              image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600",
              highlight: true
            },
            { 
              step: "03", 
              title: "GO LIVE!", 
              desc: "Host your live lobby and watch results pour in with real-time analytics.",
              image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600"
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -15 }}
              className={`group relative bg-white rounded-[3rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border-2 ${item.highlight ? 'border-primary/50 shadow-primary/10' : 'border-slate-100'} p-6 flex flex-col h-full overflow-hidden`}
            >
              <div className="relative h-64 rounded-[2rem] overflow-hidden mb-10 shadow-lg">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${item.highlight ? 'from-primary/20 to-indigo-600/20' : 'from-slate-900/40 to-transparent'}`} />
                <span className="absolute top-6 left-6 text-6xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-mono italic">{item.step}</span>
              </div>
              <div className="px-2 pb-6">
                <h4 className="text-3xl font-black mb-4 text-slate-900 tracking-tighter">{item.title}</h4>
                <p className="text-lg text-slate-500 leading-tight font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
