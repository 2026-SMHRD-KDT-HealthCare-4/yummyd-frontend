/* data폴더와 동일하게 임시로 작업을 위한 로직 함수를 저장하기 위한 공간 */
import { MOCK_ITEMS } from '../data/Avatar';

const RATE = {
  common: 60,
  rare: 25,
  unique: 10,
  epic: 5
};

const getRandomGrade = () => {
  const rand = Math.random() * 100;

  if (rand < RATE.common) return "common";
  if (rand < RATE.common + RATE.rare) return "rare";
  if (rand < RATE.common + RATE.rare + RATE.unique) return "unique";
  return "epic";
};

export const fakeDraw = (collection: { id: number }[]) => {
  const ownedIds = collection.map(i => i.id);

  // 보유하지 않은 아바타만 필터
  const available = MOCK_ITEMS.filter(item => !ownedIds.includes(item.id));

  if (available.length === 0) {
    return { success: false, message: "모든 아바타를 이미 가지고 있어요!" };
  }

  const grade = getRandomGrade();

  let pool = available.filter(item => item.grade === grade);

  if (pool.length === 0) {
    pool = available;
  }

  const item = pool[Math.floor(Math.random() * pool.length)];

  return { success: true, item };
};