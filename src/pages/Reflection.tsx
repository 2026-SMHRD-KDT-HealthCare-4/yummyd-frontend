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

const SPELL_ICONS = ['⭐', '🌟', '✨', '🌈', '🍀', '🌊', '🕊️', '🌙', '💫', '🌿'];

const SPELL_DATA: Record<SpellType, string[]> = {
  positive: [
    '나는 지금 이 순간을 온전히 누릴 자격이 있다',
    '이 기분은 내가 살아있다는 증거야',
    '좋은 일은 계속해서 내게로 흘러온다',
    '잘 되는 건 당연한 일이야, 나니까',
    '나는 지금 충분히 빛나고 있다',
    '오늘의 나는 어제보다 한 뼘 더 자랐다',
    '나는 사랑받고 있고, 사랑을 줄 수 있다',
    '이 에너지가 오래도록 나와 함께하기를',
    '나는 내가 원하는 삶의 방향으로 가고 있다',
    '오늘의 이 감정을 기억하자, 반드시 다시 돌아올 거야',
  ],
  neutral: [
    '굳이 특별한 감정을 만들지 않아도 돼',
    '그냥 존재하는 것만으로도 오늘은 합격이야',
    '설레지 않아도 내 하루는 충분히 유효하다',
    '조용한 날들이 쌓여서 단단한 내가 만들어진다',
    '지금 이 평온함, 나쁘지 않아',
    '드라마틱하지 않아도 나는 잘 살아가고 있다',
    '오늘은 아무 색도 아닌 날, 그래도 나쁘지 않아',
    '아무것도 느끼지 못하는 것도 하나의 감정이야',
    '지금 이 무감각은 쉬어가는 중인 거야',
    '작은 것 하나에만 집중해보자, 지금 이 온도, 이 숨소리',
  ],
  negative: [
    '지금 힘든 게 맞아, 괜찮지 않아도 돼',
    '이 슬픔은 내가 무언가를 소중히 여긴다는 뜻이야',
    '울어도 괜찮아, 눈물은 막힌 것을 흘려보내는 거야',
    '이 감정도 지나간다, 모든 건 흐른다',
    '나는 이 슬픔에 삼켜지지 않는다',
    '슬픔을 느낀다는 건 내가 아직 살아있다는 거야',
    '지금 당장 해결하지 않아도 된다',
    '이 어둠 속에서도 나는 나를 잃지 않는다',
    '나는 나를 포기하지 않는다',
    '나에게 다정하게 대해줄 사람은 먼저 나 자신이야',
  ],
  burnout: [
    '숨 한 번 쉬자, 그것만으로 충분해',
    '나는 지금까지 정말 많이 버텨왔다',
    '쉬는 것도 하나의 일이야, 죄책감 갖지 않아도 돼',
    '오늘은 여기까지만, 그것으로 충분히 잘 했어',
    '지친 나를 몰아붙이지 않겠다',
    '내 몸과 마음이 쉬고 싶다고 말하는 거야, 들어줄게',
    '모든 걸 다 잘할 필요는 없어',
    '잠깐 멈추는 건 포기가 아니야',
    '나는 소진되면서까지 증명할 것이 없다',
    '지금 이 피로는, 내가 열심히 살아온 증거야',
  ],
  anger: [
    '짜증나는 게 맞아, 그럴 만 하니까',
    '이 감정은 신호야, 내가 뭔가를 원하고 있다는 뜻이야',
    '지금 이 불쾌함은 내가 예민한 게 아니라 당연한 반응이야',
    '나는 이 감정에 끌려다니지 않겠다',
    '심호흡 한 번, 지금 이 순간만 넘기면 돼',
    '모든 걸 참을 필요는 없지만, 내가 다치지 않는 방식으로 풀자',
    '짜증은 에너지야, 잘 쓰면 나를 움직이는 힘이 돼',
    '지금 나를 힘들게 하는 것에 끌려다니지 않겠다',
    '이 감정도 잠시 후엔 옅어진다',
    '나는 나의 짜증을 판단하지 않겠다, 그냥 느끼고 보내줄게',
  ],
};

