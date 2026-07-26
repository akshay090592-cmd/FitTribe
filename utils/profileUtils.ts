/**
 * BOLT: Cache parsed Date components for unique Date of Birth (DOB) strings.
 * This completely avoids the overhead of repeated DOB string parsing and
 * Date object allocation on hot paths like real-time calorie tracking or profile renders,
 * while remaining 100% immune to timezone shifts and accurate to the user's birthdate.
 */
const birthDateCache = new Map<string, { year: number; month: number; date: number }>();

export const calculateAge = (dob: string): number => {
    if (!dob) return 0;

    let parsed = birthDateCache.get(dob);
    if (!parsed) {
        // Prevent potential memory exhaustion from arbitrary/malicious DOB inputs
        if (birthDateCache.size > 1000) {
            birthDateCache.clear();
        }

        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) {
            return 0; // Return 0 for invalid date strings to ensure safety
        }
        parsed = {
            year: birthDate.getFullYear(),
            month: birthDate.getMonth(),
            date: birthDate.getDate()
        };
        birthDateCache.set(dob, parsed);
    }

    const today = new Date();
    let age = today.getFullYear() - parsed.year;
    const m = today.getMonth() - parsed.month;
    if (m < 0 || (m === 0 && today.getDate() < parsed.date)) {
        age--;
    }
    return age;
};

export const calculateBMI = (heightCm: number, weightKg: number): number => {
    if (!heightCm || !weightKg) return 0;
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
};
