
import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../utils/supabaseClient';
import { getLogs } from '../utils/storage';
import { User } from '../types';

describe('Production Integration Tests', () => {
    // Only run if environment variables are present
    const runTests = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_KEY;

    if (!runTests) {
        it('should skip tests if env vars are missing', () => {
            console.warn('Skipping production integration tests due to missing env vars');
        });
        return;
    }

    it('should connect to Supabase and fetch logs', async () => {
        const { data, error } = await supabase.from('workout_logs').select('count').limit(1);
        expect(error).toBeNull();
        // data might be null if table is empty, but connection should be fine
        console.log('Supabase Connection Test Result:', { data, error });
    });

    it('should fetch logs using getLogs utility', async () => {
        // getLogs fetches all logs for the leaderboard/feed
        // This validates that the RLS policies (if any) allow reading
        // or that the public key works as expected.
        try {
            const logs = await getLogs();
            expect(Array.isArray(logs)).toBe(true);
            console.log(`Fetched ${logs.length} logs from production.`);
        } catch (error) {
            console.error('getLogs failed:', error);
            throw error;
        }
    });

    it('should query a specific user profile if it exists', async () => {
       // We'll check for 'TestUser' as he is likely to exist given the enum
       const { data, error } = await supabase
           .from('profiles')
           .select('*')
           .eq('display_name', 'TestUser')
           .maybeSingle(); // Use maybeSingle to avoid error if not found

       expect(error).toBeNull();
       if (data) {
           console.log('Found profile for TestUser:', data.id);
       } else {
           console.log('Profile for TestUser not found (might be expected in clean DB)');
       }
    });
});
