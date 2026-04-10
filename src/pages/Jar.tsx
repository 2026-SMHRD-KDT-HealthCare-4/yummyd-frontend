import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Star, Sparkles, Quote, History, BrainCircuit, Package, Gamepad2, BookOpen, Heart, ChevronRight, RefreshCw, Pencil, Check, X, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function Jar() {
  const { user, emotions = [], collection = [], fetchHistory, fetchMe, fetchCollection, drawItem, toggleEquip } = useStore();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'edu' | 'emo'>('edu');

  // 드로우 애니메이션 상태
  const [phase, setPhase] = useState<'idle' | 'egg' | 'shake' | 'flash' | 'crack' | 'reveal'>('idle');
  const [result, setResult] = useState<any>(null);
  const [drawGrade, setDrawGrade] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastDrawnItem, setLastDrawnItem] = useState<any>(null);
  const [currentAvatar, setCurrentAvatar] = useState<any>(null);
  const [flashLayers, setFlashLayers] = useState<string[]>([]);

  // 리마인드 상태 (오늘 날짜 기준 랜덤 EDU_confused)
  const [remindItem, setRemindItem] = useState<string | null>(null);

  // 수정 팝업 상태
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editText, setEditText] = useState('');

  // 히스토리 달력 필터
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [historyPage, setHistoryPage] = useState(1);

  // 탭 섹션 ref
  const eduRef = useRef<HTMLDivElement>(null);
  const emoRef = useRef<HTMLDivElement>(null);

  type Grade = 'common' | 'rare' | 'unique' | 'epic';
  const gradeSequence: Record<Grade, string[]> = {
    common: ['common'],
    rare: ['common', 'rare'],
    unique: ['common', 'rare', 'unique'],
    epic: ['common', 'rare', 'unique', 'epic']
  };

  const gradeColor = {
    common: "#ffffff",
    rare: "#60a5fa",
    unique: "#a78bfa",
    epic: "#fd4d08"
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchMe();
      fetchCollection();
    }
  }, [user?.id]);

  useEffect(() => {
    const equipped = collection.find(i => i.is_equipped);
    if (equipped) setCurrentAvatar(equipped.Collection);
  }, [collection]);

  // 오늘 날짜 기준 리마인드 항목 선택 (매일 초기화)
  useEffect(() => {
    const confusedItems = emotions
      .map((e: any) => e.EDU_confused)
      .filter(Boolean);
    if (confusedItems.length === 0) return;
    const todayIdx = new Date().getDate() % confusedItems.length;
    setRemindItem(confusedItems[todayIdx]);
  }, [emotions]);

  const handleDraw = async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    const res = await drawItem();
    if (!res.success) {
      alert(res.message);
      setIsDrawing(false);
      return;
    }
    const sequence = gradeSequence[res.item.grade as Grade];
    const eggTime = 0;
    const shakeTime = 600;
    const crackTime = 1100;
    const flashStart = 1500;
    const revealTime = 1900 + sequence.length * 1100;
    const endTime = 4500 + sequence.length * 1100;

    setTimeout(() => setPhase("egg"), eggTime);
    setTimeout(() => setPhase("shake"), shakeTime);
    setTimeout(() => setPhase("crack"), crackTime);
    sequence.forEach((g, index) => {
      setTimeout(() => {
        setDrawGrade(g as Grade);
        setFlashLayers((prev) => [...prev, gradeColor[g as Grade]]);
        setPhase("flash");
      }, flashStart + index * 1100);
    });
    setTimeout(async () => {
      setResult(res.item);
      setDrawGrade(res.item.grade);
      setLastDrawnItem(res.item);
      setPhase("reveal");
      await fetchCollection();
      setTimeout(() => setLastDrawnItem(null), 3000);
    }, revealTime);
    setTimeout(() => {
      setPhase("idle");
      setResult(null);
      setIsDrawing(false);
      setFlashLayers([]);
    }, endTime);
  };

  const handleTabClick = (tab: 'edu' | 'emo') => {
    setActiveTab(tab);
    const ref = tab === 'edu' ? eduRef : emoRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    try {
      await axios.put(`/api/update/${editingItem.id}`, { text: editText });
      await fetchHistory();
      setEditingItem(null);
    } catch {
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const equippedItems = useMemo(() => collection.filter(i => i.is_equipped), [collection]);
  const currentColor = drawGrade ? gradeColor[drawGrade as keyof typeof gradeColor] : "#ffffff";

  // 전체 감정 키 목록 (Sequelize camelCase JS 속성명 기준)
  const ALL_EMOTION_KEYS = [
    { key: 'happyProb',       label: '행복',     color: '#7FDBCA' },
    { key: 'fulfillProb',     label: '성취',     color: '#4FD1A5' },
    { key: 'reliefProb',      label: '안도',     color: '#86EFAC' },
    { key: 'gratitudeProb',   label: '감사',     color: '#FCD34D' },
    { key: 'proudProb',       label: '자부심',   color: '#FB923C' },
    { key: 'sadProb',         label: '슬픔',     color: '#60A5FA' },
    { key: 'anxiousProb',     label: '불안',     color: '#A78BFA' },
    { key: 'defeatProb',      label: '좌절',     color: '#F87171' },
    { key: 'stressProb',      label: '스트레스', color: '#FF6B9D' },
    { key: 'embarrassedProb', label: '당황',     color: '#F9A8D4' },
    { key: 'boredProb',       label: '지루함',   color: '#94A3B8' },
    { key: 'exhaustedProb',   label: '지침',     color: '#FF9F43' },
    { key: 'depressedProb',   label: '우울',     color: '#818CF8' },
  ];

  // 평균 분포 기준 상위 5개 감정 선택
  const top5EmotionKeys = useMemo(() => {
    const sums: Record<string, number> = {};
    let count = 0;
    emotions.forEach((item: any) => {
      const a = item.Analysis;
      if (!a) return;
      count++;
      ALL_EMOTION_KEYS.forEach(({ key, label }) => {
        sums[label] = (sums[label] || 0) + (a[key] || 0);
      });
    });
    if (count === 0) return ALL_EMOTION_KEYS.slice(0, 5);
    return [...ALL_EMOTION_KEYS]
      .sort((a, b) => (sums[b.label] || 0) - (sums[a.label] || 0))
      .slice(0, 5);
  }, [emotions]);

  // 감정 차트 데이터: 최근 5개 회고 × 상위 5개 감정
  const chartData = useMemo(() => {
    const recent5 = [...emotions].slice(0, 5).reverse();
    return recent5.map((item: any) => {
      const analysis = item.Analysis;
      const day = new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      const entry: any = { day };
      top5EmotionKeys.forEach(({ key, label }) => {
        entry[label] = analysis ? Math.round((analysis[key] || 0) * 100) : 0;
      });
      return entry;
    });
  }, [emotions, top5EmotionKeys]);

  // 감정 인사이트 계산
  const emotionInsight = useMemo(() => {
    const sums: Record<string, number> = {};
    let count = 0;
    emotions.forEach((item: any) => {
      const a = item.Analysis;
      if (!a) return;
      count++;
      ALL_EMOTION_KEYS.forEach(({ key, label }) => {
        sums[label] = (sums[label] || 0) + (a[key] || 0);
      });
    });
    if (count === 0) return null;
    const avgs = Object.entries(sums).map(([label, sum]) => ({ label, avg: sum / count }));
    avgs.sort((a, b) => b.avg - a.avg);
    const top = avgs[0];
    const positive = ((sums['행복'] || 0) + (sums['성취'] || 0) + (sums['안도'] || 0) + (sums['감사'] || 0) + (sums['자부심'] || 0)) / count;
    const negative = ((sums['슬픔'] || 0) + (sums['불안'] || 0) + (sums['우울'] || 0) + (sums['좌절'] || 0)) / count;
    return { top, positive, negative, avgs };
  }, [emotions]);

  // 최신 GPT 요약
  const latestSummary = useMemo(() => {
    for (const item of emotions) {
      const summary = (item as any).Analysis?.gptEduSummary;
      if (summary) return summary;
    }
    return null;
  }, [emotions]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-[1400px] mx-auto px-6 py-10 font-brand-kor">
      <div className="flex gap-8 items-start justify-center">

        {/* ── 좌측 사이드바 (sticky) ── */}
        <aside className="w-[370px] shrink-0 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto space-y-6 pb-6">

          {/* Candy Status */}
          <div className="bg-brand-surface/20 rounded-3xl p-7 border border-white/50 shadow-sm">
            <h3 className="text-xs font-black text-brand-primary/50 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Star size={14} className="text-brand-yellow fill-brand-yellow" /> Candy Status
            </h3>
            <div className="p-5 bg-white/60 rounded-2xl border border-white/40 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-mint/20 rounded-xl flex items-center justify-center shrink-0">
                <Gamepad2 size={22} className="text-brand-mint" />
              </div>
              <div>
                <p className="text-[11px] font-black text-brand-primary/50 uppercase tracking-widest">현재 캔디</p>
                <p className="text-3xl font-black text-brand-primary">{user?.current_candy_count || 0}개</p>
                <p className="text-[11px] text-brand-primary/40 mt-0.5">하루 최대 2개 적립</p>
              </div>
            </div>
          </div>

          {/* My Avatar */}
          <div className="bg-white rounded-3xl border-2 border-brand-surface p-6 shadow-md flex flex-col items-center relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 self-start">
              <Package size={14} className="text-brand-primary" />
              <span className="text-xs font-black text-brand-primary uppercase">My Avatar</span>
            </div>
            <div className="w-40 h-40 flex items-center justify-center mb-4">
              {currentAvatar?.video_url ? (
                <video src={currentAvatar.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={currentAvatar?.image_url || "/src/assets/yummyd_character_pure.png"} alt="Avatar" className="w-full h-full object-contain drop-shadow-lg" />
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleDraw} disabled={isDrawing}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow transition-all ${
                isDrawing ? 'bg-brand-surface text-brand-primary/30' : 'bg-brand-primary text-white hover:bg-brand-primary/90'
              }`}
            >
              <Sparkles className={isDrawing ? "animate-spin" : "text-brand-yellow"} size={16} />
              {isDrawing ? "뽑는 중..." : "캔디 2개로 랜덤 뽑기"}
            </motion.button>
            <AnimatePresence>
              {lastDrawnItem && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute inset-x-4 bottom-16 bg-white border-2 border-brand-yellow p-3 rounded-2xl shadow-xl z-20 text-center">
                  <p className="text-[10px] font-black text-brand-yellow uppercase">새로운 아바타!</p>
                  <p className="text-base font-black text-brand-primary">{lastDrawnItem.name}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* My Collection */}
          <div className="bg-brand-surface/5 rounded-3xl p-5 border border-brand-surface/20">
            <h4 className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.15em] px-1 mb-3">
              My Collection ({collection.length})
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {collection.map((item) => {
                const avatar = item.Collection;
                return (
                  <motion.button key={item.id} whileHover={{ scale: 1.08 }}
                    onClick={async () => { await toggleEquip(item.collection_id); setCurrentAvatar(item.Collection); }}
                    className={`aspect-square rounded-xl border-2 overflow-hidden flex items-center justify-center transition-all relative ${
                      item.is_equipped ? 'border-brand-primary bg-brand-primary/10 shadow' : 'border-white bg-white/40 hover:bg-white'
                    }`}
                  >
                    {avatar?.video_url ? (
                      <video src={avatar.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : avatar?.image_url ? (
                      <img src={avatar.image_url} alt={avatar.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Sparkles size={14} className="text-brand-primary/30" />
                    )}
                    {item.is_equipped && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
                    )}
                  </motion.button>
                );
              })}
              {collection.length === 0 && (
                <div className="col-span-4 py-8 text-center text-brand-primary/30 text-xs font-bold">
                  아직 수집한 아이템이 없어요.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── 우측 메인 영역 ── */}
        <main className="w-[700px] shrink-0 space-y-6">

          {/* 상단 탭 버튼 - 화면 상단 고정 */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex gap-3 bg-brand-bg/90 backdrop-blur-md py-3 px-4 rounded-full shadow-xl border border-brand-surface">
            <button
              onClick={() => handleTabClick('edu')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                activeTab === 'edu' ? 'bg-brand-primary text-white shadow-lg' : 'bg-white text-brand-primary/60 hover:text-brand-primary border border-brand-surface'
              }`}
            >
              <BookOpen size={16} /> 학습 내용 보기
            </button>
            <button
              onClick={() => handleTabClick('emo')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                activeTab === 'emo' ? 'bg-brand-primary text-white shadow-lg' : 'bg-white text-brand-primary/60 hover:text-brand-primary border border-brand-surface'
              }`}
            >
              <Heart size={16} /> 감정 내용 보기
            </button>
          </div>

          {/* ── 학습 내용 섹션 ── */}
          <div ref={eduRef} className="space-y-6">
            <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={14} /> 학습 내용
            </h2>

            {/* Daily Briefing */}
            <div className="bg-white border-2 border-brand-surface rounded-3xl p-8 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <BrainCircuit size={16} className="text-brand-primary" />
                </div>
                <h3 className="text-base font-black text-brand-primary">Daily Briefing</h3>
                <span className="text-[10px] text-brand-primary/30 font-bold ml-1">AI 학습 요약</span>
              </div>
              {latestSummary ? (
                <div className="flex items-start gap-4">
                  <Quote size={20} className="text-brand-primary/20 fill-brand-primary/10 shrink-0 mt-1" />
                  <p className="text-sm font-medium text-brand-primary/80 leading-relaxed">{latestSummary}</p>
                </div>
              ) : (
                <p className="text-sm text-brand-primary/30 font-medium">아직 AI 분석 결과가 없어요. 회고를 작성하면 요약이 여기 표시됩니다.</p>
              )}
            </div>

            {/* 오늘의 리마인드 */}
            <div className="bg-brand-surface/30 border border-brand-surface rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-yellow/20 rounded-xl flex items-center justify-center">
                    <RefreshCw size={14} className="text-brand-orange" />
                  </div>
                  <h3 className="text-base font-black text-brand-primary">오늘의 리마인드</h3>
                  <span className="text-[10px] text-brand-primary/30 font-bold ml-1">매일 새로운 항목</span>
                </div>
              </div>
              {remindItem ? (
                <div className="bg-white rounded-2xl p-5 border border-brand-surface shadow-sm">
                  <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest mb-2">헷갈렸던 내용</p>
                  <p className="text-sm font-medium text-brand-primary leading-relaxed">💡 {remindItem}</p>
                </div>
              ) : (
                <p className="text-sm text-brand-primary/30 font-medium">회고에 헷갈리는 내용을 작성하면 매일 하나씩 리마인드해 드려요.</p>
              )}
            </div>

            {/* 기록 히스토리 */}
            <div className="bg-white border-2 border-brand-surface rounded-3xl p-8 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-mint/20 rounded-xl flex items-center justify-center">
                    <History size={16} className="text-brand-mint" />
                  </div>
                  <h3 className="text-base font-black text-brand-primary">기록 히스토리</h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDate && (
                    <button onClick={() => setSelectedDate('')}
                      className="text-[10px] font-black text-brand-primary/40 hover:text-brand-primary px-2 py-1 rounded-lg hover:bg-brand-surface transition-all">
                      초기화
                    </button>
                  )}
                  <div className="relative">
                    <button onClick={() => setCalendarOpen(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-black transition-all ${
                        selectedDate ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-surface/40 text-brand-primary/60 border-brand-surface hover:border-brand-primary/30'
                      }`}>
                      <Calendar size={13} />
                      {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '날짜 조회'}
                    </button>
                    {calendarOpen && (
                      <div className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-2xl border border-brand-surface p-3">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={e => { setSelectedDate(e.target.value); setCalendarOpen(false); setHistoryPage(1); }}
                          className="text-sm font-medium text-brand-primary outline-none px-2 py-1 rounded-lg border border-brand-surface focus:ring-2 focus:ring-brand-mint/30"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 달력 외부 클릭 시 닫기 */}
              {calendarOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
              )}

              {(() => {
                const PER_PAGE = 5;
                const filtered = selectedDate
                  ? emotions.filter((item: any) => new Date(item.createdAt).toLocaleDateString('sv-SE') === selectedDate)
                  : emotions;
                const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
                const safePage = Math.min(historyPage, totalPages);
                const displayed = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

                if (filtered.length === 0) return (
                  <p className="text-sm text-brand-primary/30 font-medium text-center py-6">
                    {selectedDate ? '해당 날짜에 작성한 회고가 없어요.' : '아직 작성한 회고가 없어요.'}
                  </p>
                );
                return (
                  <>
                    <div className="space-y-3">
                      {displayed.map((item: any, idx: number) => (
                        <motion.div key={item.id || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="bg-brand-surface/20 rounded-2xl p-4 border border-transparent hover:border-brand-surface transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-brand-primary/40 uppercase mb-1">
                                {new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                              <p className="text-sm font-medium text-brand-primary truncate">
                                {item.EDU_reflectionText || item.EMO_reflectionText || '내용 없음'}
                              </p>
                              {item.EDU_goal && (
                                <p className="text-[10px] text-brand-primary/40 mt-1 truncate">❕ {item.EDU_goal}</p>
                              )}
                            </div>
                            <button
                              onClick={() => { setEditingItem(item); setEditText(item.EDU_reflectionText || item.EMO_reflectionText || ''); }}
                              className="p-1.5 text-brand-primary/20 hover:text-brand-primary rounded-lg transition-colors shrink-0">
                              <Pencil size={13} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* 페이지 탭 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 pt-4">
                        <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black text-brand-primary/40 hover:text-brand-primary disabled:opacity-20 border border-brand-surface hover:border-brand-primary/20 transition-all">
                          ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button key={p} onClick={() => setHistoryPage(p)}
                            className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all ${
                              safePage === p
                                ? 'bg-brand-primary text-white shadow'
                                : 'text-brand-primary/40 hover:text-brand-primary border border-brand-surface hover:border-brand-primary/20'
                            }`}>
                            {p}
                          </button>
                        ))}
                        <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black text-brand-primary/40 hover:text-brand-primary disabled:opacity-20 border border-brand-surface hover:border-brand-primary/20 transition-all">
                          ›
                        </button>
                        <span className="text-[10px] text-brand-primary/30 font-bold ml-1">{safePage} / {totalPages}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* ── 감정 내용 섹션 ── */}
          <div ref={emoRef} className="space-y-6 pt-4">
            <h2 className="text-xs font-black text-brand-primary/40 uppercase tracking-widest flex items-center gap-2">
              <Heart size={14} /> 감정 내용
            </h2>

            {/* 감정 스택바 차트 */}
            <div className="bg-white border-2 border-brand-surface rounded-3xl p-8 shadow-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand-pink/20 rounded-xl flex items-center justify-center">
                  <ChevronRight size={16} className="text-brand-pink" />
                </div>
                <h3 className="text-base font-black text-brand-primary">감정 분포 차트</h3>
                <span className="text-[10px] text-brand-primary/30 font-bold ml-1">최근 5회 회고 기준</span>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700, fill: '#2D5A3D99' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#2D5A3D66' }} unit="%" />
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E5E7EB' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    {top5EmotionKeys.map(({ label, color }, idx) => (
                      <Bar
                        key={label}
                        dataKey={label}
                        stackId="a"
                        fill={color}
                        radius={idx === top5EmotionKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-brand-primary/30 text-sm font-medium">
                  회고를 작성하면 감정 분포 차트가 여기에 표시됩니다.
                </div>
              )}
            </div>

            {/* 감정 인사이트 */}
            <div className="bg-brand-primary text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                    <Sparkles size={16} className="text-brand-yellow" />
                  </div>
                  <h3 className="text-base font-black">나의 감정 인사이트</h3>
                  <span className="text-[10px] text-white/40 font-bold ml-1">누적 데이터 기반</span>
                </div>
                {emotionInsight ? (
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">가장 많이 느낀 감정</p>
                      <p className="text-2xl font-black text-brand-yellow">{emotionInsight.top.label}</p>
                      <p className="text-xs text-white/60 mt-0.5">평균 {Math.round(emotionInsight.top.avg * 100)}% 확률로 감지됨</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">긍정 지수</p>
                        <p className="text-xl font-black text-brand-mint">{Math.round(emotionInsight.positive * 100)}%</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">부정 지수</p>
                        <p className="text-xl font-black text-brand-pink">{Math.round(emotionInsight.negative * 100)}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {emotionInsight.positive > emotionInsight.negative
                        ? `전반적으로 긍정적인 감정 상태를 유지하고 있어요. ${emotionInsight.top.label} 감정이 가장 두드러지게 나타나고 있습니다.`
                        : `최근 부정적인 감정이 다소 높게 나타나고 있어요. 야미가 당신의 마음을 응원하고 있어요.`
                      }
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 font-medium">회고를 작성하면 감정 인사이트가 여기에 표시됩니다.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── 수정 팝업 모달 ── */}
      <AnimatePresence>
        {editingItem && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditingItem(null)}>
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-[560px] max-w-[90vw] p-8 flex flex-col gap-5"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil size={16} className="text-brand-primary" />
                  <h3 className="text-base font-black text-brand-primary">회고 수정</h3>
                </div>
                <p className="text-[11px] text-brand-primary/40 font-medium">
                  {new Date(editingItem.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={10}
                className="w-full bg-brand-surface/30 rounded-2xl px-5 py-4 text-sm font-medium text-brand-primary outline-none focus:ring-4 focus:ring-brand-mint/20 resize-none leading-relaxed border border-brand-surface"
                placeholder="내용을 입력하세요."
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingItem(null)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-black text-brand-primary/50 bg-brand-surface hover:bg-brand-surface/80 transition-all">
                  <X size={14} /> 취소
                </button>
                <button onClick={handleEditSave}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-black text-white bg-brand-primary hover:bg-brand-primary/90 shadow transition-all">
                  <Check size={14} /> 저장
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 드로우 오버레이 애니메이션 ── */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence>
                {phase === 'flash' && (
                  <motion.div key={drawGrade}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 0.8], scale: [0.8, 1.5, 1.2] }}
                    exit={{ opacity: 0, scale: 2, transition: { duration: 0.8 } }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute flex items-center justify-center"
                  >
                    <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-60" style={{ background: currentColor }} />
                    <motion.div className="absolute w-[400px] h-[400px] rounded-full blur-[60px]"
                      style={{ background: `radial-gradient(circle, #ffffff 0%, ${currentColor} 70%)` }}
                      initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5, ease: "backOut" }} />
                    <motion.div className="absolute rounded-full border-[10px]" style={{ borderColor: currentColor }}
                      initial={{ width: 100, height: 100, opacity: 1, borderWidth: "10px" }}
                      animate={{ width: 1000, height: 1000, opacity: 0, borderWidth: "1px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {phase !== 'reveal' && (
              <motion.div
                animate={
                  phase === 'shake' ? { rotate: [0, -10, 10, -8, 8, 0] } :
                  phase === 'flash' ? { opacity: 0.35, scale: 0.95 } :
                  phase === 'crack' ? { scale: [1, 1.05, 0.95, 0], opacity: [1, 1, 0] } : {}
                }
                transition={{ duration: 0.6 }} className="relative"
              >
                <div className="w-40 h-52 bg-white rounded-full shadow-2xl border-4 border-white" />
                {phase !== 'egg' && phase !== 'shake' && (
                  <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 120"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.25 }}>
                    <motion.path d="M10 60 L25 55 L40 65 L55 55 L70 65 L85 60"
                      stroke="gray" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </motion.svg>
                )}
              </motion.div>
            )}

            {phase === 'reveal' && result && (
              <>
                <motion.div className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
                  style={{ background: currentColor }}
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.4 }} transition={{ duration: 0.8 }} />
                <motion.div
                  initial={{ scale: 0.2, opacity: 0, rotate: -15, y: 50 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="relative z-50 flex flex-col items-center"
                >
                  <div className="bg-white/90 backdrop-blur-md p-5 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white w-80 overflow-hidden">
                    <div className="relative w-full aspect-square bg-gray-50 rounded-[2rem] overflow-hidden mb-6 shadow-inner flex items-center justify-center">
                      {result.video_url ? (
                        <video src={result.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : result.image_url ? (
                        <img src={result.image_url} alt={result.name} className="w-full h-full object-contain p-4" />
                      ) : (
                        <Sparkles size={60} className="text-brand-primary/20" />
                      )}
                    </div>
                    <div className="text-center pb-2">
                      <p className="text-[11px] font-black text-brand-primary/30 uppercase tracking-[0.2em] mb-1">New Item Unlocked</p>
                      <h2 className="text-2xl font-black text-brand-primary leading-tight mb-1">{result.name}</h2>
                      <p className="text-[12px] font-bold opacity-50" style={{ color: currentColor }}>
                        {result.grade === 'epic' ? '✨ Legendary Discovery ✨' : 'Collection Updated'}
                      </p>
                    </div>
                  </div>
                  <div className="w-40 h-6 bg-black/20 blur-xl rounded-full mt-8" />
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
