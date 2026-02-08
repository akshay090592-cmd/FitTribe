// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { ActivityTrackerModal } from '../components/ActivityTrackerModal';
import { User } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock MET_VALUES to avoid dependency issues if any
vi.mock('../constants', async () => {
  const actual = await vi.importActual('../constants');
  return {
    ...actual,
    ACTIVITIES_LIST: ['Walking', 'Yoga', 'Running'],
    MET_VALUES: { 'Walking': 3.5, 'Yoga': 2.5, 'Running': 9.8 }
  };
});

describe('ActivityTrackerModal - Saved Activities', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();
  const user = 'TestUser';
  const userProfile = {
    displayName: user,
    weight: 75,
    height: 180,
    gender: 'male',
    dob: '1990-01-01',
    weeklyGoal: 3,
    id: 'user123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('allows saving a new favorite activity', async () => {
    render(
      <ActivityTrackerModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentUser={user}
        userProfile={userProfile as any}
      />
    );

    // 1. Set up an activity
    const activitySelect = screen.getByRole('combobox');
    fireEvent.change(activitySelect, { target: { value: 'Yoga' } });

    const durationInput = screen.getByDisplayValue('30');
    fireEvent.change(durationInput, { target: { value: '45' } });

    // 2. Click "Save as Favorite"
    const saveFavButton = screen.getByText(/Save as Favorite/i);
    fireEvent.click(saveFavButton);

    // 3. Enter name
    const nameInput = screen.getByPlaceholderText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Morning Flow' } });

    // 4. Click "+" to save
    const confirmSaveButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-plus'));
    // Lucide icons render as SVGs, finding by innerHTML or generic selector is tricky.
    // Let's rely on the fact it's the button next to the input.
    // Or we can query by icon class if we knew it, but lucide generates paths.
    // The button has a disabled state, let's look for that.

    // Better approach: Select by parent or sibling structure
    const plusBtn = nameInput.nextElementSibling;
    fireEvent.click(plusBtn!);

    // 5. Verify it appears in the list
    await waitFor(() => {
      expect(screen.getByText('Morning Flow')).toBeInTheDocument();
      expect(screen.getByText(/Yoga • 45m/i)).toBeInTheDocument();
    });

    // 6. Verify localStorage
    const stored = JSON.parse(localStorage.getItem(`saved_activities_${user}`) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Morning Flow');
    expect(stored[0].activity).toBe('Yoga');
    expect(stored[0].duration).toBe(45);
  });

  it('loads a favorite when clicked', async () => {
    // Pre-seed localStorage
    const favorite = {
      id: 'fav1',
      name: 'Power Run',
      activity: 'Running',
      duration: 60,
      intensity: 8
    };
    localStorage.setItem(`saved_activities_${user}`, JSON.stringify([favorite]));

    render(
      <ActivityTrackerModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentUser={user}
        userProfile={userProfile as any}
      />
    );

    // Initial state (defaults)
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // Default duration

    // Click the favorite
    const favChip = screen.getByText('Power Run');
    fireEvent.click(favChip);

    // Verify inputs updated
    await waitFor(() => {
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('Running');
    });
  });

  it('deletes a favorite', async () => {
    // Pre-seed
    const favorite = {
      id: 'fav1',
      name: 'Bad Routine',
      activity: 'Walking',
      duration: 10,
      intensity: 1
    };
    localStorage.setItem(`saved_activities_${user}`, JSON.stringify([favorite]));

    render(
      <ActivityTrackerModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentUser={user}
        userProfile={userProfile as any}
      />
    );

    expect(screen.getByText('Bad Routine')).toBeInTheDocument();

    // Find delete button (it's the X inside the chip)
    // The chip structure is: button > div(text) + div(delete)
    // The delete div has an onClick handler.
    const deleteBtn = screen.getByText('Bad Routine').parentElement?.parentElement?.querySelector('div[class*="rounded-full"]');

    // Using a more robust selector if possible.
    // The delete button is a div with an X icon.
    // Let's use the click handler directly on the element we can identify

    // In the code:
    // <div onClick={(e) => handleDeleteFavorite(fav.id, e)} ...> <X size={12} /> </div>
    // It's a sibling of the text container.

    const favText = screen.getByText('Bad Routine');
    const chip = favText.closest('button');
    const delButton = chip?.querySelector('div[class*="rounded-full"]');

    fireEvent.click(delButton!);

    await waitFor(() => {
      expect(screen.queryByText('Bad Routine')).not.toBeInTheDocument();
    });

    const stored = JSON.parse(localStorage.getItem(`saved_activities_${user}`) || '[]');
    expect(stored).toHaveLength(0);
  });
});
