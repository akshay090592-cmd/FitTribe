import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AICoachService } from '../services/aiCoach';
import { WorkoutType, UserProfile, WorkoutLog, WeeklyPlan } from '../types';

// Mock GoogleGenAI class properly
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        models = {
            generateContent: mockGenerateContent
        };
        // Mock getGenerativeModel if needed, but the service uses ai.models.generateContent or ai.getGenerativeModel()...
        // Let's check the service usage again. Service uses `ai.models.generateContent({ model: ..., contents: ... })`
        // So the mock above is correct for the current implementation.
    }
}));


describe('AICoachService', () => {
    // Mock Data
    const mockProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'TestUser' as any,
        goals: { primary_goal: 'Strength', stress_level: 'Low' }
    };

    const mockLog: WorkoutLog = {
        id: 'log-1',
        date: new Date().toISOString(),
        user: 'TestUser' as any,
        type: WorkoutType.A,
        exercises: [],
        durationMinutes: 45
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should include adherence context in weekly check-in intro', () => {
        const previousPlan: WeeklyPlan = {
            summary: 'Old plan',
            schedule: [
                { day: 'Monday', activity: 'A', status: 'done', date: '', type: 'A', notes: '' },
                { day: 'Tuesday', activity: 'B', status: 'not_done', date: '', type: 'B', notes: '' }
            ]
        };

        const message = AICoachService.startWeeklyCheckin(mockProfile, mockLog, previousPlan);
        expect(message.text).toContain('you completed 1 out of 2 scheduled tasks');
        expect(message.text).toContain("Let's talk about what made it difficult");
    });

    it('should generate a weekly plan and include previous plan in prompt', async () => {
        const assessment = { stress: 'High', energy: 'Low' };
        const previousPlan: WeeklyPlan = {
            summary: 'Old plan',
            schedule: [
                { day: 'Monday', activity: 'A', status: 'not_done', date: '', type: 'A', notes: '' }
            ]
        };

        const mockWeeklyPlan = {
            summary: 'Optimized week',
            schedule: [{ day: 'Monday', activity: 'Walking', type: 'CARDIO', date: '2023-10-30', status: null, notes: '' }]
        };

        mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockWeeklyPlan) });

        const result = await AICoachService.generatePlanFromContext(mockProfile, assessment, previousPlan);

        expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
            contents: expect.stringContaining('PREVIOUS PLAN ADHERENCE')
        }));
        expect(result).toEqual(mockWeeklyPlan);
    });

    it('should analyze user context correctly', async () => {
        const history = [
            { role: 'model' as const, text: 'How are you?' },
            { role: 'user' as const, text: 'I am stressed and tired.' }
        ];

        const mockAnalysis = {
            stress: 'High',
            energy: 'Low',
            constraints: 'None',
            physical: 'Tired'
        };

        mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockAnalysis) });

        const result = await AICoachService.analyzeUserContext(history);

        expect(result).toEqual(mockAnalysis);
    });


    it('should parse diet plan action from chat response', async () => {
        const dietAction = { type: 'SAVE_DIET', payload: { days: [] } };
        const aiResponse = `Here is your plan. <ACTION_SAVE_DIET>${JSON.stringify(dietAction.payload)}</ACTION_SAVE_DIET>`;

        mockGenerateContent.mockResolvedValue({ text: aiResponse });

        const result = await AICoachService.chatWithCoach([], 'Make me a diet plan');

        expect(result.text).toContain('*(Diet Plan Generated)*');
        expect(result.action).toEqual(dietAction);
    });

    it('should parse custom workout action from chat response', async () => {
        const workoutAction = { type: 'SAVE_WORKOUT', payload: { id: 'Custom', exercises: [] } };
        const aiResponse = `Here is your workout. <ACTION_SAVE_WORKOUT>${JSON.stringify(workoutAction.payload)}</ACTION_SAVE_WORKOUT>`;

        mockGenerateContent.mockResolvedValue({ text: aiResponse });

        const result = await AICoachService.chatWithCoach([], 'Make me a workout');

        expect(result.text).toContain('*(Custom Workout Created)*');
        expect(result.action).toEqual(workoutAction);
    });

    it('should include last logs in system prompt', async () => {
        mockGenerateContent.mockResolvedValue({ text: 'Response' });

        const logs = [mockLog];
        await AICoachService.chatWithCoach([], 'Hi', undefined, logs);

        expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
            contents: expect.arrayContaining([
                expect.objectContaining({
                    parts: expect.arrayContaining([
                        expect.objectContaining({
                            text: expect.stringContaining('Last 5 Workouts')
                        })
                    ])
                })
            ])
        }));
    });
});
