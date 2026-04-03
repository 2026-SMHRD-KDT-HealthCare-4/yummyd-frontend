import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import yummyPure from '../assets/yummyd_character_pure.png';
import yummyWink from '../assets/yummyd_character_wink.png';

// ─── 타입 ───────────────────────────────────────────────
type EmotionKey = 'happy' | 'normal' | 'sad' | 'tired' | 'angry';
type SpellType = 'positive' | 'neutral' | 'negative' | 'burnout' | 'anger';
type AchievementKey = 'clear' | 'half' | 'little' | 'retry';

interface Spell {
  icon: string;
  main: string;
  placeholder: string;
}

// ─── 데이터 ──────────────────────────────────────────────
const EMOTIONS: { key: EmotionKey; emoji: string; label: string; spellType: SpellType }[] = [
  { key: 'happy',  emoji: '😊', label: '좋아요',   spellType: 'positive' },
  { key: 'normal', emoji: '😐', label: '보통이요',  spellType: 'neutral'  },
  { key: 'sad',    emoji: '😔', label: '슬퍼요',   spellType: 'negative' },
  { key: 'tired',  emoji: '😩', label: '지쳐요',   spellType: 'burnout'  },
  { key: 'angry',  emoji: '😤', label: '짜증나요',  spellType: 'anger'    },
];

const ALL_SPELLS: Spell[] = [
  { icon: '⭐', main: '"나는 오늘도 잘하고 있다"',  placeholder: '오늘 뿌듯했던 순간을 한 줄로 기록해봐요' },
  { icon: '🌊', main: '"이것도 지나간다"',          placeholder: '오늘 가장 힘들었던 순간을 한 줄로 써볼까요?' },
  { icon: '🚀', main: '"오늘은 특별한 날이다"',     placeholder: '오늘을 특별하게 만든 게 뭔지 알려줘요!' },
  { icon: '🛋️', main: '"쉬어도 괜찮다"',           placeholder: '오늘 무리했던 것 같아요. 어떤 점이 힘들었나요?' },
  { icon: '🌱', main: '"작은 것도 성장이다"',       placeholder: '오늘 스스로를 너무 몰아붙인 순간이 있었나요?' },
];

const SPELL_MAP: Record<SpellType, Spell[]> = {
  positive: [ALL_SPELLS[0], ALL_SPELLS[2], ALL_SPELLS[4]],
  neutral:  [ALL_SPELLS[4], ALL_SPELLS[0]],
  negative: [ALL_SPELLS[1], ALL_SPELLS[3]],
  burnout:  [ALL_SPELLS[3], ALL_SPELLS[1]],
  anger:    [ALL_SPELLS[1], ALL_SPELLS[4]],
};

const ACHIEVEMENTS: { key: AchievementKey; emoji: string; main: string; sub: string; color: string }[] = [
  { key: 'clear', emoji: '🎉', main: '완전히 이해했다!',     sub: '오늘 목표 완벽 달성',      color: 'border-emerald-400 bg-emerald-50' },
  { key: 'half',  emoji: '🔥', main: '절반 정도는 이해했다', sub: '반은 됐어요, 나머지는 내일!', color: 'border-amber-400 bg-amber-50'   },
  { key: 'little',emoji: '🌱', main: '조금은 알겠다',        sub: '방향은 잡혔어요',           color: 'border-sky-400 bg-sky-50'       },
  { key: 'retry', emoji: '😅', main: '다음에 다시 도전',     sub: '오늘은 좀 어려웠어요',      color: 'border-pink-400 bg-pink-50'     },
];

