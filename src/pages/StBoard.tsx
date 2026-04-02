import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MessageCircle, Heart, Send, Users, Sparkles, Trash2, Edit3, X, Check } from 'lucide-react';
import { Minty, Pinky, Goldy } from '../components/EmotionBuddies';

export default function StBoard() {
  const { user, classMood, candyPosts = [], addCandyPost, likeCandyPost, deleteCandyPost, editCandyPost, fetchBoard } = useStore();
  const [input, setInput] = useState('');
  const [editingId, setEditId] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const result = addCandyPost(input);
    if (!result.success) alert(result.message);
    else setInput('');
  };

  const handleSaveEdit = (id: number) => {
    if (!editInput.trim()) return;
    editCandyPost(id, editInput);
    setEditId(null);
  };

  // 🛡️ 방어 코드: classMood 데이터 누락 시 안전한 폴백 설정
  const safeMood = classMood || { message: "데이터를 불러오고 있어요.", description: "잠시만 기다려 주세요.", dominantEmotion: 'mint' };
  const MoodBuddy = safeMood.dominantEmotion === 'pink' ? Pinky : safeMood.dominantEmotion === 'yellow' ? Goldy : Minty;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 px-6 pt-12">
      {/* 📊 AI 그룹 요약 섹션 */}
      <section className="bg-white rounded-[3.5rem] p-10 border-2 border-brand-surface shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="flex-shrink-0">
            <MoodBuddy size={160} />
          </div>
          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              <Users size={14} /> Group Mental Health Report
            </div>
            <h2 className="text-4xl font-black text-brand-primary leading-tight">
              {safeMood.message}
            </h2>
            <p className="text-lg text-brand-primary/60 font-bold italic">“{safeMood.description}”</p>
          </div>
        </div>
        <Sparkles className="absolute -top-10 -right-10 text-brand-mint/10" size={250} />
      </section>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
           <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
              <MessageCircle size={24} />
           </div>
           <div>
              <h3 className="text-2xl font-black text-brand-primary">블라블라 캔디</h3>
              <p className="text-sm font-bold text-brand-primary/40">오늘의 학습 난이도나 기분을 자유롭게 나눠보세요.</p>
           </div>
        </div>

        <div className="bg-white p-5 rounded-[2.5rem] border-2 border-brand-surface shadow-xl flex flex-col md:flex-row gap-4 items-center">
           <input 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="오늘 수업 어떠셨나요? (예: React 생명주기 너무 어려워요!)"
             className="flex-1 w-full bg-brand-surface px-8 py-5 rounded-[1.5rem] text-base font-bold outline-none border-none focus:ring-2 ring-brand-primary/10 transition-all"
           />
           <button onClick={handleSubmit} className="w-full md:w-auto px-10 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-brand-primary/20">
             캔디 던지기 <Send size={20} />
           </button>
        </div>

        <div className="space-y-4 mt-10">
          <AnimatePresence mode="popLayout">
            {Array.isArray(candyPosts) && candyPosts.map((post) => (
              <motion.div key={post.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group bg-white hover:bg-brand-bg/50 px-10 py-6 rounded-[2rem] border border-brand-surface flex items-center justify-between gap-6 transition-all shadow-sm">
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${post.color === 'mint' ? 'bg-brand-mint' : post.color === 'pink' ? 'bg-brand-pink' : 'bg-brand-yellow'} shadow-lg`} />
                  {editingId === post.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input value={editInput} onChange={(e) => setEditInput(e.target.value)} className="flex-1 bg-white border-2 border-brand-primary/20 px-4 py-2 rounded-xl font-bold" autoFocus />
                      <button onClick={() => handleSaveEdit(post.id)} className="text-brand-mint"><Check size={24} /></button>
                      <button onClick={() => setEditId(null)} className="text-brand-pink"><X size={24} /></button>
                    </div>
                  ) : (
                    <p className="text-brand-primary font-bold text-lg">{post.text}</p>
                  )}
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-[10px] font-black text-brand-primary/20 uppercase">{post.timestamp}</span>
                  <button onClick={() => likeCandyPost(post.id)} className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl border border-brand-surface hover:scale-110 transition-all shadow-sm">
                    <Heart size={18} className={post.likedBy?.includes(user?.id || 0) ? 'text-brand-pink fill-brand-pink' : 'text-brand-primary/20'} />
                    <span className="text-sm font-black">{post.likes}</span>
                  </button>
                  {user?.id === post.userId && (
                    <div className="flex items-center gap-3 border-l pl-6 border-brand-surface">
                      <button onClick={() => { setEditId(post.id); setEditInput(post.text); }} className="text-brand-primary/30 hover:text-brand-primary"><Edit3 size={18} /></button>
                      <button onClick={() => deleteCandyPost(post.id)} className="text-brand-primary/30 hover:text-brand-pink"><Trash2 size={18} /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
