import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TribeVictoryPhoto } from '../components/TribeVictoryPhoto';
import { getThemePalette } from '../utils/themeConfig';
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

    it('renders the empty spotlight CTA when showEmptyCta is true and no photo exists', async () => {
        (storage.getLatestTribePhoto as any).mockResolvedValue(null);
        render(
            <TribeVictoryPhoto
                showEmptyCta={true}
                themeId="volcano"
                userProfile={{ id: 'u1', displayName: 'PandaKing', email: 'p@test.com' }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Claim the Tribe Victory Spotlight!')).toBeDefined();
            expect(screen.getByText('Snap Victory Pic')).toBeDefined();
        });
    });

    it('renders the photo card when data exists and supports hype reactions', async () => {
        const mockPhoto = {
            id: '1',
            userId: 'user-123',
            userName: 'PandaKing',
            imageData: 'data:image/png;base64,fake',
            createdAt: new Date().toISOString()
        };

        (storage.getLatestTribePhoto as any).mockResolvedValue(mockPhoto);
        render(<TribeVictoryPhoto themeId="jungle_night" />);

        await waitFor(() => {
            expect(screen.getByText('PandaKing')).toBeDefined();
            expect(screen.getByText('Latest Victory')).toBeDefined();
            const img = screen.getByAltText('Victory');
            expect(img).toBeDefined();
            expect(img.getAttribute('src')).toBe(mockPhoto.imageData);
        });

        const hypeBtn = screen.getByText('Hype');
        fireEvent.click(hypeBtn);
        expect(screen.getByText('1 Hype')).toBeDefined();
    });

    it('portals the fullscreen lightbox modal to document.body above header and dock overlays', async () => {
        const mockPhoto = {
            id: '2',
            userId: 'user-123',
            userName: 'PandaKing',
            imageData: 'data:image/png;base64,fake',
            createdAt: new Date().toISOString()
        };

        (storage.getLatestTribePhoto as any).mockResolvedValue(mockPhoto);
        const { container } = render(
            <div className="animate-fade-in">
                <TribeVictoryPhoto
                    themeId="volcano"
                    userProfile={{ id: 'u1', displayName: 'Akshay', email: 'a@test.com' }}
                />
            </div>
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Expand victory photo')).toBeDefined();
        });

        fireEvent.click(screen.getByLabelText('Expand victory photo'));

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
        // Ensure the modal is portaled to document.body rather than trapped inside the .animate-fade-in container
        expect(container.contains(dialog)).toBe(false);
        expect(document.body.contains(dialog)).toBe(true);
        expect(screen.getByLabelText('Close fullscreen photo')).toBeDefined();
        expect(screen.getByText(/Send Hype/)).toBeDefined();
        expect(screen.getByText('Post New Pic')).toBeDefined();
    });

    it('provides distinct full-app theme palettes for all shop themes', () => {
        const def = getThemePalette('default');
        const night = getThemePalette('jungle_night');
        const volcano = getThemePalette('volcano');
        const deep = getThemePalette('deep_forest');

        expect(def.statusBarColor).toBe('#052e1e');
        expect(night.statusBarColor).toBe('#090d1e');
        expect(volcano.statusBarColor).toBe('#2a0808');
        expect(deep.statusBarColor).toBe('#032426');
    });
});
