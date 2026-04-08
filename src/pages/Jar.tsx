import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Star, ArrowUpRight, Sparkles, Quote, History, BrainCircuit, Activity, Package, Gamepad2 } from 'lucide-react';

/* 아바타 개발을 위한 임시 작업 DB 작업후 수정 필요 */
// import { MOCK_ITEMS } from '../data/Avatar';

export default function Jar() {
  const { user, emotions = [], collection = [], fetchHistory, fetchMe, fetchCollection, drawItem, toggleEquip } = useStore();
  const [phase, setPhase] = useState<
   'idle' | 'egg' | 'shake' | 'flash' | 'crack' | 'reveal'
   >('idle');

   const [result, setResult] = useState<any>(null);
   const [drawGrade, setDrawGrade] = useState<string | null>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [lastDrawnItem, setLastDrawnItem] = useState<any>(null);
   
   type Grade = 'common' | 'rare' | 'unique' | 'epic';
   const gradeSequence : Record<Grade, string[]>= {
      common: ['common'],
      rare: ['common','rare'],
      unique: ['common','rare','unique'],
      epic: ['common','rare','unique','epic']
   };
   const [flashLayers, setFlashLayers] = useState<string[]>([]);

   // 알 꺠는 색상 표시
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

  const handleDraw = async () => {
  if (isDrawing) return;
  setIsDrawing(true);

  // 캔디 부족 체크
  if ((user?.current_candy_count || 0) < 2) {
    alert("캔디가 부족해요! 리플렉션을 작성해서 캔디를 모아보세요. 🍬");
    setIsDrawing(false);
    return;
  }

  // 아이템 뽑기
  const res = await drawItem();
  if (!res.success) {
    alert(res.message);
    setIsDrawing(false);
    return;
  }

  // 단계별 시간 변수화
  const gradeSequence: Record<Grade, string[]> = {
    common: ["common"],
    rare: ["common", "rare"],
    unique: ["common", "rare", "unique"],
    epic: ["common", "rare", "unique", "epic"],
  };
  const sequence = gradeSequence[res.item.grade as Grade];

  const eggTime = 0;
  const shakeTime = 600;
  const crackTime = 1100;
  const flashStart = 1500;
  const revealTime = 1900 + sequence.length * 1100;
  const endTime = 4500 + sequence.length * 1100;

  // 알 등장
  setTimeout(() => setPhase("egg"), eggTime);

  // 흔들림
  setTimeout(() => setPhase("shake"), shakeTime);

  // 깨짐
  setTimeout(() => setPhase("crack"), crackTime);

  // 등급별 번쩍임
  sequence.forEach((g, index) => {
    setTimeout(() => {
      setDrawGrade(g as Grade);
      setFlashLayers((prev) => [...prev, gradeColor[g as Grade]]);
      setPhase("flash");
    }, flashStart + index * 1100);
  });

  // 결과 등장
  setTimeout(async() => {
  setResult(res.item);          // 여기서 결과 넣기
  setDrawGrade(res.item.grade);
  setLastDrawnItem(res.item);
  setPhase("reveal");

   await fetchCollection();

  setTimeout(() => setLastDrawnItem(null), 3000);
}, revealTime);

  // 종료: 초기화
  setTimeout(() => {
    setPhase("idle");
    setResult(null);
    setIsDrawing(false);
    setFlashLayers([]);
  }, endTime);
};

  const equippedItems = useMemo(() => collection.filter(i => i.is_equipped), [collection]);
  const currentColor = drawGrade ? gradeColor[drawGrade as keyof typeof gradeColor] : "#ffffff";

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
             <div className="p-5 bg-white/60 rounded-3xl border border-white/40 shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 bg-brand-mint/20 rounded-xl flex items-center justify-center text-brand-mint shrink-0">
                  <Gamepad2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-primary/50 uppercase tracking-widest">현재 캔디</p>
                  <p className="text-3xl font-black text-brand-primary">{user?.current_candy_count || 0}개</p>
                  <p className="text-[10px] text-brand-primary/40 mt-0.5">하루 최대 2개 적립</p>
                </div>
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
                            {item.collection_id} 착용 중
                         </div>
                      </div>
                   ))}
                </div>
                {collection.some(i => i.Collection.item_type === 'background' && i.is_equipped) && (
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
                {collection.map((item) => {
  const avatar = item.Collection;

  return (
    <motion.button
      key={item.id}
      whileHover={{ scale: 1.1 }}
      onClick={() => toggleEquip(item.collection_id)}
      className={`aspect-square rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all ${
        item.is_equipped
          ? 'border-brand-primary bg-brand-primary/10 shadow-lg'
          : 'border-white bg-white/40 hover:bg-white'
      }`}
    >
      {avatar?.video_url ? (
        <video
          src={avatar.video_url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : avatar?.image_url ? (
        <img
          src={avatar.image_url}
          alt={avatar.name}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <Sparkles size={16} className="text-brand-primary/30" />
      )}

      {item.is_equipped && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
      )}
    </motion.button>
  );
})}
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
                        "{emotions[0]?.EMO_reflectionText || "아직 첫 기록이 없네요. 오늘의 마음을 들려주시면 야미가 멋진 요약을 해드릴게요!"}"
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
                        <span className="text-[10px] font-black text-brand-primary/40 uppercase">{new Date(item.createdAt).toLocaleDateString()}</span>
                        <p className="text-base font-bold text-brand-primary truncate">{item.EMO_reflectionText}</p>
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
         
         {/* 빛 효과 */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  <AnimatePresence> {/* mode="wait" 삭제: 빛이 겹치며 전환됨 */}
    {phase === 'flash' && (
      <motion.div
        key={drawGrade} // 등급이 바뀔 때마다 새로운 레이어 생성
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0, 1, 0.8], 
          scale: [0.8, 1.5, 1.2] 
        }}
        exit={{ opacity: 0, scale: 2, transition: { duration: 0.8 } }} // 서서히 커지며 사라짐
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute flex items-center justify-center"
      >
        {/* 1. 메인 부드러운 광원 (배경 색상 채우기) */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-60"
          style={{ background: currentColor }}
        />

        {/* 2. 강력한 중앙 폭발 (번쩍이는 임팩트) */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[60px]"
          style={{ background: `radial-gradient(circle, #ffffff 0%, ${currentColor} 70%)` }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, ease: "backOut" }}
        />

        {/* 3. 빠르게 퍼져나가는 충격파 링 */}
        <motion.div
          className="absolute rounded-full border-[10px]"
          style={{ borderColor: currentColor }}
          initial={{ width: 100, height: 100, opacity: 1, borderWidth: "10px" }}
          animate={{ 
            width: 1000, 
            height: 1000, 
            opacity: 0, 
            borderWidth: "1px" 
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>
    )}
  </AnimatePresence>
</div>
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
            {/* 후광 */}
            <motion.div
               className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
               style={{ background: currentColor }}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1.5, opacity: 0.4 }}
               transition={{ duration: 0.8 }}
            />

            {/* 실제 결과 카드 디자인 */}
            <motion.div
               initial={{ scale: 0.2, opacity: 0, rotate: -15, y: 50 }}
               animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
               transition={{ type: "spring", stiffness: 260, damping: 20 }}
               className="relative z-50 flex flex-col items-center"
            >
               <div className="bg-white/90 backdrop-blur-md p-5 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white w-80 overflow-hidden">
               
               {/* 🎬 미디어 영역: 비디오 우선, 없으면 이미지 */}
               <div className="relative w-full aspect-square bg-gray-50 rounded-[2rem] overflow-hidden mb-6 shadow-inner flex items-center justify-center">
                  {result.video_url ? (
                     <video 
                     src={result.video_url} 
                     autoPlay 
                     loop 
                     muted 
                     playsInline 
                     className="w-full h-full object-cover"
                     />
                  ) : result.image_url ? (
                     <img 
                     src={result.image_url} 
                     alt={result.name}
                     className="w-full h-full object-contain p-4"
                     />
                  ) : (
                     /* 데이터가 없을 때의 기본 아이콘 */
                     <Sparkles size={60} className="text-brand-primary/20" />
                  )}
               </div>

               {/* 하단 텍스트 정보 */}
               <div className="text-center pb-2">
                  <p className="text-[11px] font-black text-brand-primary/30 uppercase tracking-[0.2em] mb-1">
                     New Item Unlocked
                  </p>
                  <h2 className="text-2xl font-black text-brand-primary leading-tight mb-1">
                     {result.name}
                  </h2>
                  <p className="text-[12px] font-bold opacity-50" style={{ color: currentColor }}>
                     {result.grade === 'epic' ? '✨ Legendary Discovery ✨' : 'Collection Updated'}
                  </p>
               </div>
               </div>
               
               {/* 바닥 그림자 효과 */}
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
