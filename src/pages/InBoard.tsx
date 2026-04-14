import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ShieldCheck, AlertTriangle, Users, PenLine, AlertCircle, ChevronDown, ChevronUp, Plus, TrendingDown, ChevronRight, Activity, BarChart3, Heart, Send, Sparkles, BookOpen } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// ── 기본 아바타: 유리병 SVG (장착 아이템 없을 때) ──────────────
const JarAvatar = () => (
  <svg viewBox="0 0 40 48" fill="none" className="w-full h-full">
    <rect x="10" y="4" width="20" height="4" rx="2" fill="#4FD1A5" opacity="0.7" />
    <path d="M8 8h24v28a8 8 0 01-8 8H16a8 8 0 01-8-8V8z" fill="#E8F5F0" stroke="#4FD1A5" strokeWidth="1.5" />
    <ellipse cx="20" cy="24" rx="7" ry="9" fill="#4FD1A5" opacity="0.15" />
  </svg>
);

interface CandyPost {
  id: number;
  text: string;
  avatarUrl: string | null;
  authorLabel: string;
  likes: number;
  likedBy: number[];
  createdAt: string;
}

interface Stats {
  totalStudents: number;
  todayReflections: number;
  highRiskCount: number;
}

interface ClassStats {
  totalStudents: number;
  todayReflections: number;
  notSubmitted: number;
  highRiskCount: number;
}

interface Student {
  id: number;
  username: string;
  enroll_status: string;
  isHighRisk: boolean;
}


