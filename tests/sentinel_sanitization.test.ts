
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProfile, sendGift, saveWorkoutFeedback, joinTribe } from '../utils/storage';
import { supabase, isSessionValid } from '../utils/supabaseClient';
import { UserProfile, GiftTransaction, WorkoutFeedback } from '../types';

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'tribe-1', name: 'Tribe', code: 'TRIBE1' }, error: null }),
  },
  isSupabaseConfigured: vi.fn(() => true),
  isSessionValid: vi.fn().mockResolvedValue(true),
}));

describe('Sentinel Sanitization & Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('joinTribe', () => {
    it('should return null for empty or whitespace code', async () => {
      expect(await joinTribe('')).toBeNull();
      expect(await joinTribe('   ')).toBeNull();
    });

    it('should trim and uppercase the code', async () => {
      await joinTribe('  tribe123  ');
      expect(supabase.from('tribes').select().eq).toHaveBeenCalledWith('code', 'TRIBE123');
    });
  });

  describe('createProfile', () => {
    it('should sanitize displayName', async () => {
      const longName = 'a'.repeat(100);
      await createProfile('user-1', 'test@test.com', longName, 'tribe-1', 'beginner');

      expect(supabase.from('profiles').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: 'a'.repeat(50)
        })
      );
    });
  });

  describe('sendGift', () => {
    it('should sanitize gift message', async () => {
      const longMessage = 'm'.repeat(600);
      const profile = { id: 'user-1' } as any;
      const transaction = { to: 'User2', message: longMessage } as any;

      // Mock online
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      await sendGift(profile, transaction);

      expect(supabase.from('gift_transactions').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'm'.repeat(500)
        })
      );
    });
  });

  describe('saveWorkoutFeedback', () => {
    it('should sanitize feedback notes', async () => {
      const longNotes = 'n'.repeat(600);
      const profile = { id: 'user-1' } as any;
      const feedback = { logId: 'log-1', notes: longNotes } as any;

      await saveWorkoutFeedback(feedback, profile);

      expect(supabase.from('workout_feedback').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_text: 'n'.repeat(500)
        })
      );
    });
  });
});
