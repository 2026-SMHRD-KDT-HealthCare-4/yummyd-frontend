import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Trophy, Star, ArrowUpRight, Sparkles, Quote, History, BrainCircuit, Activity, Package, Gamepad2 } from 'lucide-react';

/* 아바타 개발을 위한 임시 작업 DB 작업후 수정 필요 */
import { MOCK_ITEMS } from '../data/Avatar';
import { fakeDraw } from '../utils/fakeDraw';

export default function Jar() {
  const { user, emotions = [], collection = [], fetchHistory, fetchMe, fetchCollection, drawItem, toggleEquip } = useStore();
  const [phase, setPhase] = useState<
   'idle' | 'egg' | 'shake' | 'flash' | 'crack' | 'reveal'
   >('idle');

   const [result, setResult] = useState<any>(null);
   const [drawGrade, setDrawGrade] = useState<string | null>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [lastDrawnItem, setLastDrawnItem] = useState<any>(null);
   const gradeSequence = {
   common: ['common'],
   rare: ['common','rare'],
   unique: ['common','rare','unique'],
   epic: ['common','rare','unique','epic']
   };
  const [flashStep, setFlashStep] = useState(0);
  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchMe();
      fetchCollection();
    }
  }, [user?.id]);

  const handleDraw = async () => {
   if (isDrawing) return;
   setIsDrawing(true);

   //  if ((user?.current_candy_count || 0) < 2) {
   //     alert("캔디가 부족해요! 리플렉션을 작성해서 캔디를 모아보세요. 🍬");
   //     setIsDrawing(false);
   //     return;
   //  }

    // DB호출 함수 임시로 주석 처리
   //  const res = await drawItem();
   //  if (res.success) {
   //     setLastDrawnItem(res.item);
   //     setTimeout(() => setLastDrawnItem(null), 3000);
   //  } else {
   //     alert(res.message);
   //  }

   // 임시 fakeDraw 사용
   const res = fakeDraw(collection);

   if (!res.success) {
      alert(res.message);
      setIsDrawing(false);
      return;
   }

   // 결과 저장
   setResult(res.item);
   setDrawGrade(res.item.grade);

   // 알 등장
   setPhase('egg');

   // 흔들림
   setTimeout(() => {
      setPhase('shake');
   }, 600);

   // 깨짐
   setTimeout(()=> {
      setPhase('crack');
   }, 1100);

   // 등급별 번쩍임
   const sequence = gradeSequence[res.item.grade];
   const flashDuration = sequence.length * 750;

   sequence.forEach((grade, index) => {
   setTimeout(() => {
      setDrawGrade(grade);
      setPhase('flash');
   }, 1500 + index * 750);
   });

   // 결과 등장
   setTimeout(() => {
      setPhase('reveal');
   }, 1900+ flashDuration);

   // 종료
   setTimeout(() => {
      setPhase('idle');
      setResult(null);
      setIsDrawing(false);
   }, 4500 + flashDuration);
  };

  const equippedItems = useMemo(() => collection.filter(i => i.is_equipped), [collection]);
