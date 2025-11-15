import { PassengerType } from './types.js';
import { PASSENGER_TEMPLATES } from './PassengerTypes.js';
export class SocialSimulation {
    constructor() {
        this.interactionRadius = 100;
    }
    updatePassengers(passengers, deltaTime) {
        let totalStress = 0;
        for (const passenger of passengers) {
            this.updatePassengerState(passenger, passengers, deltaTime);
            totalStress += passenger.stress;
        }
        return totalStress;
    }
    updatePassengerState(passenger, allPassengers, deltaTime) {
        const template = PASSENGER_TEMPLATES[passenger.type];
        // Find nearby passengers
        const nearbyPassengers = this.getNearbyPassengers(passenger, allPassengers);
        // Apply trigger effects
        for (const nearby of nearbyPassengers) {
            const trigger = template.triggers.find(t => t.type === nearby.type);
            if (trigger) {
                passenger.stress = Math.max(0, Math.min(100, passenger.stress + trigger.stressModifier * deltaTime));
            }
            // Apply social energy from nearby passengers
            const nearbyTemplate = PASSENGER_TEMPLATES[nearby.type];
            passenger.mood = Math.max(0, Math.min(100, passenger.mood + nearbyTemplate.socialEnergy * deltaTime * 0.5));
        }
        // Special case: Couples must be together
        if (passenger.type === PassengerType.COUPLE_LEFT ||
            passenger.type === PassengerType.COUPLE_RIGHT) {
            const partnerType = passenger.type === PassengerType.COUPLE_LEFT
                ? PassengerType.COUPLE_RIGHT
                : PassengerType.COUPLE_LEFT;
            const partner = allPassengers.find(p => p.type === partnerType);
            if (partner) {
                const distance = Math.hypot(passenger.position.x - partner.position.x, passenger.position.y - partner.position.y);
                if (distance > 100) {
                    // Far from partner - stress increases!
                    passenger.stress = Math.min(100, passenger.stress + 10 * deltaTime);
                }
                else {
                    // Near partner - stress decreases
                    passenger.stress = Math.max(0, passenger.stress - 5 * deltaTime);
                }
            }
        }
        // Bubble violation check (personal space)
        const crowdCount = nearbyPassengers.filter(p => this.getDistance(passenger, p) < template.bubbleSize).length;
        if (crowdCount > 0) {
            passenger.stress = Math.min(100, passenger.stress + crowdCount * 2 * deltaTime);
        }
        // Natural stress and mood decay/recovery
        if (passenger.stress > 30) {
            passenger.mood = Math.max(0, passenger.mood - deltaTime * 2);
        }
        // Stress events based on thresholds
        if (passenger.stress > 70 && Math.random() < 0.01) {
            // Conflict event
            passenger.mood = Math.max(0, passenger.mood - 20);
        }
    }
    getNearbyPassengers(passenger, allPassengers) {
        return allPassengers.filter(p => {
            if (p.id === passenger.id)
                return false;
            const distance = this.getDistance(passenger, p);
            return distance < this.interactionRadius;
        });
    }
    getDistance(p1, p2) {
        return Math.hypot(p1.position.x - p2.position.x, p1.position.y - p2.position.y);
    }
    checkGameOver(passengers) {
        // Game over if too many passengers have critical stress
        const criticalStressCount = passengers.filter(p => p.stress >= 90).length;
        const lowMoodCount = passengers.filter(p => p.mood <= 10).length;
        return criticalStressCount >= 3 || lowMoodCount >= 4;
    }
}
