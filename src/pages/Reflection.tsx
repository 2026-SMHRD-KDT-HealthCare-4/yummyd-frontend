import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Sparkles, Send, Info, Image as ImageIcon, Tag, X, Smile, Meh, Frown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Assets
import yummyPure from '../assets/yummyd_character_pure.png';
import yummyWink from '../assets/yummyd_character_wink.png';

const SUGGESTED_TAGS = [
  { label: ' 학습내용', value: '학습내용' },
  { label: ' 나의기분', value: '나의기분' },
  { label: ' 성과달성', value: '성과달성' },
  { label: ' 아이디어', value: '아이디어' },
  { label: ' 열정', value: '열정' },
  { label: ' 휴식', value: '휴식' },
];

export default function Reflection() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [emotionLevel, setEmotionLevel] = useState<number>(3); 
  const [analysisStep, setAnalysisStep] = useState(0); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, setAnalyzing, isAnalyzing, fetchHistory, emotions } = useStore();

  useEffect(() => {
    // 🛡️ 무한 로딩 방지 및 데이터 정합성 체크
    const checkStatus = async () => {
      if (isAnalyzing && user) {
        // 히스토리를 새로고침하여 최신 분석 결과가 있는지 확인
        await fetchHistory();
        
        // 최근 1분 이내에 완료된 분석이 있다면 로딩 해제
        const lastReflection = emotions[0];
        if (lastReflection && lastReflection.analysis_status === 'completed') {
          const finishedAt = new Date(lastReflection.updatedAt).getTime();
          if (Date.now() - finishedAt < 60000) {
            setAnalyzing(false);
          }
        }
      }
    };

    checkStatus();
    
    if (isAnalyzing) {
      const timer = setTimeout(() => setAnalyzing(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, user, fetchHistory, emotions, setAnalyzing]);

  const steps = [
    "야미가 당신의 이야기를 읽고 있어요...",
    "문장 속에서 감정 조각들을 찾는 중...",
    "오늘의 마음 사탕을 예쁘게 빚고 있어요!",
    "거의 다 됐어요! 유리병에 담는 중..."
  ];

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

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
            const MAX_WIDTH = 1200; // 품질 향상을 위해 약간 늘림
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setIsProcessing(false);
            resolve(dataUrl);
          } catch (err) {
            setIsProcessing(false);
            reject(err);
          }
        };
        img.onerror = () => {
          setIsProcessing(false);
          reject(new Error('이미지를 불러올 수 없습니다.'));
        };
      };
      reader.onerror = () => {
        setIsProcessing(false);
        reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processedData = await processImage(file);
        setSelectedImage(processedData);
      } catch (error: any) {
        alert(error.message || '이미지 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            const processedData = await processImage(file);
            setSelectedImage(processedData);
          } catch (error: any) {
            console.error('Paste error:', error);
          }
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const processedData = await processImage(file);
        setSelectedImage(processedData);
      } catch (error: any) {
        alert(error.message || '이미지 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const toggleTag = (tagValue: string) => {
    setTags(prev => 
      prev.includes(tagValue) 
        ? prev.filter(t => t !== tagValue) 
        : [...prev, tagValue]
    );
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !selectedImage) return;
    if (!user) return alert('로그인이 필요합니다.');

    try {
      // 1. 서버에 리플렉션 등록 요청 (비동기 분석 트리거)
      const response = await axios.post('/api/reflection', {
        userId: user.id,
        text: inputText,
        image: selectedImage,
        tags: tags,
        preEmotion: emotionLevel
      });

      if (response.data.success) {
        console.log('Submission successful, starting analysis UI...');
        setAnalyzing(true); // 전역 상태: 분석 중 UI 시작
        
        // 2. 사용자 경험을 위해 애니메이션 효과를 보여준 뒤 페이지 이동
        setTimeout(() => {
          navigate('/jar');
        }, 1500);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('회고 등록 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen">
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
                 {steps[analysisStep]}
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

      <motion.div 
        animate={{ filter: isAnalyzing ? 'blur(10px)' : 'blur(0px)', opacity: isAnalyzing ? 0.3 : 1 }}
        className="max-w-4xl mx-auto space-y-10 py-12 px-6"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="fixed inset-0 z-[50] bg-brand-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-brand-primary m-4 rounded-[3.5rem] pointer-events-none">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
              <ImageIcon size={48} className="text-brand-primary animate-bounce" />
              <p className="text-xl font-black text-brand-primary">여기에 이미지를 놓아주세요!</p>
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-brand-primary tracking-tighter italic">오늘 하루를 가장 잘 나타내는 사탕을 골라주세요</h2>
        </div>

        {/* Emotion Selector */}
        <div className="flex justify-center items-end gap-4 md:gap-8 py-4">
          {[
            { level: 1, color: 'bg-brand-pink', label: '매우 지침', icon: <Frown className="text-white" /> },
            { level: 2, color: 'bg-brand-pink/60', label: '조금 우울', icon: <Frown className="text-white/80" /> },
            { level: 3, color: 'bg-brand-yellow', label: '보통이에요', icon: <Meh className="text-white" /> },
            { level: 4, color: 'bg-brand-mint/60', label: '즐거워요', icon: <Smile className="text-white/80" /> },
            { level: 5, color: 'bg-brand-mint', label: '최고예요!', icon: <Smile className="text-white" /> },
          ].map((candy) => (
            <button
              key={candy.level}
              onClick={() => setEmotionLevel(candy.level)}
              className="group flex flex-col items-center gap-3 transition-all"
            >
              <motion.div
                whileHover={{ scale: 1.2, y: -10 }}
                className={`
                  ${candy.color} rounded-full flex items-center justify-center shadow-lg
                  ${emotionLevel === candy.level ? 'w-20 h-20 ring-4 ring-offset-4 ring-brand-primary scale-110' : 'w-14 h-14 opacity-40 grayscale-[0.5]'}
                  transition-all duration-300
                `}
              >
                {candy.icon}
              </motion.div>
              <span className={`text-xs font-black ${emotionLevel === candy.level ? 'text-brand-primary opacity-100' : 'text-brand-primary/30 opacity-0 group-hover:opacity-100'}`}>
                {candy.label}
              </span>
            </button>
          ))}
        </div>

        <div className={`
          bg-white rounded-[3.5rem] border-2 shadow-2xl overflow-hidden flex flex-col transition-all
          ${isDragging ? 'border-brand-primary ring-4 ring-brand-primary/10' : 'border-brand-primary/10'}
        `}>
          <textarea
            className="w-full p-10 outline-none text-xl font-medium leading-relaxed min-h-[350px] placeholder:text-brand-primary/40 resize-none"
            placeholder="이곳에 당신의 생각을 마음껏 펼쳐주세요... (이미지를 복사해서 붙여넣을 수도 있어요!)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={handlePaste}
          />

          <AnimatePresence>
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-10 pb-8 space-y-6"
              >
                {/* Image-Specific Tag Selection (Visible only when image exists) */}
                <div className="p-6 bg-brand-bg/40 rounded-[2rem] border border-brand-surface space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Tag size={16} className="text-brand-primary/60" />
                    <span className="text-[10px] font-black text-brand-primary/60 uppercase tracking-[0.2em]">
                      AI 이미지 분석을 위해 사진의 성격을 선택해주세요
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => toggleTag(tag.value)}
                        className={`
                          px-5 py-2.5 rounded-xl font-black text-xs transition-all
                          ${tags.includes(tag.value) 
                            ? 'bg-brand-primary text-white shadow-md scale-105' 
                            : 'bg-white border border-brand-surface text-brand-primary/40 hover:border-brand-primary/20'}
                        `}
                      >
                        #{tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative inline-block group">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded" 
                    className="max-h-64 rounded-2xl border-2 border-brand-surface object-cover shadow-lg"
                  />
                  <button 
                    onClick={() => {
                      setSelectedImage(null);
                      setTags([]); // 이미지가 사라지면 관련 태그도 초기화 (분류 데이터 정합성)
                    }}
                    className="absolute -top-2 -right-2 bg-brand-pink text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isProcessing && (
            <div className="px-10 pb-6 flex items-center gap-3 text-brand-primary font-black animate-pulse">
              <Sparkles size={20} />
              <span>이미지를 예쁘게 다듬는 중...</span>
            </div>
          )}

          <div className="p-8 border-t flex justify-between items-center bg-brand-bg/30">
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
             <button 
               onClick={() => fileInputRef.current?.click()} 
               disabled={isProcessing}
               className="flex items-center gap-2 px-6 py-3 bg-white border border-brand-surface text-brand-primary rounded-2xl font-black text-sm hover:bg-brand-surface transition-all disabled:opacity-50"
             >
               <ImageIcon size={20} /> 사진 추가
             </button>
             <span className="text-[10px] font-black text-brand-primary/20 uppercase tracking-widest">{inputText.length} Characters</span>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!inputText.trim() && !selectedImage)}
          className="w-full px-12 py-6 bg-brand-primary text-white rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
        >
          기록 완료하기 <Send size={24} className="inline ml-2" />
        </button>
      </motion.div>
    </div>
  );
}