export default function InBoard() {
  const { user } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [isClassListOpen, setIsClassListOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [highRiskStudents, setHighRiskStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<{ id: number; class_name: string } | null>(null);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentFilter, setStudentFilter] = useState<'all' | 'highRisk' | 'dropout'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [consultationNote, setConsultationNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('yummy_token');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const statsRes = await axios.get('/api/admin/stats', config);
      if (statsRes.data.success) setStats(statsRes.data.data);

      const trendRes = await axios.get('/api/admin/weekly-trend', config);
      if (trendRes.data.success) setWeeklyTrend(trendRes.data.data);

      const riskRes = await axios.get('/api/admin/high-risk-students', config);
      if (riskRes.data.success) setHighRiskStudents(riskRes.data.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  const fetchClassStats = async (classId: number) => {
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/admin/class-stats?class_id=${classId}`, config);
      if (res.data.success) setClassStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch class stats:', err);
    }
  };

  const fetchClassStudents = async (classId: number) => {
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/admin/class-students?class_id=${classId}`, config);
      if (res.data.success) setStudents(res.data.data);
    } catch (err) {
      console.error('Failed to fetch class students:', err);
    }
  };

  const fetchStudentMonitoring = async (userId: number) => {
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/admin/student-monitoring?user_id=${userId}`, config);
      if (res.data.success) setMonitoringData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch student monitoring:', err);
    }
  };

  const fetchConsultation = async (userId: number) => {
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/admin/consultation?user_id=${userId}`, config);
      if (res.data.success) setConsultationNote(res.data.data.note || '');
    } catch (err) {
      console.error('Failed to fetch consultation:', err);
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/admin/consultation', { user_id: selectedStudent.id, note: consultationNote }, config);
      alert('상담일지가 저장되었습니다.');
    } catch (err) {
      alert('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClassClick = (group: any) => {
    setSelectedClass({ id: group.id, class_name: group.class_name });
    setSelectedStudent(null);
    setMonitoringData(null);
    setConsultationNote('');
    fetchClassStats(group.id);
    fetchClassStudents(group.id);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setMonitoringData(null);
    setConsultationNote('');
    fetchStudentMonitoring(student.id);
    fetchConsultation(student.id);
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/classes/my-classes', config);
      if (res.data.success) setGroups(res.data.classes);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  // ── 강사용 통계 로드 ──────────────────────────────────────────
  useEffect(() => {
    if ((user?.role as string) === 'institution' || user?.role === 'instructor') {
      fetchStats();
      fetchGroups();
    }
  }, [user]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const token = localStorage.getItem('yummy_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/classes/create', { name: newGroupName }, config);
      if (res.data.success) {
        alert('클래스가 생성되었습니다.');
        setNewGroupName('');
        fetchGroups();
      }
    } catch (err) {
      alert('클래스 생성 실패');
    }
  };

  if ((user?.role as string) !== 'institution' && user?.role !== 'instructor') {
    return <div className="text-center py-20 font-black text-brand-primary">접근 권한이 없습니다.</div>;
  }

  const totalStudents = stats?.totalStudents || 0;
  const todayReflections = stats?.todayReflections || 0;
  const notSubmitted = totalStudents - todayReflections;
  const highRiskCount = stats?.highRiskCount || 0;

  const filteredStudents = students.filter(s => {
    if (studentFilter === 'highRisk') return s.isHighRisk;
    if (studentFilter === 'dropout') return s.enroll_status === 'dropout';
    return true;
  });

  const statCards = [
    { label: '전체 수강생', value: `${totalStudents}명`, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-surface0' },
    { label: '금일 회고', value: `${todayReflections}명`, icon: PenLine, color: 'text-brand-mint', bg: 'bg-emerald-50' },
    { label: '미제출', value: `${notSubmitted}명`, icon: AlertCircle, color: 'text-brand-yellow', bg: 'bg-amber-50' },
    { label: '위험군', value: `${highRiskCount}명`, icon: AlertTriangle, color: 'text-brand-pink', bg: 'bg-rose-50' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 px-6 pb-24"
    >
      {/* 상단 4개 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white px-5 py-4 rounded-2xl border border-brand-surface shadow-sm hover:translate-y-[-2px] transition-all flex items-center gap-3"
          >
            <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
              <card.icon size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">{card.label}</p>
              <p className="text-xl font-black text-brand-primary">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 중단: 모니터링 토글 + 클래스 추가 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

        {/* 기관 전용 모니터링 시스템 — 2/3 너비 */}
        <div className="md:col-span-2 bg-slate-900 text-white rounded-2xl shadow-xl relative">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-brand-mint" size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight">기관 전용 모니터링 시스템</h2>
                <p className="text-sm font-black text-brand-mint">
                  {selectedClass ? selectedClass.class_name : ((user as any).organization_name || 'Yummy Academy')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsClassListOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-black text-brand-mint transition-colors"
            >
              모든 클래스 보기
              {isClassListOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* 드롭다운 오버레이 */}
          <AnimatePresence>
            {isClassListOpen && (
              <>
                {/* 바깥 클릭 시 닫기 */}
                <div className="fixed inset-0 z-10" onClick={() => setIsClassListOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden border border-white/10"
                >
                  <div className="p-3 space-y-1 max-h-60 overflow-y-auto">
                    {groups.length > 0 ? groups.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => { handleClassClick(g); setIsClassListOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${selectedClass?.id === g.id ? 'bg-brand-mint/20 ring-1 ring-brand-mint' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedClass?.id === g.id ? 'bg-brand-mint' : 'bg-white/40'}`} />
                        <span className="text-xs font-bold text-white">{g.class_name}</span>
                        {selectedClass?.id === g.id && <span className="ml-auto text-[10px] text-brand-mint font-black">선택됨</span>}
                      </div>
                    )) : (
                      <p className="text-xs font-bold text-white/30 text-center py-3">등록된 클래스가 없습니다.</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 클래스 추가 — 1/3 너비 */}
        <div className="bg-white px-5 py-4 rounded-2xl border border-brand-surface shadow-sm flex items-center gap-3">
          <div className="flex items-center gap-2 w-full">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              placeholder="클래스명 입력"
              className="flex-1 px-3 py-2 bg-brand-surface0 rounded-lg font-bold text-xs outline-none text-brand-primary placeholder:text-brand-primary/30"
            />
            <button
              onClick={handleCreateGroup}
              className="flex items-center gap-1 px-3 py-2 bg-brand-primary text-white rounded-lg font-black text-xs whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              <Plus size={13} /> 추가
            </button>
          </div>
        </div>

      </div>
      {/* 선택된 클래스 통계 */}
      <AnimatePresence>
        {selectedClass && classStats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <p className="text-[11px] font-black text-brand-primary/50 uppercase tracking-widest px-1">
              {selectedClass.class_name} 클래스
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '수강생', value: `${classStats.totalStudents}명`, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-surface0' },
                { label: '금일 회고', value: `${classStats.todayReflections}명`, icon: PenLine, color: 'text-brand-mint', bg: 'bg-emerald-50' },
                { label: '미제출', value: `${classStats.notSubmitted}명`, icon: AlertCircle, color: 'text-brand-yellow', bg: 'bg-amber-50' },
                { label: '중도이탈 위험군', value: `${classStats.highRiskCount}명`, icon: AlertTriangle, color: 'text-brand-pink', bg: 'bg-rose-50' },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white px-5 py-4 rounded-2xl border border-brand-surface shadow-sm hover:translate-y-[-2px] transition-all flex items-center gap-3"
                >
                  <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                    <card.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">{card.label}</p>
                    <p className="text-xl font-black text-brand-primary">{card.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 수강생 정밀 모니터링 + 정서 성장 타임라인 */}
      <AnimatePresence>
        {selectedClass && students.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* 좌측: 모니터링 결과 */}
            <div className="bg-white px-8 py-7 rounded-2xl border border-brand-surface shadow-sm space-y-5">
              <h3 className="text-sm font-black text-brand-primary flex items-center gap-2">
                <Activity size={16} className="text-brand-mint" /> 모니터링 결과
              </h3>
              {selectedStudent && monitoringData ? (
                <>
                  <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">{selectedStudent.username}</p>
                  {/* 막대그래프 */}
                  <div className="h-48 flex items-end justify-between gap-2 px-1">
                    {([
                      { key: 'EDU_delay_time', label: '학습 회고\n작성 지연시간', value: monitoringData.EDU_delay_time, color: 'bg-brand-sky' },
                      { key: 'EDU_char_count', label: '학습 회고\n작성 글자수', value: monitoringData.EDU_char_count, color: 'bg-brand-mint' },
                      { key: 'cumulative_days', label: '누적 회고\n작성일', value: monitoringData.cumulative_days, color: 'bg-brand-primary' },
                      { key: 'cumulative_absence_days', label: '누적 회고\n미작성일', value: monitoringData.cumulative_absence_days, color: 'bg-brand-yellow' },
                      { key: 'dropout_prob', label: '중도이탈\n확률', value: monitoringData.dropout_prob, color: 'bg-brand-pink' },
                    ] as { key: string; label: string; value: number; color: string }[]).map((item) => {
                      const maxValues: Record<string, number> = {
                        EDU_delay_time: 3600, EDU_char_count: 2000,
                        cumulative_days: 100, cumulative_absence_days: 100, dropout_prob: 1
                      };
                      const pct = Math.min((item.value / maxValues[item.key]) * 100, 100);
                      return (
                        <div key={item.key} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[9px] font-black text-brand-primary mb-1">{item.value % 1 !== 0 ? item.value.toFixed(2) : item.value}</span>
                          <div className="w-full flex flex-col justify-end" style={{ height: '140px' }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className={`w-full rounded-t-lg ${item.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                            />
                          </div>
                          <span className="text-[8px] font-bold text-brand-primary/50 text-center whitespace-pre-line leading-tight mt-1">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* 수강생 상담일지 */}
                  <div className="space-y-2 pt-2 border-t border-brand-surface">
                    <h4 className="text-xs font-black text-brand-primary">수강생 상담일지</h4>
                    <textarea
                      value={consultationNote}
                      onChange={e => setConsultationNote(e.target.value)}
                      maxLength={2000}
                      rows={5}
                      placeholder="상담 내용을 입력하세요. (최대 2000자)"
                      className="w-full px-4 py-3 bg-brand-surface0 rounded-xl text-xs font-bold text-brand-primary outline-none resize-none placeholder:text-brand-primary/30 focus:ring-2 ring-brand-primary/20"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-brand-primary/30 font-bold">{consultationNote.length} / 2000</span>
                      <button
                        onClick={handleSaveConsultation}
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        {isSaving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-brand-primary/30 font-bold text-xs">
                  오른쪽 수강생 목록에서 이름을 클릭하세요.
                </div>
              )}
            </div>

            {/* 우측: 수강생 정밀 모니터링 */}
            <div className="bg-white px-8 py-7 rounded-2xl border border-brand-surface shadow-sm space-y-4">
              <h3 className="text-sm font-black text-brand-primary">수강생 정밀 모니터링</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="studentFilter"
                    checked={studentFilter === 'all'}
                    onChange={() => setStudentFilter('all')}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-[11px] font-black text-brand-primary">전체 보기</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="studentFilter"
                    checked={studentFilter === 'highRisk'}
                    onChange={() => setStudentFilter('highRisk')}
                    className="w-4 h-4 accent-brand-pink"
                  />
                  <span className="text-[11px] font-black text-brand-pink">중도이탈 위험군 수강생 보기</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="studentFilter"
                    checked={studentFilter === 'dropout'}
                    onChange={() => setStudentFilter('dropout')}
                    className="w-4 h-4 accent-brand-yellow"
                  />
                  <span className="text-[11px] font-black text-brand-yellow">중도이탈 수강생 보기</span>
                </label>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleStudentClick(s)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${selectedStudent?.id === s.id ? 'bg-brand-primary text-white' : 'bg-brand-surface0 hover:bg-brand-surface'}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.enroll_status === 'dropout' ? 'bg-brand-yellow' : s.isHighRisk ? 'bg-brand-pink animate-pulse' : 'bg-brand-mint'}`} />
                    <span className={`text-xs font-bold flex-1 ${selectedStudent?.id === s.id ? 'text-white' : 'text-brand-primary'}`}>{s.username}</span>
                    {s.isHighRisk && s.enroll_status !== 'dropout' && (
                      <span className="text-[9px] font-black text-brand-pink bg-rose-50 px-2 py-0.5 rounded-full">위험군</span>
                    )}
                    {s.enroll_status === 'dropout' && (
                      <span className="text-[9px] font-black text-brand-yellow bg-amber-50 px-2 py-0.5 rounded-full">중도이탈</span>
                    )}
                  </div>
                )) : (
                  <p className="text-center text-brand-primary/30 font-bold text-xs py-6">해당 조건의 수강생이 없습니다.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 주간 위험도 추이 / 위험군 정밀 모니터링 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-brand-surface space-y-8 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <TrendingDown className="text-brand-yellow" /> 주간 위험도 추이
            </h3>
          </div>
          <div className="h-64 flex items-end justify-between gap-3 px-4">
            {weeklyTrend.length > 0 ? weeklyTrend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(t.avg_risk / 2) * 100}%` }}
                    className={`w-full rounded-t-xl transition-all cursor-pointer ${t.avg_risk > 1.5 ? 'bg-brand-pink' : 'bg-brand-primary/20 group-hover:bg-brand-primary'}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{t.date.split('-').slice(1).join('/')}</span>
              </div>
            )) : (
              <div className="w-full text-center text-slate-300 font-bold">충분한 데이터가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-brand-surface space-y-8 shadow-xl">
          <h3 className="text-2xl font-black text-slate-800">위험군 정밀 모니터링</h3>
          <div className="space-y-4">
            {highRiskStudents.length > 0 ? highRiskStudents.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className={`w-4 h-4 rounded-full shadow-inner ${s.status === '고위험' ? 'bg-brand-pink animate-pulse' : s.status === '주의' ? 'bg-brand-yellow' : 'bg-brand-mint'}`} />
                  <div>
                    <p className="font-black text-slate-800 flex items-center gap-2">
                      {s.name} <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400 font-bold">Risk: {parseFloat(s.risk_score).toFixed(2)}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{s.status === '고위험' ? '심리적 번아웃 의심' : '지속적 관찰 필요'}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-800 transition-colors" size={20} />
              </div>
            )) : (
              <div className="text-center py-10 text-slate-300 font-bold">현재 위험군 학생이 없습니다.</div>
            )}
          </div>
          <button className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-black transition-colors">
            전체 수강생 분석 리포트 다운로드 (.PDF)
          </button>
        </div>
      </div>

    </motion.div>
  );
}
