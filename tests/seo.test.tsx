import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from '../components/SEO';

describe('SEO Component', () => {
    it('normalizes relative canonical URLs and image URLs', async () => {
        const helmetContext = {};
        render(
            <HelmetProvider context={helmetContext}>
                <SEO
                    title="Test Page"
                    description="Test description"
                    url="/about"
                    image="assets/test.png"
                />
            </HelmetProvider>
        );

        await waitFor(() => {
            const canonical = document.querySelector('link[rel="canonical"]');
            expect(canonical?.getAttribute('href')).toBe('https://tribeworkout.netlify.app/about');
        });

        const ogImage = document.querySelector('meta[property="og:image"]');
        expect(ogImage?.getAttribute('content')).toBe('https://tribeworkout.netlify.app/assets/test.png');
    });

    it('normalizes absolute canonical URLs and trims trailing slashes', async () => {
        const helmetContext = {};
        render(
            <HelmetProvider context={helmetContext}>
                <SEO
                    title="Test Page"
                    description="Test description"
                    url="https://tribeworkout.netlify.app/blog/post-1/"
                    image="https://tribeworkout.netlify.app/assets/test.png"
                />
            </HelmetProvider>
        );

        await waitFor(() => {
            const canonical = document.querySelector('link[rel="canonical"]');
            expect(canonical?.getAttribute('href')).toBe('https://tribeworkout.netlify.app/blog/post-1');
        });

        const ogImage = document.querySelector('meta[property="og:image"]');
        expect(ogImage?.getAttribute('content')).toBe('https://tribeworkout.netlify.app/assets/test.png');
    });
});