const SPELL_PLACEHOLDER_MAP: Record<string, string> = {
  // 좋아요
  '나는 지금 이 순간을 온전히 누릴 자격이 있다':       '지금 이 순간, 어떤 기분이 느껴지나요? 그대로 적어봐요',
  '이 기분은 내가 살아있다는 증거야':                   '오늘 살아있음을 느끼게 해준 것이 있나요?',
  '좋은 일은 계속해서 내게로 흘러온다':                 '오늘 나에게 흘러온 작은 좋은 일을 적어볼까요?',
  '잘 되는 건 당연한 일이야, 나니까':                   '오늘 나답게 잘 해낸 것, 하나만 써봐요',
  '나는 지금 충분히 빛나고 있다':                       '지금 내가 빛난다고 느끼는 이유가 있나요?',
  '오늘의 나는 어제보다 한 뼘 더 자랐다':               '어제와 달라진 오늘의 내가 느껴지나요?',
  '나는 사랑받고 있고, 사랑을 줄 수 있다':              '오늘 사랑을 느낀 순간이 있었나요?',
  '이 에너지가 오래도록 나와 함께하기를':               '지금 이 에너지로 하고 싶은 게 있나요?',
  '나는 내가 원하는 삶의 방향으로 가고 있다':           '지금 나는 어디로 향하고 있는 것 같나요?',
  '오늘의 이 감정을 기억하자, 반드시 다시 돌아올 거야': '지금 이 감정을 미래의 나에게 한 마디로 남겨봐요',
  // 보통이에요
  '굳이 특별한 감정을 만들지 않아도 돼':                '특별하지 않은 오늘, 그냥 있는 그대로 적어봐요',
  '그냥 존재하는 것만으로도 오늘은 합격이야':           '오늘 존재하면서 한 것 중 하나만 적어볼까요?',
  '설레지 않아도 내 하루는 충분히 유효하다':            '설레진 않았지만, 오늘 있었던 일을 담담하게 적어봐요',
  '조용한 날들이 쌓여서 단단한 내가 만들어진다':        '요즘 조용히 쌓이고 있는 것이 있나요?',
  '지금 이 평온함, 나쁘지 않아':                        '지금 이 고요함 속에서 뭐가 느껴지나요?',
  '드라마틱하지 않아도 나는 잘 살아가고 있다':          '별일 없는 오늘, 그래도 내가 해낸 것은요?',
  '오늘은 아무 색도 아닌 날, 그래도 나쁘지 않아':      '오늘을 색으로 표현한다면 어떤 색일 것 같아요?',
  '아무것도 느끼지 못하는 것도 하나의 감정이야':        '지금 아무것도 느껴지지 않는다면, 그것도 써봐도 돼요',
  '지금 이 무감각은 쉬어가는 중인 거야':                '요즘 나의 마음이 쉬고 싶어하는 것 같나요?',
  '작은 것 하나에만 집중해보자, 지금 이 온도, 이 숨소리': '지금 이 순간 느껴지는 감각을 하나만 적어볼까요?',
  // 슬퍼요
  '지금 힘든 게 맞아, 괜찮지 않아도 돼':               '지금 힘든 것, 여기에 그냥 털어놓아도 괜찮아요',
  '이 슬픔은 내가 무언가를 소중히 여긴다는 뜻이야':    '지금 나에게 소중한 게 뭔지 느껴지나요?',
  '울어도 괜찮아, 눈물은 막힌 것을 흘려보내는 거야':   '지금 흘려보내고 싶은 것이 있나요?',
  '이 감정도 지나간다, 모든 건 흐른다':                 '지금 이 감정이 어디서 왔는지, 가만히 느껴봐요',
  '나는 이 슬픔에 삼켜지지 않는다':                     '지금 나를 붙잡고 있는 것이 무엇인가요?',
  '슬픔을 느낀다는 건 내가 아직 살아있다는 거야':       '지금 내 안에서 살아있는 감정을 적어봐요',
  '지금 당장 해결하지 않아도 된다':                     '지금 당장 해결하지 않아도 되는 것, 내려놓아봐요',
  '이 어둠 속에서도 나는 나를 잃지 않는다':             '지금 어둠 속에서도 내가 붙잡고 있는 것은요?',
  '나는 나를 포기하지 않는다':                          '지금 나 자신에게 해주고 싶은 말이 있나요?',
  '나에게 다정하게 대해줄 사람은 먼저 나 자신이야':     '지금 나에게 가장 필요한 다정한 말 한마디는요?',
  // 지쳐요
  '숨 한 번 쉬자, 그것만으로 충분해':                   '숨을 고르고 나서, 지금 떠오르는 것을 적어봐요',
  '나는 지금까지 정말 많이 버텨왔다':                   '내가 버텨온 것들 중 하나만 꺼내봐요, 잘 해왔어요',
  '쉬는 것도 하나의 일이야, 죄책감 갖지 않아도 돼':    '요즘 쉬지 못하게 만드는 것이 있나요?',
  '오늘은 여기까지만, 그것으로 충분히 잘 했어':         '오늘 내가 해낸 것 중 딱 하나만, 스스로 인정해줘요',
  '지친 나를 몰아붙이지 않겠다':                        '요즘 나를 가장 지치게 만드는 게 뭔가요?',
  '내 몸과 마음이 쉬고 싶다고 말하는 거야, 들어줄게':  '지금 몸과 마음이 원하는 게 뭔지 느껴지나요?',
  '모든 걸 다 잘할 필요는 없어':                        '요즘 내가 너무 많이 짊어지고 있는 것이 있나요?',
  '잠깐 멈추는 건 포기가 아니야':                       '지금 잠깐 멈추고 싶은 이유를 적어봐요',
  '나는 소진되면서까지 증명할 것이 없다':               '요즘 내가 누구에게, 무엇을 증명하려 했던 것 같나요?',
  '지금 이 피로는, 내가 열심히 살아온 증거야':          '오늘 이 피로를 만들어낸 나의 하루는 어땠나요?',
  // 짜증나요
  '짜증나는 게 맞아, 그럴 만 하니까':                   '지금 뭐가 가장 짜증나나요? 여기선 솔직해도 돼요',
  '이 감정은 신호야, 내가 뭔가를 원하고 있다는 뜻이야': '지금 내가 진짜 원하는 게 뭔지 느껴지나요?',
  '지금 이 불쾌함은 내가 예민한 게 아니라 당연한 반응이야': '어떤 상황이 나를 불쾌하게 만들었나요?',
  '나는 이 감정에 끌려다니지 않겠다':                   '지금 이 감정을 어떻게 다루고 싶은가요?',
  '심호흡 한 번, 지금 이 순간만 넘기면 돼':             '숨 고르고 나서, 지금 딱 한 가지만 적어봐요',
  '모든 걸 참을 필요는 없지만, 내가 다치지 않는 방식으로 풀자': '나를 다치지 않게 이 감정을 풀 방법이 있을까요?',
  '짜증은 에너지야, 잘 쓰면 나를 움직이는 힘이 돼':    '이 에너지를 어디에 쓰고 싶은가요?',
  '지금 나를 힘들게 하는 것에 끌려다니지 않겠다':       '지금 나를 가장 힘들게 하는 것이 뭔지 써봐요',
  '이 감정도 잠시 후엔 옅어진다':                       '이 감정이 지나가고 나면 어떻게 되고 싶나요?',
  '나는 나의 짜증을 판단하지 않겠다, 그냥 느끼고 보내줄게': '지금 이 짜증을 그냥 여기에 내려놓아봐요',
};