// ─── 컴포넌트 ────────────────────────────────────────────
export default function Reflection() {
  const navigate = useNavigate();

  // 감정 섹션 상태
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [showAllSpells, setShowAllSpells] = useState(false);
  const [emotionOneLine, setEmotionOneLine] = useState('');
  const [emotionImage, setEmotionImage] = useState<string | null>(null);

  // 학습 섹션 상태
  const [todayGoal, setTodayGoal] = useState('');
  const [achievement, setAchievement] = useState<AchievementKey | null>(null);
  const [learned, setLearned] = useState('');
  const [confused, setConfused] = useState('');
  const [review, setReview] = useState('');
  const [freeText, setFreeText] = useState('');
  const [studyImage, setStudyImage] = useState<string | null>(null);

  // 공통 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const emotionFileRef = useRef<HTMLInputElement>(null);
  const studyFileRef = useRef<HTMLInputElement>(null);

  const { user, setAnalyzing, isAnalyzing, fetchHistory, emotions } = useStore();

  // 어제 복습 힌트
  const yesterdayReview = emotions[0]?.review ?? null;

  // 현재 표시할 주문 목록
  const currentSpells: Spell[] = selectedEmotion
    ? (showAllSpells ? ALL_SPELLS : SPELL_MAP[EMOTIONS.find(e => e.key === selectedEmotion)!.spellType])
    : [];

  // ─── 분석 상태 감시 ────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      if (isAnalyzing && user) {
        await fetchHistory();
        const last = emotions[0];
        if (last && last.analysis_status === 'completed') {
          const finishedAt = new Date(last.updatedAt).getTime();
          if (Date.now() - finishedAt < 60000) setAnalyzing(false);
        }
      }
    };
    checkStatus();
    if (isAnalyzing) {
      const timer = setTimeout(() => setAnalyzing(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, user, fetchHistory, emotions, setAnalyzing]);

  const analysisSteps = [
    '야미가 당신의 이야기를 읽고 있어요...',
    '문장 속에서 감정 조각들을 찾는 중...',
    '오늘의 마음 사탕을 예쁘게 빚고 있어요!',
    '거의 다 됐어요! 유리병에 담는 중...',
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // ─── 이미지 처리 ───────────────────────────────────────
  const processImage = (file: File): Promise<string> => {
    setIsProcessing(true);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setIsProcessing(false);
            resolve(dataUrl);
          } catch (err) { setIsProcessing(false); reject(err); }
        };
        img.onerror = () => { setIsProcessing(false); reject(new Error('이미지를 불러올 수 없습니다.')); };
      };
      reader.onerror = () => { setIsProcessing(false); reject(new Error('파일을 읽는 중 오류가 발생했습니다.')); };
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try { setter(await processImage(file)); }
      catch (error: unknown) { alert(error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.'); }
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      try { setEmotionImage(await processImage(file)); }
      catch (error: unknown) { alert(error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.'); }
    }
  };

  // ─── 제출 ──────────────────────────────────────────────
  const canSubmit = !isAnalyzing && (
    !!selectedEmotion || !!emotionOneLine.trim() || !!todayGoal.trim() || !!learned.trim()
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!user) return alert('로그인이 필요합니다.');

    try {
      const response = await axios.post('/api/reflection', {
        userId: user.id,
        text: emotionOneLine,
        image: emotionImage,
        isPrivate: false,
        emotionEmoji: selectedEmotion,
        selectedSpell: selectedSpell?.main ?? null,
        emotionOneLine,
        todayGoal,
        achievement,
        learned,
        confused,
        review,
        freeText,
        studyImage,
      });

      if (response.data.success) {
        setAnalyzing(true);
        setTimeout(() => { navigate('/jar'); }, 1500);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('회고 등록 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
      setAnalyzing(false);
    }
  };

  // ─── 렌더 ──────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen bg-[#FFF9F0]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 드래그 오버레이 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-brand-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-brand-primary m-4 rounded-[3.5rem] pointer-events-none">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <ImageIcon size={48} className="text-brand-primary animate-bounce" />
            <p className="text-xl font-black text-brand-primary">여기에 이미지를 놓아주세요!</p>
          </div>
        </div>
      )}

      {/* 분석 중 오버레이 */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key="analysis-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-12"
            >
              <img
                src={analysisStep < 2 ? yummyPure : yummyWink}
                alt="Yummy"
                className="w-64 h-64 object-contain"
              />
            </motion.div>
            <div className="text-center space-y-6 max-w-md">
              <motion.h3
                key={analysisStep}
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black text-brand-primary"
              >
                {analysisSteps[analysisStep]}
              </motion.h3>
              <div className="w-full h-2 bg-brand-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(analysisStep + 1) * 25}%` }}
                  className="h-full bg-brand-primary"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 본문 */}
      <motion.div
        animate={{ filter: isAnalyzing ? 'blur(10px)' : 'blur(0px)', opacity: isAnalyzing ? 0.3 : 1 }}
        className="max-w-[600px] mx-auto px-4 py-6 pb-28 flex flex-col gap-5"
      >

        {/* ── 감정 리플렉션 카드 ── */}
        <div>
          <p className="text-[11px] font-black tracking-[1.5px] uppercase text-gray-400 mb-2.5">감정 리플렉션</p>
          <div className="bg-gradient-to-br from-[#FFF9F0] to-[#FFF0FA] border border-[#FFE4B5] rounded-2xl p-5 shadow-md">

            <p className="font-bold text-brand-primary mb-0.5">🎭 오늘 내 감정은?</p>
            <p className="text-sm text-gray-500 mb-4">지금 솔직한 감정을 하나 골라봐요</p>

            {/* 이모지 선택 */}
            <div className="flex justify-between gap-2 mb-5">
              {EMOTIONS.map((em) => (
                <button
                  key={em.key}
                  onClick={() => {
                    setSelectedEmotion(em.key);
                    setSelectedSpell(null);
                    setShowAllSpells(false);
                  }}
                  className={`
                    flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all
                    ${selectedEmotion === em.key
                      ? 'border-amber-400 bg-[#FFFBEA] shadow-md -translate-y-1'
                      : 'border-transparent bg-white/70 hover:-translate-y-1 hover:shadow-md'}
                  `}
                >
                  <span className="text-3xl">{em.emoji}</span>
                  <span className={`text-[10px] font-bold transition-all ${selectedEmotion === em.key ? 'text-amber-700 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                    {em.label}
                  </span>
                </button>
              ))}
            </div>

            {/* 주문 목록 */}
            <AnimatePresence>
              {selectedEmotion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <p className="text-[13px] font-semibold text-gray-500 mb-2.5 flex items-center gap-1.5">
                    ✨ 오늘 나에게 필요한 주문은?
                  </p>
                  <div className="flex flex-col gap-2">
                    {currentSpells.map((spell) => (
                      <button
                        key={spell.main}
                        onClick={() => setSelectedSpell(spell)}
                        className={`
                          flex items-center gap-3 px-4 py-3.5 rounded-xl border-[1.5px] text-left transition-all
                          ${selectedSpell?.main === spell.main
                            ? 'border-amber-400 bg-[#FFFBEA] shadow-sm'
                            : 'border-[#F0E6D3] bg-white/85 hover:border-amber-300 hover:bg-[#FFFEF5]'}
                        `}
                      >
                        <span className="text-xl w-7 text-center flex-shrink-0">{spell.icon}</span>
                        <span className={`text-sm font-semibold ${selectedSpell?.main === spell.main ? 'text-amber-700' : 'text-gray-800'}`}>
                          {spell.main}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAllSpells(prev => !prev)}
                    className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
                  >
                    {showAllSpells ? '· 접기' : '· 다른 주문 보기'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 감정 한 줄 입력 */}
            <div className="pt-4 border-t border-dashed border-amber-200">
              <p className="text-[13px] font-semibold text-gray-500 mb-2 flex items-center gap-2">
                💬 오늘의 감정을 한 줄로
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">선택</span>
              </p>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={150}
                  className="w-full border border-[#F0E6D3] rounded-xl px-3.5 py-3 text-sm text-gray-800 bg-white/90 resize-none outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 placeholder:text-gray-400 placeholder:text-[13px] leading-relaxed transition"
                  placeholder={selectedSpell?.placeholder ?? '오늘 하루 어떤 감정이 가장 컸나요? 편하게 털어놔봐요 :)'}
                  value={emotionOneLine}
                  onChange={e => setEmotionOneLine(e.target.value)}
                />
                <span className="absolute bottom-2.5 right-3 text-[11px] text-gray-300">{emotionOneLine.length}/150</span>
              </div>
            </div>

            {/* 사진 첨부 */}
            <div className="mt-3 flex gap-2.5 items-start flex-wrap">
              <input type="file" ref={emotionFileRef} accept="image/*" className="hidden"
                onChange={e => handleImageUpload(e, setEmotionImage)} />
              <button
                onClick={() => emotionFileRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-gray-300 rounded-xl text-[13px] text-gray-500 bg-white/60 hover:border-amber-400 hover:bg-[#FFFBEA] hover:text-gray-700 transition disabled:opacity-50"
              >
                📷 사진 첨부
              </button>
              {emotionImage && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#F0E6D3] shadow-sm">
                  <img src={emotionImage} alt="첨부" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setEmotionImage(null)}
                    className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-black/55 text-white rounded-full flex items-center justify-center text-[11px]"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              {isProcessing && (
                <span className="flex items-center gap-1.5 text-brand-primary text-sm font-bold animate-pulse">
                  <Sparkles size={16} /> 처리 중...
                </span>
              )}
            </div>

          </div>
        </div>

        {/* ── 학습 내용 정리 카드 ── */}
        <div>
          <p className="text-[11px] font-black tracking-[1.5px] uppercase text-gray-400 mb-2.5">학습 내용 정리</p>
          <div className="bg-gradient-to-br from-[#F0FFF4] to-[#F0F4FF] border border-[#C3FAD4] rounded-2xl p-5 shadow-md">

            <p className="font-bold text-brand-primary mb-0.5">📚 오늘의 학습 기록</p>
            <p className="text-sm text-gray-500 mb-4">오늘 배운 것들을 가볍게 정리해봐요. 한 줄씩만 써도 충분해요!</p>

            {/* 어제 힌트 */}
            {yesterdayReview && (
              <div className="bg-white/70 border border-[#D1FAE5] rounded-xl px-4 py-3 flex gap-2.5 items-start mb-4">
                <span className="text-base mt-0.5">💡</span>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  어제 나는 <strong className="text-emerald-600 font-semibold">"{yesterdayReview}"</strong>를 다짐했어요. 오늘 해결됐나요?
                </p>
              </div>
            )}

            {/* 오늘 목표 */}
            <div className="mb-4">
              <p className="text-[13px] font-semibold text-gray-500 mb-2">🎯 오늘 내가 정복하고 싶었던 것은?</p>
              <input
                type="text"
                className="w-full border border-[#F0E6D3] rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white/90 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 placeholder:text-gray-400 placeholder:text-[13px] transition"
                placeholder="예) async/await 완전히 이해하기"
                value={todayGoal}
                onChange={e => setTodayGoal(e.target.value)}
              />
            </div>

            {/* 달성 여부 */}
            <div className="mb-5">
              <p className="text-[13px] font-semibold text-gray-500 mb-2.5">✅ 달성 여부</p>
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.map((ach) => (
                  <button
                    key={ach.key}
                    onClick={() => setAchievement(ach.key)}
                    className={`
                      flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 text-left transition-all
                      ${achievement === ach.key ? ach.color + ' shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}
                    `}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 text-[11px] transition-all ${achievement === ach.key ? 'border-transparent bg-current' : 'border-gray-300 bg-white'}`}>
                      {achievement === ach.key && <span className="text-white">✓</span>}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-gray-800">{ach.emoji} {ach.main}</p>
                      <p className="text-[11px] text-gray-400">{ach.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />

            {/* 학습 3칸 */}
            <div className="flex flex-col gap-3.5 mb-4">
              {[
                { label: '💡 오늘 새로 알게 된 것', placeholder: '예) Promise는 비동기 작업의 결과를 나타내는 객체다', value: learned, setter: setLearned },
                { label: '🤯 아직 잘 모르겠는 것', placeholder: '예) async/await랑 Promise 차이가 아직 헷갈림', value: confused, setter: setConfused },
                { label: '⭐ 내일 꼭 복습할 것',    placeholder: '예) 콜백 지옥 해결 방법',                     value: review,   setter: setReview   },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-[13px] font-semibold text-gray-500 mb-1.5">{field.label}</p>
                  <input
                    type="text"
                    className="w-full border border-[#F0E6D3] rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white/90 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 placeholder:text-gray-400 placeholder:text-[12.5px] transition"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* 자유 입력 (2000자) */}
            <div className="mb-4">
              <p className="text-[13px] font-semibold text-gray-500 mb-1.5 flex items-center gap-2">
                📝 추가로 기록하고 싶은 것
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">선택</span>
              </p>
              <div className="relative">
                <textarea
                  rows={6}
                  maxLength={2000}
                  className="w-full border border-[#F0E6D3] rounded-xl px-3.5 py-3 text-sm text-gray-800 bg-white/90 resize-none outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 placeholder:text-gray-400 placeholder:text-[13px] leading-relaxed transition"
                  placeholder="오늘 수업에서 더 기록해두고 싶은 내용이 있으면 자유롭게 적어봐요"
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                />
                <span className="absolute bottom-2.5 right-3 text-[11px] text-gray-300">{freeText.length}/2000</span>
              </div>
            </div>

            {/* 학습 자료 이미지 */}
            <div className="flex gap-2.5 items-start flex-wrap">
              <input type="file" ref={studyFileRef} accept="image/*" className="hidden"
                onChange={e => handleImageUpload(e, setStudyImage)} />
              <button
                onClick={() => studyFileRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-gray-300 rounded-xl text-[13px] text-gray-500 bg-white/60 hover:border-emerald-400 hover:bg-emerald-50 hover:text-gray-700 transition disabled:opacity-50"
              >
                📸 학습 자료 첨부
              </button>
              {studyImage && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#F0E6D3] shadow-sm">
                  <img src={studyImage} alt="학습자료" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setStudyImage(null)}
                    className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-black/55 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </motion.div>

      {/* ── 하단 fixed 버튼 ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFF9F0]/95 backdrop-blur border-t border-[#F0E6D3] px-4 py-3.5 z-[200]">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full max-w-[600px] mx-auto flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900 font-bold text-base rounded-2xl shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          🍬 오늘의 캔디 채우기
        </button>
      </div>

    </div>
  );
}
