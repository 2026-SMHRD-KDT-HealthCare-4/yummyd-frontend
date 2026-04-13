import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Heart, Send, Sparkles, BookOpen, Users } from 'lucide-react';
import candyDefault from '../assets/candyEmoji_normal.png';
import { Minty, Pinky, Goldy } from '../components/EmotionBuddies';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

// ── 기본 아바타: 캔디 이미지 ─────────────────────────────────
const DefaultAvatar = () => (
  <img src={candyDefault} alt="yummy:D" className="w-full h-full object-contain" />
);

interface CandyPost {
  id: number;
  text: string;
  avatarUrl: string | null;
  avatarIsVideo: boolean;
  authorLabel: string;
  likes: number;
  likedBy: number[];
  createdAt: string;
}

export default function StBoard() {
  const { user, classMood, collection, fetchBoard, fetchCollection } = useStore();

  // ── 캔디 게시판 상태
  const [posts, setPosts] = useState<CandyPost[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ── 반 confused 배너 상태
  const [confusedEntries, setConfusedEntries] = useState<{ userId: number; text: string }[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  // ── 장착 아이템
  const equippedItem = useMemo(() => collection.find(i => i.is_equipped), [collection]);
  const equippedImageUrl = equippedItem?.Collection?.image_url || null;
  const equippedVideoUrl = equippedItem?.Collection?.video_url || null;
  const equippedAvatar = equippedImageUrl || equippedVideoUrl;   // 둘 중 있는 것
  const equippedIsVideo = !equippedImageUrl && !!equippedVideoUrl;
  const equippedLabel = equippedItem?.Collection?.name || 'yummy:D';

  // ── classMood 안전 폴백
  const safeMood = classMood || { message: '모두의 마음이 모이고 있어요.', description: '오늘 우리 반의 감정 사탕은 상큼한 민트색이네요.', dominantEmotion: 'mint' };
  const MoodBuddy = safeMood.dominantEmotion === 'pink' ? Pinky : safeMood.dominantEmotion === 'yellow' ? Goldy : Minty;

  // ── confused 키워드 집계: 상위 명사 1개 + 해당 단어 언급한 고유 학생 %
  const confusedSummary = useMemo(() => {
    if (confusedEntries.length === 0) return null;

    // 모호하거나 무의미한 일반 단어 제외
    const stopWords = new Set([
      // 조사
      '이', '가', '은', '는', '을', '를', '의', '에', '와', '과', '도', '로', '으로', '에서', '에게', '부터', '까지', '만', '랑',
      // 대명사
      '나', '제', '저', '우리', '내가', '나는', '저는',
      // 시간·빈도 부사
      '오늘', '내일', '어제', '이번', '다음', '지금', '아직', '벌써', '이미', '다시', '또', '항상', '자주', '가끔', '별로',
      // 정도 부사
      '너무', '정말', '그냥', '좀', '많이', '더', '안', '못', '잘', '특히', '조금',
      // 접속사·감탄사
      '그리고', '그런데', '하지만', '그래서', '근데', '아', '어', '음',
      // 지시어
      '이렇게', '저렇게', '그렇게', '이게', '그게', '저게', '여기', '거기',
      // 의존명사·모호한 명사
      '것', '수', '때', '점', '부분', '내용', '경우', '곳', '쪽', '거', '뭔가',
      // 모호한 학습 관련 일반어 (너무 포괄적)
      '방법', '공부', '학습', '내용', '문제', '개념', '이해', '공부법', '방식', '부분들', '모르',
      // 동사/형용사 어간
      '같아', '같은', '있어', '없어', '했어', '잘못', '어려워', '힘들어', '모르겠',
    ]);

    // 단어별로 언급한 userId 목록 수집
    const wordUsers: Record<string, Set<number>> = {};
    confusedEntries.forEach(({ userId, text }) => {
      text.split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^가-힣a-zA-Z]/g, '');
        if (clean.length < 2) return;
        if (stopWords.has(clean)) return;

        // 영문: 의미없는 반복 문자열 제외, 2글자 이하 제외
        const isEnglish = /^[a-zA-Z]+$/.test(clean);
        if (isEnglish) {
          if (clean.length < 3) return;
          if (/^(.)\1+$/.test(clean)) return;
        }

        // 동사·형용사 어미 제외
        const isVerb =
          /다$/.test(clean) ||
          /[어아][요서]$/.test(clean) ||
          /[었겠]$/.test(clean) ||
          /[네지죠]$/.test(clean) ||
          /[고며]$/.test(clean) ||
          /니까$/.test(clean) ||
          /[같한운]$/.test(clean) ||
          /[던]$/.test(clean) ||
          /워$/.test(clean) ||     // 어려워, 힘들어
          /해$/.test(clean);       // 이해해, 공부해
        if (isVerb) return;

        if (!wordUsers[clean]) wordUsers[clean] = new Set();
        wordUsers[clean].add(userId);
      });
    });

    const sorted = Object.entries(wordUsers).sort((a, b) => b[1].size - a[1].size);
    if (sorted.length === 0) return null;

    // 1위 단어
    const [topWord, topUsers] = sorted[0];
    const pct = Math.min(100, Math.round((topUsers.size / Math.max(totalStudents, 1)) * 100));
    return { topWord, pct, studentCount: topUsers.size };
  }, [confusedEntries, totalStudents]);

  // ── 데이터 로드
  useEffect(() => {
    fetchBoard();
    fetchCollection();
  }, []);

  useEffect(() => {
    const classId = (user as any)?.class_id;
    if (!classId) return;
    const token = localStorage.getItem('yummy_token');
    axios.get(`/api/classes/reflections/${classId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      if (r.data.success) {
        setConfusedEntries(r.data.confusedEntries || []);
        setTotalStudents(r.data.totalStudents);
      }
    }).catch(() => {});
  }, [user]);

  // ── Socket.io 연결
  useEffect(() => {
    if (!user) return;
    const classId = (user as any)?.class_id;
    if (!classId) return;

    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { userId: user.id, classId });
    });

    socket.on('candy_board_init', (initPosts: CandyPost[]) => {
      setPosts(initPosts);
    });

    socket.on('candy_post_new', (post: CandyPost) => {
      setPosts(prev => [post, ...prev]);
    });

    socket.on('candy_like_update', ({ postId, likes, likedBy }: { postId: number; likes: number; likedBy: number[] }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes, likedBy } : p));
    });

    return () => { socket.disconnect(); };
  }, [user]);

  // ── 캔디 던지기
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || sending || !socketRef.current) return;
    const classId = (user as any)?.class_id;
    if (!classId) return;
    setSending(true);
    socketRef.current.emit('candy_post', {
      classId,
      post: { text, avatarUrl: equippedAvatar, avatarIsVideo: equippedIsVideo, authorLabel: equippedAvatar ? equippedLabel : 'yummy:D' }
    });
    setInputText('');
    setSending(false);
  };

  // ── 하트
  const handleLike = (postId: number) => {
    if (!socketRef.current || !user) return;
    const classId = (user as any)?.class_id;
    socketRef.current.emit('candy_like', { classId, postId, userId: user.id });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8 pb-24 px-6 pt-12 font-brand-kor"
    >
      {/* ── 무드 배너 ────────────────────────────────────── */}
      <section className="bg-white rounded-[3.5rem] p-10 border-2 border-brand-surface shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="flex-shrink-0">
            <MoodBuddy size={160} />
          </div>
          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              <Users size={14} /> Group Mental Health Report
            </div>
            <h2 className="text-4xl font-black text-brand-primary leading-tight">
              {safeMood.message}
            </h2>
            <p className="text-lg text-brand-primary/60 font-bold italic">"{safeMood.description}"</p>
          </div>
        </div>
        <Sparkles className="absolute -top-10 -right-10 text-brand-mint/10" size={250} />
      </section>

      {/* ── 우리반 학습 현황 배너 ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative bg-brand-primary rounded-3xl p-8 overflow-hidden shadow-xl"
      >
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-brand-mint/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen size={22} className="text-brand-yellow" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-2">우리반 학습 현황</p>
            {confusedSummary ? (
              <>
                <p className="text-xl font-black text-white leading-snug">
                  우리반 학생의{' '}
                  <span className="text-brand-yellow">{confusedSummary.pct}%</span>
                  가{' '}
                  <span className="text-brand-yellow">'{confusedSummary.topWord}'</span>
                  을(를) 어려워하고 있어요!
                </p>
                <p className="text-xs text-white/30 mt-3 font-medium">
                  최근 7일 회고 기준 · 전체 {totalStudents}명 중 {confusedSummary.studentCount}명 응답
                </p>
              </>
            ) : (
              <p className="text-lg font-black text-white/60">
                아직 이번 주 회고 데이터가 없어요. 회고를 작성하면 여기에 표시됩니다.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 블라블라 캔디 ────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-11 h-11 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
            <span className="text-lg">🍬</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-primary">블라블라 캔디</h3>
            <p className="text-xs font-bold text-brand-primary/40">익명으로 오늘의 기분이나 학습 난이도를 나눠보세요</p>
          </div>
        </div>

        {/* 입력창 */}
        <div className="bg-white rounded-[2rem] border-2 border-brand-surface p-5 shadow-lg flex items-end gap-4">
          <div className="w-11 h-11 shrink-0">
            {equippedAvatar
              ? equippedIsVideo
                ? <video src={equippedAvatar} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                : <img src={equippedAvatar} alt="avatar" className="w-full h-full object-contain" />
              : <DefaultAvatar />
            }
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="오늘 수업 어떠셨나요? 익명으로 캔디를 던져보세요 🍬"
            rows={2}
            className="flex-1 resize-none bg-brand-surface/60 rounded-2xl px-5 py-4 text-base font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all placeholder:text-brand-primary/30"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="px-6 py-4 bg-brand-primary text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-30 shrink-0"
          >
            캔디 던지기 <Send size={16} />
          </motion.button>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {posts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-brand-primary/20 font-black"
              >
                아직 캔디가 없어요. 첫 번째로 던져보세요! 🍬
              </motion.div>
            ) : posts.map(post => {
              const liked = user ? post.likedBy.includes(user.id) : false;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[2rem] border border-brand-surface px-8 py-5 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow"
                >
                  {/* 아바타 */}
                  <div className="w-11 h-11 shrink-0">
                    {post.avatarUrl
                      ? post.avatarIsVideo
                        ? <video src={post.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                        : <img src={post.avatarUrl} alt="avatar" className="w-full h-full object-contain" />
                      : <DefaultAvatar />
                    }
                  </div>

                  {/* 본문 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black text-brand-primary/30">{post.authorLabel}</span>
                      <span className="text-[10px] text-brand-primary/20">
                        {new Date(post.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-brand-primary font-bold text-base leading-relaxed">{post.text}</p>
                  </div>

                  {/* 하트 */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all shrink-0 ${
                      liked
                        ? 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
                        : 'bg-white border-brand-surface text-brand-primary/20 hover:border-brand-pink/30 hover:text-brand-pink'
                    }`}
                  >
                    <Heart size={18} className={liked ? 'fill-brand-pink' : ''} />
                    <span className="text-sm font-black">{post.likes}</span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
