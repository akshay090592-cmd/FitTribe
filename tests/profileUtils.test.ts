import { describe, it, expect } from 'vitest';
import { calculateAge, calculateBMI } from '../utils/profileUtils';

describe('profileUtils - calculateAge', () => {
    it('should correctly calculate age when birthday has already passed this year', () => {
        const today = new Date();
        const birthYear = today.getFullYear() - 30;
        // Make birth month earlier than today
        const birthMonth = today.getMonth() === 0 ? 0 : today.getMonth() - 1;
        const birthDay = 15;

        const dobString = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

        // Expected age: 30 if birthday passed
        const calculatedAge = calculateAge(dobString);
        expect(calculatedAge).toBe(30);
    });

    it('should correctly calculate age when birthday has not occurred yet this year', () => {
        const today = new Date();
        const birthYear = today.getFullYear() - 30;
        // Make birth month later than today
        const birthMonth = today.getMonth() === 11 ? 11 : today.getMonth() + 1;
        const birthDay = 15;

        const dobString = `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

        // Expected age: 29 if birthday has not passed
        const calculatedAge = calculateAge(dobString);
        expect(calculatedAge).toBe(29);
    });

    it('should handle leap year birthdates correctly', () => {
        // Test with a leap year date
        const dobString = '2000-02-29';
        const birthDate = new Date('2000-02-29');
        const today = new Date();

        let expectedAge = today.getFullYear() - 2000;
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            expectedAge--;
        }

        expect(calculateAge(dobString)).toBe(expectedAge);
    });

    it('should return 0 safely for invalid date strings', () => {
        expect(calculateAge('')).toBe(0);
        expect(calculateAge('not-a-date')).toBe(0);
    });

    it('should use the cache for successive calls of the same DOB and perform highly efficiently', () => {
        const dob = '1985-06-15';

        // Warmup / First call
        const age1 = calculateAge(dob);

        // Successive call
        const age2 = calculateAge(dob);
        expect(age2).toBe(age1);

        // Benchmark performance
        const iterations = 10000;
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            calculateAge(dob);
        }
        const elapsed = performance.now() - start;
        console.log(`BENCHMARK: 10,000 calls to calculateAge took ${elapsed.toFixed(3)}ms`);
        expect(elapsed).toBeLessThan(50); // Cache should make it lightning fast
    });
});

describe('profileUtils - calculateBMI', () => {
    it('should correctly calculate BMI', () => {
        expect(calculateBMI(180, 75)).toBe(23.1);
        expect(calculateBMI(165, 55)).toBe(20.2);
    });

    it('should return 0 for invalid inputs', () => {
        expect(calculateBMI(0, 70)).toBe(0);
        expect(calculateBMI(170, 0)).toBe(0);
    });
});
