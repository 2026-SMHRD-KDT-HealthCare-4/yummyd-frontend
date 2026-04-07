import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { LogOut, User, Shield, BookOpen, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useStore();
  const [groups, setGroups] = React.useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState<string>(user?.group_id?.toString() || '');

  // 내 기관의 클래스 목록 로드
  React.useEffect(() => {
    if (user?.role === 'student' && user?.class_id) {
      axios.get(`/api/classes/list?class_id=${user.class_id}`).then(res => {
        if (res.data.success) setGroups(res.data.classes);
      });
    }
  }, [user]);

  const handleUpdateGroup = async () => {
    try {
      const res = await axios.patch('/api/auth/update-profile', { group_id: selectedGroup });
      if (res.data.success) {
        alert('소속 그룹이 변경되었습니다.');
        setUser({ ...user, group_id: parseInt(selectedGroup) });
      }
    } catch (err) {
      alert('그룹 변경에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto px-6 py-12"
    >
      {/* ... header ... */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl border border-brand-surface shadow-sm hover:bg-brand-surface transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-brand-primary">설정</h2>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-brand-surface shadow-xl flex items-center gap-6">
          <div className="w-20 h-20 bg-brand-mint/10 rounded-full flex items-center justify-center text-brand-mint">
            <User size={40} />
          </div>
          <div>
            <p className="text-xs font-black text-brand-primary/40 uppercase tracking-widest">Current User</p>
            <h3 className="text-2xl font-black text-brand-primary">{user.username}</h3>
            <p className="text-sm font-bold text-brand-primary/60">{user.role === 'student' ? '수강생' : '교육기관 관리자'}</p>
          </div>
        </div>

        {/* Group Management (For Students) */}
        {user.role === 'student' && (
          <div className="bg-white p-8 rounded-[3rem] border border-brand-surface shadow-xl space-y-4">
             <h4 className="font-black text-brand-primary flex items-center gap-2">
                <BookOpen size={20} className="text-brand-mint" /> 소속 그룹 설정
             </h4>
             <div className="flex gap-3">
               <select 
                 value={selectedGroup}
                 onChange={(e) => setSelectedGroup(e.target.value)}
                 className="flex-1 px-6 py-4 bg-brand-surface rounded-2xl border-none font-bold text-brand-primary"
               >
                 <option value="">그룹 선택</option>
                 {groups.map(g => (
                   <option key={g.id} value={g.id}>{g.name}</option>
                 ))}
               </select>
               <button 
                 onClick={handleUpdateGroup}
                 className="px-6 bg-brand-primary text-white font-black rounded-2xl text-xs hover:bg-brand-primary/80 transition-all"
               >
                 저장
               </button>
             </div>
          </div>
        )}

        {/* Info List */}
        <div className="bg-white rounded-[3rem] border border-brand-surface overflow-hidden">
          {/* ... existing info rows ... */}
          <div className="p-8 border-b border-brand-surface flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Shield size={20} className="text-brand-primary/40" />
               <span className="font-bold text-brand-primary">로그인 ID</span>
            </div>
            <span className="font-black text-brand-primary">{(user as any).login_id || '세션 확인 필요'}</span>
          </div>
          <div className="p-8 border-b border-brand-surface flex items-center justify-between">
            <div className="flex items-center gap-4">
               <BookOpen size={20} className="text-brand-primary/40" />
               <span className="font-bold text-brand-primary">약관 동의 현황</span>
            </div>
            <span className="px-3 py-1 bg-brand-mint/10 text-brand-mint text-[10px] font-black rounded-lg uppercase">Completed</span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full p-6 bg-brand-pink/10 hover:bg-brand-pink/20 text-brand-pink rounded-[2.5rem] flex items-center justify-center gap-3 font-black transition-all border-2 border-brand-pink/10"
        >
          <LogOut size={24} />
          로그아웃
        </button>

        <p className="text-center text-[10px] font-black text-brand-primary/20 uppercase tracking-[0.2em] pt-8">
          Yummy v1.0.0 &copy; 2026 PowerCode
        </p>
      </div>
    </motion.div>
  );
};

export default Settings;
