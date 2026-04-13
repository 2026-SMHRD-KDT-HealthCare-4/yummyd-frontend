import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Users, BarChart3, AlertTriangle, Heart, Send, Sparkles, BookOpen } from 'lucide-react';
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

export default function InBoard() {
  const { user, collection } = useStore();
  const [stats, setStats] = useState<{ totalStudents: number; todayReflections: number; highRiskCount: number } | null>(null);
  const [confusedList, setConfusedList] = useState<string[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [posts, setPosts] = useState<CandyPost[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const role = (user as any)?.role;
  const isInstructor = role === 'institution' || role === 'instructor';

  // 장착 아이템 이미지
  const equippedAvatar = useMemo(() => {
    const eq = collection.find(i => i.is_equipped);
    return eq?.Collection?.image_url || null;
  }, [collection]);

  // ── confused 키워드 집계 ──────────────────────────────────────
  const confusedSummary = useMemo(() => {
    if (confusedList.length === 0) return null;
    const stopWords = new Set(['이', '가', '은', '는', '을', '를', '의', '에', '와', '과', '도', '것', '수', '더', '안', '못', '잘', '너무', '그냥', '좀', '나', '제', '저', '우리']);
    const freq: Record<string, number> = {};
    confusedList.forEach(text => {
      text.split(/\s+/).forEach(w => {
        const clean = w.replace(/[^가-힣a-zA-Z]/g, '');
        if (clean.length >= 2 && !stopWords.has(clean)) {
          freq[clean] = (freq[clean] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const top = sorted.slice(0, 3).map(([w]) => w);
    const pct = Math.round((confusedList.length / Math.max(totalStudents, 1)) * 100);
    return { top, pct };
  }, [confusedList, totalStudents]);

  // ── 강사용 통계 로드 ──────────────────────────────────────────
  useEffect(() => {
    if (!isInstructor) return;
    const token = localStorage.getItem('yummy_token');
    if (!token) return;
    axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.data.success) setStats(r.data.data); })
      .catch(() => {});
  }, [isInstructor]);

  // ── 반 회고(confused) 로드 ───────────────────────────────────
  useEffect(() => {
    const classId = (user as any)?.class_id;
    if (!classId) return;
    const token = localStorage.getItem('yummy_token');
    axios.get(`/api/classes/reflections/${classId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.data.success) {
          setConfusedList(r.data.confusedList);
          setTotalStudents(r.data.totalStudents);
        }
      })
      .catch(() => {});
  }, [user]);

  // ── Socket.io 연결 ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const classId = (user as any)?.class_id;
    if (!classId) return;

    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { userId: user.id, classId });
    });

    // 접속 시 기존 게시판 전달
    socket.on('candy_board_init', (initPosts: CandyPost[]) => {
      setPosts(initPosts);
    });

    // 새 글
    socket.on('candy_post_new', (post: CandyPost) => {
      setPosts(prev => [post, ...prev]);
    });

    // 하트 업데이트
    socket.on('candy_like_update', ({ postId, likes, likedBy }: { postId: number; likes: number; likedBy: number[] }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes, likedBy } : p));
    });

    return () => { socket.disconnect(); };
  }, [user]);

  // ── 캔디 던지기 ───────────────────────────────────────────────
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || sending || !socketRef.current) return;
    const classId = (user as any)?.class_id;
    if (!classId) return;
    setSending(true);
    socketRef.current.emit('candy_post', {
      classId,
      post: {
        text,
        avatarUrl: equippedAvatar,
        authorLabel: equippedAvatar ? (collection.find(i => i.is_equipped)?.Collection?.name || '야미') : '유리병',
      }
    });
    setInputText('');
    setSending(false);
  };

  // ── 하트 누르기 ───────────────────────────────────────────────
  const handleLike = (postId: number) => {
    if (!socketRef.current || !user) return;
    const classId = (user as any)?.class_id;
    socketRef.current.emit('candy_like', { classId, postId, userId: user.id });
  };

  const statCards = stats ? [
    { label: '전체 수강생', value: `${stats.totalStudents}명`, icon: Users, color: 'text-brand-sky', bg: 'bg-brand-sky/10' },
    { label: '금일 회고 작성', value: `${stats.todayReflections}건`, icon: BarChart3, color: 'text-brand-mint', bg: 'bg-brand-mint/10' },
    { label: '중도이탈 위험군', value: `${stats.highRiskCount}명`, icon: AlertTriangle, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-10 space-y-8 font-brand-kor"
    >
      {/* ── 큰 배너: 우리반 confused 현황 ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
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
                  가 이것을 어려워하고 있어요!
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {confusedSummary.top.map((kw, i) => (
                    <span
                      key={i}
                      className="px-4 py-1.5 bg-white/15 rounded-full text-sm font-black text-white"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white/30 mt-3 font-medium">
                  최근 7일 회고 기준 · 전체 {totalStudents}명 중 {confusedList.length}명 응답
                </p>
              </>
            ) : (
              <p className="text-lg font-black text-white/60">
                아직 이번 주 회고 데이터가 없어요. 학생들이 회고를 작성하면 여기에 표시됩니다.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 강사/기관 전용 통계 카드 ─────────────────────────── */}
      {isInstructor && statCards.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="bg-white rounded-2xl border border-brand-surface p-5 shadow-sm"
            >
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-brand-primary mt-0.5">{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── 블라블라캔디 게시판 ───────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-yellow" />
          <h2 className="text-sm font-black text-brand-primary uppercase tracking-widest">블라블라 캔디</h2>
          <span className="text-[10px] text-brand-primary/30 font-bold">익명 · 실시간 공유</span>
        </div>

        {/* 입력창 */}
        <div className="bg-white rounded-2xl border-2 border-brand-surface p-4 shadow-sm flex items-end gap-3">
          {/* 내 아바타 */}
          <div className="w-10 h-10 shrink-0">
            {equippedAvatar ? (
              <img src={equippedAvatar} alt="avatar" className="w-full h-full object-contain" />
            ) : (
              <JarAvatar />
            )}
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="오늘 하루 어떠셨나요? 익명으로 캔디를 던져보세요 🍬"
            rows={2}
            className="flex-1 resize-none bg-brand-surface/50 rounded-xl px-4 py-3 text-sm text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium placeholder:text-brand-primary/30"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="px-4 py-3 bg-brand-primary text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow disabled:opacity-30 shrink-0"
          >
            <Send size={13} />
            캔디 던지기
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
                className="text-center py-16 text-brand-primary/20 font-black text-sm"
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
                  className="bg-white rounded-2xl border border-brand-surface p-5 shadow-sm flex items-start gap-4"
                >
                  {/* 아바타 */}
                  <div className="w-10 h-10 shrink-0">
                    {post.avatarUrl ? (
                      <img src={post.avatarUrl} alt="avatar" className="w-full h-full object-contain" />
                    ) : (
                      <JarAvatar />
                    )}
                  </div>

                  {/* 본문 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black text-brand-primary/40">{post.authorLabel}</span>
                      <span className="text-[10px] text-brand-primary/20 font-medium">
                        {new Date(post.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-brand-primary leading-relaxed">{post.text}</p>
                  </div>

                  {/* 하트 */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex flex-col items-center gap-0.5 shrink-0 transition-all ${liked ? 'text-brand-pink' : 'text-brand-primary/20 hover:text-brand-pink'}`}
                  >
                    <Heart size={18} className={liked ? 'fill-brand-pink' : ''} />
                    <span className="text-[10px] font-black">{post.likes}</span>
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
