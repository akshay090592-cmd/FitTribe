import { UserProfile } from '../types';
import { calculateAge } from './profileUtils';

/**
 * Calculates calories burned using the Mifflin-St Jeor Equation for BMR if profile data is available.
 * Fallback to standard MET * Weight * Duration formula.
 * 
 * Mifflin-St Jeor Equation:
 * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 * 
 * Calories = ((BMR / 24) * MET) * Duration_in_hours
 */
export const calculateCalories = (
    userProfile: UserProfile | null,
    met: number,
    durationMinutes: number
): number => {
    if (!durationMinutes) return 0;

    const durationHours = durationMinutes / 60;
    const weight = userProfile?.weight || 70; // Default 70kg

    // If we have full profile data, use BMR
    if (userProfile && userProfile.height && userProfile.weight && userProfile.dob && userProfile.gender) {
        const age = calculateAge(userProfile.dob);
        let bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * age);

        if (userProfile.gender === 'male') {
            bmr += 5;
        } else {
            bmr -= 161;
        }

        // BMR is calories burned at rest in 24 hours.
        // Calories/Hour at rest = BMR / 24
        // METs is a multiple of BMR/hour.
        // So Calories = (BMR / 24) * MET * Hours
        const bmrPerHour = bmr / 24;
        return Math.round(bmrPerHour * met * durationHours);
    }

    // Fallback: Standard Formula: Calories = MET * Weight (kg) * Duration (hours)
    // Note: The standard formula often implies 1 MET = 1 kcal/kg/hour, which is an approximation.
    return Math.round(met * weight * durationHours);
};
