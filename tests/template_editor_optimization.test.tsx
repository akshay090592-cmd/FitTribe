import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateEditor, SORTED_AVAILABLE_EXERCISES } from '../components/TemplateEditor';
import { EXERCISE_MUSCLE_MAP } from '../utils/muscleMapping';

describe('TemplateEditor Optimization & Correctness', () => {
    it('should export SORTED_AVAILABLE_EXERCISES correctly sorted alphabetically', () => {
        expect(SORTED_AVAILABLE_EXERCISES.length).toBe(Object.keys(EXERCISE_MUSCLE_MAP).length);
        const expected = Object.keys(EXERCISE_MUSCLE_MAP).sort();
        expect(SORTED_AVAILABLE_EXERCISES).toEqual(expected);
    });

    it('should render TemplateEditor correctly and allow adding and saving an exercise template', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();

        render(<TemplateEditor onSave={onSave} onCancel={onCancel} />);

        // Set template name
        const nameInput = screen.getByPlaceholderText('e.g. Leg Day Destroyer');
        fireEvent.change(nameInput, { target: { value: 'Upper Body Power' } });

        // Select an exercise
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: SORTED_AVAILABLE_EXERCISES[0] } });

        // Click Add exercise button
        const addButton = select.nextElementSibling as HTMLButtonElement;
        fireEvent.click(addButton);

        // Verify exercise added to list (should appear in select option and in added exercises list)
        const exerciseElements = screen.getAllByText(SORTED_AVAILABLE_EXERCISES[0]);
        expect(exerciseElements.length).toBeGreaterThanOrEqual(2);

        // Click Save Template
        const saveButton = screen.getByText('Save Template');
        fireEvent.click(saveButton);

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Upper Body Power',
            exercises: expect.arrayContaining([
                expect.objectContaining({ name: SORTED_AVAILABLE_EXERCISES[0], sets: 3, reps: '8-12' })
            ])
        }));
    });

    it('benchmarks static module export against un-hoisted Object.keys().sort()', () => {
        const iterations = 100000;

        // Un-hoisted simulation
        const startUnhoisted = performance.now();
        for (let i = 0; i < iterations; i++) {
            const list = Object.keys(EXERCISE_MUSCLE_MAP).sort();
            if (list.length === 0) throw new Error();
        }
        const unhoistedTime = performance.now() - startUnhoisted;

        // Hoisted access
        const startHoisted = performance.now();
        for (let i = 0; i < iterations; i++) {
            const list = SORTED_AVAILABLE_EXERCISES;
            if (list.length === 0) throw new Error();
        }
        const hoistedTime = performance.now() - startHoisted;

        console.log(`TEMPLATE EDITOR BENCHMARK (${iterations} iterations): Hoisted took ${hoistedTime.toFixed(3)}ms vs Unhoisted took ${unhoistedTime.toFixed(3)}ms`);

        expect(hoistedTime).toBeLessThan(unhoistedTime);
    });
});
