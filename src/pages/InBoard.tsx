import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ShieldCheck, AlertTriangle, Users, TrendingDown, ChevronRight, BarChart3 } from 'lucide-react';
import axios from 'axios';

interface Stats {
  totalStudents: number;
  todayReflections: number;
  highRiskCount: number;
}

export default function InBoard() {
  const { user } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [newGroupName, setNewGroupName] = useState('');

  const fetchStats = async (groupId?: string) => {
    try {
      const token = localStorage.getItem('token'); // 또는 스토어에서 가져옴
      if (!token) return;
      
      const url = groupId && groupId !== 'all' ? `/api/admin/stats?group_id=${groupId}` : '/api/admin/stats';
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/groups/my-groups');
      if (res.data.success) setGroups(res.data.groups);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'institution' || user?.role === 'instructor') {
      fetchStats();
      fetchGroups();
    }
  }, [user]);

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      const res = await axios.post('/api/groups/create', { name: newGroupName });
      if (res.data.success) {
        alert('그룹이 생성되었습니다.');
        setNewGroupName('');
        fetchGroups();
      }
    } catch (err) {
      alert('그룹 생성 실패');
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gid = e.target.value;
    setSelectedGroup(gid);
    fetchStats(gid);
  };

  if (user?.role !== 'institution' && user?.role !== 'instructor') {
    return <div className="text-center py-20 font-black text-brand-primary">접근 권한이 없습니다.</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-24"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* 기관 정보 & 그룹 필터 */}
        <div className="flex-1 flex items-center justify-between p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                 <ShieldCheck className="text-brand-mint" size={28} />
              </div>
              <div>
                 <h2 className="text-lg font-black tracking-tight">기관 전용 모니터링 시스템</h2>
                 <select 
                   value={selectedGroup}
                   onChange={handleGroupChange}
                   className="bg-transparent text-brand-mint font-bold outline-none border-none text-xs"
                 >
                   <option value="all" className="bg-slate-800 text-white">모든 그룹 보기</option>
                   {groups.map(g => (
                     <option key={g.id} value={g.id} className="bg-slate-800 text-white">{g.name}</option>
                   ))}
                 </select>
              </div>
           </div>
           <div className="hidden md:block text-right px-6 border-l border-white/10">
              <p className="text-xs font-bold text-white/40">기관명</p>
              <p className="font-black text-brand-mint">{(user as any).organization_name || 'Yummy Academy'}</p>
           </div>
        </div>

        {/* 그룹 생성 UI */}
        <div className="bg-white p-4 rounded-[2rem] border-2 border-brand-surface shadow-sm flex items-center gap-3">
          <input 
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="새 그룹명" 
            className="flex-1 px-4 py-2 bg-brand-surface rounded-xl font-bold text-sm outline-none"
          />
          <button 
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl font-black text-xs whitespace-nowrap"
          >
            그룹 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '전체 수강생', value: `${stats?.totalStudents || 0}명`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: '금일 회고 작성', value: `${stats?.todayReflections || 0}건`, icon: BarChart3, color: 'text-brand-mint', bg: 'bg-emerald-50' },
          { label: '중도이탈 위험군', value: `${stats?.highRiskCount || 0}명`, icon: AlertTriangle, color: 'text-brand-pink', bg: 'bg-rose-50' },
        ].map((item, i) => (
          <div key={i} className={`p-8 rounded-[2.5rem] border border-brand-surface shadow-sm space-y-4 transition-all hover:scale-[1.02] bg-white`}>
             <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color}`}>
                <item.icon size={32} />
             </div>
             <div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
               <p className="text-4xl font-black text-slate-800 tracking-tighter">{item.value}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-brand-surface space-y-8 shadow-xl">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <TrendingDown className="text-brand-yellow" /> 주간 위험도 추이
              </h3>
           </div>
           <div className="h-64 flex items-end justify-between gap-3 px-4">
             {[40, 65, 30, 85, 45, 70, 55].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full">
                     <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: `${h}%` }}
                       className={`w-full rounded-t-xl transition-all cursor-pointer ${h > 70 ? 'bg-brand-pink' : 'bg-brand-primary/20 group-hover:bg-brand-primary'}`}
                     />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Day {i+1}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-brand-surface space-y-8 shadow-xl">
           <h3 className="text-2xl font-black text-slate-800">위험군 정밀 모니터링</h3>
           <div className="space-y-4">
              {[
                { name: '김*현', risk: '고위험', score: '0.89', detail: '3일 연속 부정 단어 빈도 급증' },
                { name: '이*우', risk: '주의', score: '0.65', detail: '제출 지연 시간 120분 초과' },
                { name: '박*아', risk: '정상', score: '0.12', detail: '학습 열정 지표 상승 중' },
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                   <div className="flex items-center gap-5">
                      <div className={`w-4 h-4 rounded-full shadow-inner ${user.risk === '고위험' ? 'bg-brand-pink animate-pulse' : user.risk === '주의' ? 'bg-brand-yellow' : 'bg-brand-mint'}`} />
                      <div>
                         <p className="font-black text-slate-800 flex items-center gap-2">
                            {user.name} <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400 font-bold">Prob: {user.score}</span>
                         </p>
                         <p className="text-xs font-bold text-slate-400 mt-1">{user.detail}</p>
                      </div>
                   </div>
                   <ChevronRight className="text-slate-300 group-hover:text-slate-800 transition-colors" size={20} />
                </div>
              ))}
           </div>
           <button className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-black transition-colors">
              전체 수강생 분석 리포트 다운로드 (.PDF)
           </button>
        </div>
      </div>
    </motion.div>
  );
}
