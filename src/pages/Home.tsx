import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  ArrowRight, PenLine, Flame, Trophy, Users, 
  AlertCircle, Activity, Settings 
} from 'lucide-react';
import { JarIcon } from '../assets/JarIcon';
import { Link } from 'react-router-dom';
import YummyCharacter from '../components/YummyCharacter';
import QuotesBanner from '../components/QuotesBanner';
import { Pinky, Goldy, Minty } from '../components/EmotionBuddies';

const StudentDashboard = ({ emotions = [], streakDays = 0, user, classMood = { message: '' } }: any) => {
  const getBadgeLabel = (days: number) => {
    if (days >= 15) return 'Master';
    if (days >= 7) return 'Expert';
    if (days >= 1) return 'Beginner';
    return 'Rookie';
  };

  const currentCandyCount = user?.current_candy_count || 0;
  const attendanceDays = user?.attendance_days || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-6">
      {/* Hero Section: Minimal spacing, Logo Removed */}
      <section className="relative flex flex-col items-center justify-center text-center pt-0 pb-4">
        {/* Decorative Background Elements */}
        <Pinky size={60} className="absolute -top-4 left-[20%] opacity-10 -z-10" />
        <Goldy size={50} className="absolute top-10 right-[15%] opacity-10 -z-10" />
        
        <div className="flex flex-col items-center">
          <YummyCharacter />
        </div>
        
        <div className="w-full -mt-4">
           <QuotesBanner />
        </div>

        <div className="space-y-2 px-4 max-w-4xl mx-auto mt-2">
          <motion.h1 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-5xl font-black text-brand-primary tracking-tight"
          >
            오늘의 마음은 <span className="text-brand-mint uppercase">Mint</span>인가요?
          </motion.h1>
          <p className="text-brand-primary/40 font-bold text-base">
            유리병에 달콤한 {currentCandyCount}개의 감정이 담겨있어요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <Link to="/reflection" className="px-7 py-3.5 bg-brand-primary text-white rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-lg text-sm">
             <PenLine size={18} /> 지금 기록하기 <ArrowRight size={16} />
          </Link>
          <Link to="/jar" className="px-7 py-3.5 bg-white text-brand-primary border-2 border-brand-surface rounded-2xl font-black flex items-center gap-2 hover:bg-brand-surface transition-colors text-sm">
             <JarIcon size={18} /> 유리병 확인하기
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
        <Link to="/jar" className="group bg-white p-6 rounded-[2.5rem] border-b-4 border-brand-emerald/30 shadow-lg relative transition-all hover:translate-y-1">
           <div className="w-10 h-10 bg-brand-emerald/40 rounded-xl flex items-center justify-center text-brand-emerald mb-4">
              <JarIcon size={20} />
           </div>
           <h3 className="text-sm font-black text-brand-primary uppercase tracking-wider">Jar Status</h3>
           <p className="text-2xl font-black text-brand-primary mt-1">{currentCandyCount} <span className="text-sm text-brand-primary/60">/ 15</span></p>
           <div className="w-full h-1.5 bg-brand-surface rounded-full mt-3 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(currentCandyCount / 15) * 100}%` }} className="h-full bg-brand-emerald" />
           </div>
           <Minty size={60} className="absolute -bottom-2 -right-2 opacity-5" />
        </Link>

        <Link to="/board" className="group bg-white p-6 rounded-[2.5rem] border-b-4 border-brand-purple/40 shadow-lg relative transition-all hover:translate-y-1">
           <div className="w-10 h-10 bg-brand-purple/40 rounded-xl flex items-center justify-center text-brand-purple mb-4">
              <Users size={20} />
           </div>
           <h3 className="text-sm font-black text-brand-primary uppercase tracking-wider">Group Mood</h3>
           <p className="text-sm text-brand-primary/70 font-bold mt-1 leading-tight italic truncate">
             "{classMood.message || '공감 대기 중...'}"
           </p>
           <Goldy size={60} className="absolute -bottom-2 -right-2 opacity-5" />
        </Link>

        <div className="group bg-brand-primary p-6 rounded-[2.5rem] border-b-4 border-black/20 shadow-lg relative text-white transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-brand-pink/60 rounded-xl flex items-center justify-center">
                 <Flame size={20} className="text-brand-pink fill-brand-pink/80" />
              </div>
              <span className="px-2 py-1 bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">
                 {getBadgeLabel(attendanceDays)}
              </span>
           </div>
           <h3 className="text-sm font-black opacity-60 uppercase tracking-wider">연속 출석Streak</h3>
           <p className="text-3xl font-black mt-1">{user?.streak || 0}일차</p>
           <Pinky size={80} className="absolute -bottom-2 -right-2 opacity-10" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto px-6 pt-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div className="space-y-1">
           <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black tracking-widest uppercase">
              Admin
           </div>
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-brand-primary tracking-tight">Management</h2>
              <Link to="/inboard" className="p-1 hover:bg-brand-surface rounded-lg transition-colors text-brand-primary/40 flex items-center gap-1 text-xs font-bold">
                 상세 대시보드 <ArrowRight size={14} />
              </Link>
              <Link to="/settings" className="p-1 hover:bg-brand-surface rounded-lg transition-colors text-brand-primary/40">
                 <Settings size={22} />
              </Link>
           </div>
        </div>
      </div>

      <div className="w-full mb-8">
         <QuotesBanner />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: '전체 수강생', value: '156명', icon: Users, color: 'text-brand-primary' },
           { label: '금일 회고', value: '142명', icon: PenLine, color: 'text-brand-mint' },
           { label: '미제출', value: '14명', icon: AlertCircle, color: 'text-brand-yellow' },
           { label: '위험군', value: '3명', icon: Activity, color: 'text-brand-pink' },
         ].map((stat, i) => {
           const Icon = stat.icon;
           return (
             <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-brand-surface shadow-sm relative overflow-hidden">
                <Icon className={`${stat.color} mb-2`} size={20} />
                <p className="text-[9px] font-black text-brand-primary/40 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-brand-primary">{stat.value}</p>
             </div>
           );
         })}
      </div>
    </div>
  );
};

export default function Home() {
  const user = useStore((state) => state.user);
  const emotions = useStore((state) => state.emotions);
  const streakDays = useStore((state) => state.streakDays);
  const classMood = useStore((state) => state.classMood);
  const fetchHistory = useStore((state) => state.fetchHistory);
  const fetchBoard = useStore((state) => state.fetchBoard);

  useEffect(() => {
    if (user?.role === 'student') {
        fetchHistory();
    }
    fetchBoard();
  }, [user, fetchHistory, fetchBoard]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-12 pt-0"
    >
      <div className="mt-0">
        {user?.role === 'student' ? (
          <StudentDashboard 
            emotions={emotions} 
            streakDays={streakDays} 
            user={user}
            classMood={classMood}
          />
        ) : (
          <AdminDashboard />
        )}
      </div>
    </motion.div>
  );
}
