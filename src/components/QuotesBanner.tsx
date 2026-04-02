import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const quotes = [
  "“가장 큰 위험은 위험을 감수하지 않는 것이다.” - 마크 저커버그",
  "“성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 계속 나아가는 용기다.” - 윈스턴 처칠",
  "“오늘 할 수 있는 일을 내일로 미루지 마라.” - 벤자민 프랭클린",
];

export default function QuotesBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 8000); // 2초 전환 + 6초 대기 = 총 8초 간격
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full overflow-hidden bg-brand-bg py-5 border-y border-brand-primary/0 flex items-center justify-center min-h-[100px]">
      <div className="relative w-full max-w-5xl px-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 2, // 전환 속도 2배 느리게 (기존 1.5초 -> 3초)
              ease: "easeInOut",
            }}
            className="text-center"
          >
            <span className="text-brand-primary/80 font-black text-xl md:text-2xl tracking-tight block leading-relaxed">
              {quotes[index]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
