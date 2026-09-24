import { describe, it, expect } from 'vitest';
import { GIFT_IMAGE_MAP } from '../components/RewardsPage';
import { GIFT_ITEMS } from '../utils/gamification';

describe('RewardsPage Gift Image Optimization & Benchmark', () => {
  it('correctly maps gift item IDs to image paths via GIFT_IMAGE_MAP', () => {
    GIFT_ITEMS.forEach(gift => {
      expect(GIFT_IMAGE_MAP.get(gift.id)).toBe(gift.image);
    });
    expect(GIFT_IMAGE_MAP.get('non_existent_gift_id')).toBeUndefined();
  });

  it('benchmarks O(1) GIFT_IMAGE_MAP lookup against O(N) array .find() over 100,000 lookups', () => {
    const iterations = 100000;
    const testIds = GIFT_ITEMS.map(g => g.id).concat(['non_existent_1', 'non_existent_2']);

    // Unoptimized .find()
    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const id = testIds[i % testIds.length];
      const img = GIFT_ITEMS.find(g => g.id === id)?.image;
    }
    const durationUnopt = performance.now() - startUnopt;

    // Optimized Map lookup
    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      const id = testIds[i % testIds.length];
      const img = GIFT_IMAGE_MAP.get(id);
    }
    const durationOpt = performance.now() - startOpt;

    console.log(`GIFT IMAGE LOOKUP BENCHMARK (${iterations} iterations): Map took ${durationOpt.toFixed(3)}ms vs Array .find() took ${durationUnopt.toFixed(3)}ms`);
    expect(durationOpt).toBeLessThan(durationUnopt);
  });
});
