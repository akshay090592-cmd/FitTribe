import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidImageData, sanitizeString, addComment, createTribe } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { UserProfile } from '../types';

// Mock Supabase
vi.mock('../utils/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } }
            }),
        },
    },
    isSupabaseConfigured: vi.fn(() => true),
}));

describe('Input Validation & Sanitization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isValidImageData', () => {
        it('should return true for valid base64 image data', () => {
            expect(isValidImageData('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')).toBe(true);
            expect(isValidImageData('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=')).toBe(true);
        });

        it('should return false for invalid data', () => {
            expect(isValidImageData('')).toBe(false);
            expect(isValidImageData('not-an-image')).toBe(false);
            expect(isValidImageData('data:text/plain;base64,SGVsbG8=')).toBe(false);
            expect(isValidImageData('http://example.com/image.png')).toBe(false);
        });
    });

    describe('sanitizeString', () => {
        it('should trim and truncate strings', () => {
            expect(sanitizeString('  hello world  ', 5)).toBe('hello');
            expect(sanitizeString('too long string', 3)).toBe('too');
            expect(sanitizeString('short', 10)).toBe('short');
        });
    });

    describe('addComment', () => {
        it('should sanitize comment text and limit length', async () => {
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockReturnValue({ insert: insertMock });

            const mockProfile: UserProfile = {
                id: 'user-123',
                displayName: 'Panda',
                email: 'panda@example.com'
            };

            const longText = 'a'.repeat(600);
            await addComment('log-123', '  ' + longText + '  ', mockProfile);

            expect(insertMock).toHaveBeenCalled();
            const insertedData = insertMock.mock.calls[0][0];
            expect(insertedData.text).toHaveLength(500);
            expect(insertedData.text).toBe('a'.repeat(500));
        });

        it('should not insert if text is empty after sanitization', async () => {
            const insertMock = vi.fn();
            (supabase.from as any).mockReturnValue({ insert: insertMock });

            const mockProfile: UserProfile = {
                id: 'user-123',
                displayName: 'Panda',
                email: 'panda@example.com'
            };

            await addComment('log-123', '   ', mockProfile);
            expect(insertMock).not.toHaveBeenCalled();
        });
    });

    describe('createTribe', () => {
        it('should sanitize tribe name and limit length', async () => {
            const singleMock = vi.fn().mockResolvedValue({ data: { id: 't1', name: 'Tribe', code: 'CODE' }, error: null });
            const selectMock = vi.fn().mockReturnValue({ single: singleMock });
            const insertMock = vi.fn().mockReturnValue({ select: selectMock });
            (supabase.from as any).mockReturnValue({ insert: insertMock });

            const longName = 'T'.repeat(100);
            await createTribe('  ' + longName + '  ', 'user-123');

            expect(insertMock).toHaveBeenCalled();
            const insertedData = insertMock.mock.calls[0][0];
            expect(insertedData.name).toHaveLength(50);
            expect(insertedData.name).toBe('T'.repeat(50));
        });
    });
});
