import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TribeVictoryPhoto } from '../components/TribeVictoryPhoto';
import { vi, describe, it, expect } from 'vitest';
import * as storage from '../utils/storage';

// Mock dependencie
vi.mock('../utils/storage', () => ({
    getLatestTribePhoto: vi.fn(),
}));

describe('TribeVictoryPhoto Component', () => {

    it('renders nothing when no photo is returned', async () => {
        (storage.getLatestTribePhoto as any).mockResolvedValue(null);
        const { container } = render(<TribeVictoryPhoto />);

        // Should be empty initially
        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });

    it('renders the photo card when data exists', async () => {
        const mockPhoto = {
            id: '1',
            userId: 'user-123',
            userName: 'PandaKing',
            imageData: 'data:image/png;base64,fake',
            createdAt: new Date().toISOString()
        };

        (storage.getLatestTribePhoto as any).mockResolvedValue(mockPhoto);
        render(<TribeVictoryPhoto />);

        await waitFor(() => {
            expect(screen.getByText('PandaKing')).toBeDefined();
            expect(screen.getByText('Latest Victory')).toBeDefined();
            const img = screen.getByAltText('Victory');
            expect(img).toBeDefined();
            expect(img.getAttribute('src')).toBe(mockPhoto.imageData);
        });
    });
});