// 알 꺠는 색상 표시
  const gradeColor = {
   common: "#ffffff",
   rare: "#60a5fa",
   unique: "#a78bfa",
   epic: "#fd4d08"
   };
  const currentColor = drawGrade ? gradeColor[drawGrade] : "#ffffff";

  const graphData = useMemo(() => {
    return [...emotions].reverse().slice(-7).map((item) => ({
      day: new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      value: (item.happy_prob * 100) || 50,
      dominant: item.rep_emotion || 'stable'
    }));
  }, [emotions]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 🏺 [좌측] 캔디 대시보드 & 아바타 갤러리 */}
        <aside className="lg:col-span-4 space-y-8">
          {/* 1. 캔디 스탯 (좌상단 요청사항) */}
          <div className="bg-brand-surface/10 rounded-[2.5rem] p-8 space-y-6 border-2 border-white/50 shadow-inner">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                   <Star size={16} className="text-brand-yellow fill-brand-yellow" /> Candy Status
                </h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Gamepad2 size={20} />, label: "현재 캔디", val: `${user?.current_candy_count || 0}개`, color: "text-brand-mint", bg: "bg-brand-mint/20" },
                  { icon: <Trophy size={20} />, label: "누적 캔디", val: `${user?.total_candy_count || 0}개`, color: "text-brand-orange", bg: "bg-brand-yellow/20" }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white/60 rounded-3xl border border-white/40 shadow-sm transition-transform hover:scale-[1.05]">
                     <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center ${item.color} mb-3`}>{item.icon}</div>
                     <p className="text-[10px] font-black text-brand-primary/50 uppercase tracking-widest">{item.label}</p>
                     <p className="text-xl font-black text-brand-primary">{item.val}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* 2. 아바타 꾸미기 공간 (기존 Jar Status 대체) */}
          <div className="bg-white rounded-[3.5rem] border-4 border-brand-surface p-8 shadow-2xl flex flex-col items-center relative overflow-hidden group">
             <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-1.5 bg-brand-primary/5 rounded-full">
                <Package size={14} className="text-brand-primary" />
                <span className="text-[10px] font-black text-brand-primary uppercase">My Avatar</span>
             </div>

             {/* 아바타 디스플레이 영역 */}
             <div className="relative w-full h-[320px] flex items-center justify-center mt-6">
                <div className="relative w-48 h-48">
                   <img src="/src/assets/yummyd_character_pure.png" alt="Avatar" className="w-full h-full object-contain drop-shadow-2xl" />
                   {equippedItems.map((item) => (
                      <div key={item.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="bg-brand-primary/20 px-2 py-1 rounded text-[8px] font-bold text-brand-primary border border-brand-primary/10">
                            {item.item_id} 착용 중
                         </div>
                      </div>
                   ))}
                </div>
                {collection.some(i => i.item_type === 'background' && i.is_equipped) && (
                   <div className="absolute inset-0 bg-gradient-to-b from-brand-mint/10 to-transparent -z-10 rounded-3xl" />
                )}
             </div>

             <div className="w-full space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={handleDraw}
                  disabled={isDrawing}
                  className={`w-full py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all ${
                    isDrawing ? 'bg-brand-surface text-brand-primary/30' : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                  }`}
                >
                  <Sparkles className={isDrawing ? "animate-spin" : "text-brand-yellow"} size={18} />
                  {isDrawing ? "뽑는 중..." : "캔디 2개로 랜덤 뽑기"}
                </motion.button>
             </div>

             <AnimatePresence>
                {lastDrawnItem && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.5, y: 20 }} 
                     animate={{ opacity: 1, scale: 1, y: 0 }} 
                     exit={{ opacity: 0, scale: 0.5 }} 
                     className="absolute inset-x-8 bottom-32 bg-white border-2 border-brand-yellow p-4 rounded-2xl shadow-2xl z-20 flex flex-col items-center gap-2"
                   >
                      <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">New Item!</p>
                      <p className="text-lg font-black text-brand-primary">{lastDrawnItem.name}</p>
                   </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="bg-brand-surface/5 rounded-[2.5rem] p-6 max-h-[300px] overflow-y-auto space-y-4 border border-brand-surface/20">
             <h4 className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em] px-2 mb-4">My Collection ({collection.length})</h4>
             <div className="grid grid-cols-4 gap-3">
                {collection.map((item) => (
                   <motion.button
                     key={item.id}
                     whileHover={{ scale: 1.1 }}
                     onClick={() => toggleEquip(item.item_id)}
                     className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-all ${
                       item.is_equipped ? 'border-brand-primary bg-brand-primary/10 shadow-lg' : 'border-white bg-white/40 hover:bg-white'
                     }`}
                   >
                      <span className="text-[10px] font-bold text-brand-primary">{item.item_id}</span>
                   </motion.button>
                ))}
                {collection.length === 0 && (
                   <div className="col-span-4 py-8 text-center text-brand-primary/30 text-[10px] font-bold">
                      아직 수집한 아이템이 없어요.
                   </div>
                )}
             </div>
          </div>
        </aside>

        {/* 📊 [우측] 메인 인사이트 영역 */}
        <main className="lg:col-span-8 space-y-10">
          <section className="relative">
            <div className="absolute -top-6 left-8 bg-brand-primary text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl z-10 flex items-center gap-2">
               <BrainCircuit size={14} className="text-brand-yellow" /> AI Emotion Analysis Insight
            </div>
            <div className="bg-white border-4 border-brand-primary/5 rounded-[4rem] p-12 pt-16 shadow-2xl relative overflow-hidden group min-h-[280px] flex items-center">
               <div className="relative z-10 w-full">
                  <div className="flex items-start gap-6 mb-6">
                     <div className="w-16 h-16 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center shrink-0">
                        <Quote size={32} className="text-brand-primary fill-brand-primary/20" />
                     </div>
                     <p className="text-3xl font-black text-brand-primary leading-tight tracking-tight">
                        "{emotions[0]?.gpt_summary || "아직 첫 기록이 없네요. 오늘의 마음을 들려주시면 야미가 멋진 요약을 해드릴게요!"}"
                     </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="h-[1px] w-12 bg-brand-primary/60" />
                     <span className="text-xs font-black text-brand-primary/60 uppercase tracking-widest">Powered by Yummy AI Engine</span>
                  </div>
               </div>
               <Sparkles size={300} className="absolute -bottom-32 -right-20 text-brand-primary opacity-[0.03] group-hover:rotate-12 transition-all duration-1000" />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white border-2 border-brand-surface p-10 rounded-[4rem] shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-brand-primary flex items-center gap-3">
                      <Activity size={20} className="text-brand-mint" /> 정서 성장 타임라인
                   </h3>
                </div>
                <div className="relative h-48 w-full flex items-end justify-between px-4">
                   {graphData.map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="w-full relative flex flex-col items-center">
                           <motion.div initial={{ height: 0 }} animate={{ height: `${d.value}%` }} className={`w-12 rounded-2xl ${d.value > 70 ? 'bg-brand-mint' : d.value > 40 ? 'bg-brand-yellow' : 'bg-brand-pink'} shadow-lg group-hover:brightness-110 transition-all`} />
                        </div>
                        <span className="text-[9px] font-black text-brand-primary/60 uppercase">{d.day}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-brand-primary text-white p-10 rounded-[4rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                   <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Most Dominant</p>
                   <h4 className="text-4xl font-black">Today's Feeling</h4>
                </div>
                <div className="relative z-10">
                   <div className="text-5xl font-black text-brand-yellow mb-2 capitalize">{graphData[graphData.length-1]?.dominant || "Ready"}</div>
                   <p className="text-xs font-bold opacity-60">데이터 기반으로 분석된 기분입니다.</p>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
             </div>
          </section>

          <section className="bg-white border-2 border-brand-surface rounded-[4rem] shadow-xl p-12">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-brand-primary flex items-center gap-4"><History size={28} className="text-brand-primary/80" /> 상세 기록 로그</h3>
             </div>
             <div className="space-y-4">
                {emotions.slice(0, 3).map((item, idx) => (
                  <motion.div key={idx} whileHover={{ x: 10 }} className="flex items-center gap-8 p-6 bg-brand-surface/10 rounded-[2.5rem] border border-transparent hover:border-brand-primary/5 transition-all group">
                     <div className={`w-3 h-10 rounded-full ${item.rep_emotion === 'happy' ? 'bg-brand-mint' : 'bg-brand-pink'} shrink-0`} />
                     <div className="flex-1">
                        <span className="text-[10px] font-black text-brand-primary/40 uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                        <p className="text-base font-bold text-brand-primary truncate">{item.origin_text}</p>
                     </div>
                     <ArrowUpRight size={20} className="text-brand-primary/10 group-hover:text-brand-primary" />
                  </motion.div>
                ))}
             </div>
          </section>
        </main>
      </div>
      <AnimatePresence>
      {phase !== 'idle' && (
      <motion.div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
      >
         
         {/* 번쩍 빛 */}
         {phase === 'flash' && (
         <motion.div
            key={currentColor}
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{ background: currentColor }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
               scale: [0.5, 2.2, 2.8],
               opacity: [0, 1, 0]
            }}
            transition={{
               duration: 0.35,
               ease: "easeOut"
            }}
         />
         )}

         {/* 알 */}
         {phase !== 'reveal' && (
         <motion.div
            animate={
               phase === 'shake'
               ? { rotate: [0, -10, 10, -8, 8, 0] }

               : phase === 'flash'
               ? {
                  opacity: 0.35,
                  scale: 0.95
               }
               
               : phase === 'crack'
               ? {
                     scale:[1,1.05,0.95,0],
                     opacity:[1,1,0]
                  }
               : {}
            }
            transition={{ duration: 0.6 }}
            className="relative"
         >

            {/* 알 */}
            <div className="w-40 h-52 bg-white rounded-full shadow-2xl border-4 border-white" />

            {/* 지그재그 금 */}
            {phase !== 'egg' && phase !== 'shake' && (
            <motion.svg
               className="absolute inset-0 w-full h-full"
               viewBox="0 0 100 120"
               initial={{ pathLength: 0, opacity: 0 }}
               animate={{ pathLength: 1, opacity: 1 }}
               transition={{ duration: 0.25 }}
            >
               <motion.path
                  d="M10 60 
                     L25 55 
                     L40 65 
                     L55 55 
                     L70 65 
                     L85 60"
                  stroke="gray"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
               />
            </motion.svg>
            )}

         </motion.div>
         )}

         {/* 결과 카드 */}
         {phase === 'reveal' && result && (
         <>
            {/* glow */}
            <motion.div
               className="absolute w-72 h-72 rounded-full blur-3xl"
               style={{ background: currentColor }}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1.6, opacity: 0.6 }}
               transition={{ duration: 0.6 }}
            />

            {/* 카드 */}
            <motion.div
               initial={{ scale: 0.2, opacity: 0, rotate:-10 }}
               animate={{ scale: 1, opacity: 1, rotate:0 }}
               transition={{ type: "spring", stiffness: 200 }}
               className="absolute flex flex-col items-center"
            >
               <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl text-center">
               <div className="text-xs text-gray-400 mb-1">
                  NEW ITEM
               </div>

               <div className="text-lg font-bold">
                  {result.name}
               </div>

               <div className="text-sm text-gray-500">
                  {result.grade}
               </div>
               </div>
            </motion.div>
         </>
         )}

      </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
