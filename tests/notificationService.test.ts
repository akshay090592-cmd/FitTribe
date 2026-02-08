
import { describe, it, expect, vi, Mock } from 'vitest';
import { notifyTribeOnActivity } from '../services/notificationService';

// Mock getTribeMembers
vi.mock('../utils/storage', () => ({
  getTribeMembers: vi.fn(),
}));

import { getTribeMembers } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';

// Mock the supabase client
vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'mock-user-id' }, error: null }),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('Notification Service', () => {
  it('should notify all tribe members except the actor', async () => {
    const actor = 'User1';
    const activity = 'workout';

    // Mock tribe members
    const members = [
      { id: '1', displayName: 'User1' },
      { id: '2', displayName: 'User2' },
      { id: '3', displayName: 'User3' }
    ];
    (getTribeMembers as Mock).mockResolvedValue(members);

    const consoleSpy = vi.spyOn(console, 'log');

    await notifyTribeOnActivity(actor, activity, 'tribe-123');

    // Should notify 2 members
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    // Check that the actor is not notified
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`Sending notification to ${actor}`)
    );

    // Check that other users are notified
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Sending notification to User2`)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Sending notification to User3`)
    );

    consoleSpy.mockRestore();
  });

  it('should include image data in notification if provided', async () => {
    const actor = 'User1';
    const activity = 'workout';
    const imageData = 'base64_encoded_image_data';

    // Mock tribe members
    const members = [
      { id: '1', displayName: 'User1' },
      { id: '2', displayName: 'User2' }
    ];
    (getTribeMembers as Mock).mockResolvedValue(members);

    await notifyTribeOnActivity(actor, activity, 'tribe-123', imageData);

    // Verify supabase insert call includes image_data
    expect(supabase.from).toHaveBeenCalledWith('notifications');
    // The insert happens for each member except actor (User2)
    expect(supabase.from('notifications').insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(activity),
          image_data: imageData
        })
      ])
    );
  });
});