const pickRandom = <T,>(arr: T[], count: number): T[] =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(count, arr.length));

const toSpells = (texts: string[], _spellType: SpellType | 'mixed' = 'mixed'): Spell[] =>
  texts.map((text, i) => ({
    icon: SPELL_ICONS[i % SPELL_ICONS.length],
    main: `"${text}"`,
    placeholder: SPELL_PLACEHOLDER_MAP[text] ?? '오늘 하루 어떤 감정이 가장 컸나요? 편하게 털어놔봐요 :)',
  }));

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
  const [displayedSpells, setDisplayedSpells] = useState<Spell[]>([]);
  const [extraSpells, setExtraSpells] = useState<Spell[]>([]);
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
  const [charToggle, setCharToggle] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const emotionFileRef = useRef<HTMLInputElement>(null);
  const studyFileRef = useRef<HTMLInputElement>(null);
  const freeTextStartRef = useRef<number | null>(null);

  const { user, setAnalyzing, isAnalyzing, fetchHistory, emotions } = useStore();

  // 어제 복습 힌트
  const yesterdayReview = emotions[0]?.EDU_review ?? null;


  // ─── 분석 상태 감시 ────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      if (isAnalyzing && user) {
        await fetchHistory();
        const last = emotions[0];
        if (last && last.createdAt) {
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


  useEffect(() => {
    let charInterval: ReturnType<typeof setInterval>;
    if (isTransitioning) {
      setCharToggle(true);
      charInterval = setInterval(() => {
        setCharToggle(prev => !prev);
      }, 700);
    }
    return () => clearInterval(charInterval);
  }, [isTransitioning]);

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
  const canSubmit = !isTransitioning && (
    !!selectedEmotion || !!emotionOneLine.trim() || !!todayGoal.trim() || !!learned.trim()
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!user) return alert('로그인이 필요합니다.');

    const delayMinutes = freeTextStartRef.current
      ? Math.round((Date.now() - freeTextStartRef.current) / 1000)
      : 0;

    try {
      const response = await axios.post('/api/reflection', {
        userId: user.id,
        delayMinutes,
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
        setIsTransitioning(true);
        setAnalyzing(true);
        setTimeout(() => {
          setIsTransitioning(false);
          navigate('/jar');
        }, 2000);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('회고 등록 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
      setIsTransitioning(false);
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

      {/* 전환 오버레이 — 제출 후 2초간 표시 */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[200] bg-[#FFF9F0] flex flex-col items-center justify-center">
          <motion.div
            animate={{ y: [0, -22, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-10 relative w-56 h-56"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={charToggle ? 'pure' : 'wink'}
                src={charToggle ? yummyPure : yummyWink}
                alt="Yummy"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="w-56 h-56 object-contain absolute inset-0"
              />
            </AnimatePresence>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-black text-brand-primary"
          >
            오늘의 마음을 담고 있어요 🍬
          </motion.p>
        </div>
      )}

      {/* 본문 */}
      <div className="max-w-[600px] mx-auto px-4 py-6 pb-28 flex flex-col gap-5">

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
                    setExtraSpells([]);
                    setDisplayedSpells(toSpells(pickRandom(SPELL_DATA[em.spellType], 3), em.spellType));
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
                    {[...displayedSpells, ...extraSpells].map((spell) => (
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
                    onClick={() => {
                      if (showAllSpells) {
                        setShowAllSpells(false);
                        setExtraSpells([]);
                      } else {
                        const currentType = EMOTIONS.find(e => e.key === selectedEmotion)!.spellType;
                        const otherTexts = Object.entries(SPELL_DATA)
                          .filter(([type]) => type !== currentType)
                          .flatMap(([, texts]) => texts);
                        setExtraSpells(toSpells(pickRandom(otherTexts, Math.floor(Math.random() * 2) + 2), 'mixed'));
                        setShowAllSpells(true);
                      }
                    }}
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
                  onChange={e => {
                    if (!freeTextStartRef.current) freeTextStartRef.current = Date.now();
                    setFreeText(e.target.value);
                  }}
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

      </div>

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
