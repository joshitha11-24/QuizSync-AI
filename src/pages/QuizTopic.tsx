import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Atom, Droplets, FunctionSquare, Leaf, Monitor, GraduationCap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function QuizTopicPage() {
  const navigate = useNavigate();

  const topics = [
    { 
      name: "Physics", 
      icon: <Atom className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80&w=800",
      color: "from-blue-600/80 to-indigo-900/90",
      desc: "Mechanics, Optics & Quantum realms"
    },
    { 
      name: "Chemistry", 
      icon: <Droplets className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1603126731119-c3234222f1d8?auto=format&fit=crop&q=80&w=800",
      color: "from-teal-500/80 to-emerald-900/90",
      desc: "Reactions, Organic & Periodic tables"
    },
    { 
      name: "Maths", 
      icon: <FunctionSquare className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
      color: "from-indigo-600/80 to-purple-900/90",
      desc: "Calculus, Algebra & Geometry"
    },
    { 
      name: "Biology", 
      icon: <Leaf className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800",
      color: "from-green-500/80 to-green-900/90",
      desc: "Genetics, Anatomy & Ecosystems"
    },
    { 
      name: "Computer Science", 
      icon: <Monitor className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
      color: "from-slate-700/80 to-slate-900/90",
      desc: "Algorithms, Web & Data structures"
    },
    { 
      name: "JEE", 
      icon: <GraduationCap className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
      color: "from-orange-600/80 to-red-900/90", 
      isExam: true,
      desc: "Joint Entrance Examination Prep"
    },
    { 
      name: "NEET", 
      icon: <GraduationCap className="h-10 w-10" />, 
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
      color: "from-red-600/80 to-pink-900/90", 
      isExam: true,
      desc: "National Eligibility Entrance Test"
    },
  ];

  const handleTopicSelect = (topic: string, isExam?: boolean) => {
    navigate(`/admin/generate?topic=${topic}&type=${isExam ? 'exam' : 'subject'}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <Button 
          variant="ghost" 
          className="mb-12 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl h-12 px-6" 
          onClick={() => navigate("/admin")}
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Return to Hub
        </Button>

        <div className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black text-white mb-4 tracking-tighter uppercase italic"
          >
            Choose your <span className="text-primary">Arena</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-xl font-medium max-w-2xl"
          >
            Select a subject or exam module. Our AI will craft a high-stakes challenge based on your choice.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {topics.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => handleTopicSelect(item.name, item.isExam)}
              className="group cursor-pointer"
            >
              <Card className="relative h-[450px] border-none overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl transition-all duration-500 group-hover:shadow-primary/20">
                {/* Background Image */}
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Overlays */}
                <div className={`absolute inset-0 bg-gradient-to-t ${item.color} group-hover:opacity-90 transition-opacity`} />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2.5rem]" />

                {/* Content */}
                <CardContent className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <div className="mb-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl w-fit group-hover:bg-white group-hover:text-slate-900 transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-3xl font-black mb-2 tracking-tight">{item.name}</h3>
                  <p className="text-sm text-white/70 font-medium mb-4">{item.desc}</p>
                  
                  {item.isExam ? (
                    <div className="flex items-center space-x-2">
                       <span className="px-4 py-1.5 bg-white text-slate-900 text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                          Exam Module
                       </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                       <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/20">
                          Subject Base
                       </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
