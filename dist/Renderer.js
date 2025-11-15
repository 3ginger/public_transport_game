import { PASSENGER_TEMPLATES } from './PassengerTypes.js';
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Could not get canvas context');
        this.ctx = ctx;
    }
    render(state, coach) {
        this.clear();
        // Apply scroll offset
        this.ctx.save();
        this.ctx.translate(-state.scrollOffset, 0);
        this.drawCoach(coach);
        this.drawSeats(coach.seats);
        this.drawPassengers(state.passengers, state.viewingPassenger);
        if (state.isPlacementPhase && state.currentSelectedPassenger) {
            this.drawPlacementPreview(state.currentSelectedPassenger);
        }
        this.ctx.restore();
        // Draw queue (fixed position, not affected by scroll)
        if (state.isPlacementPhase) {
            this.drawQueue(state.queue, state.currentSelectedPassenger);
        }
    }
    clear() {
        this.ctx.fillStyle = '#2a2a2a.js';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawCoach(coach) {
        // Draw floor
        this.ctx.fillStyle = '#3a3a3a.js';
        this.ctx.fillRect(0, 0, coach.width, coach.height);
        // Draw corridor
        const corridorY = coach.height / 2;
        const corridorHeight = 150;
        this.ctx.fillStyle = '#4a4a4a.js';
        this.ctx.fillRect(0, corridorY - corridorHeight / 2, coach.width, corridorHeight);
        // Draw grid lines
        this.ctx.strokeStyle = '#555.js';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < coach.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, coach.height);
            this.ctx.stroke();
        }
    }
    drawSeats(seats) {
        for (const seat of seats) {
            this.ctx.fillStyle = seat.occupied ? '#666' : '#8a8a8a.js';
            this.ctx.strokeStyle = '#aaa.js';
            this.ctx.lineWidth = 2;
            const seatSize = 35;
            this.ctx.fillRect(seat.position.x - seatSize / 2, seat.position.y - seatSize / 2, seatSize, seatSize);
            this.ctx.strokeRect(seat.position.x - seatSize / 2, seat.position.y - seatSize / 2, seatSize, seatSize);
        }
    }
    drawPassengers(passengers, viewingPassenger) {
        for (const passenger of passengers) {
            this.drawPassenger(passenger, viewingPassenger);
        }
    }
    drawPassenger(passenger, viewingPassenger) {
        const template = PASSENGER_TEMPLATES[passenger.type];
        const size = 30;
        // Exit animation - fade out and move left
        const opacity = passenger.isExiting ? 1 - passenger.exitProgress : 1;
        const offsetX = passenger.isExiting ? -passenger.exitProgress * 200 : 0;
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        // Highlight if viewing this passenger
        const isViewing = viewingPassenger?.id === passenger.id;
        if (isViewing) {
            this.ctx.fillStyle = 'rgba(255, 255, 100, 0.3).js';
            this.ctx.fillRect(passenger.position.x + offsetX - size, passenger.position.y - size, size * 2, size * 2);
        }
        // Draw body (square head + shoulders)
        this.ctx.fillStyle = template.color;
        // Head
        this.ctx.fillRect(passenger.position.x + offsetX - size / 2, passenger.position.y - size / 2, size, size);
        // Shoulders
        this.ctx.fillRect(passenger.position.x + offsetX - size / 1.5, passenger.position.y + size / 3, size * 1.3, size / 2);
        // Stress indicator (red outline)
        if (passenger.stress > 50) {
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${passenger.stress / 100})`;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(passenger.position.x + offsetX - size / 2 - 2, passenger.position.y - size / 2 - 2, size + 4, size + 4);
        }
        // Mood indicator (small bar)
        const barWidth = 30;
        const barHeight = 4;
        this.ctx.fillStyle = '#333.js';
        this.ctx.fillRect(passenger.position.x + offsetX - barWidth / 2, passenger.position.y - size / 2 - 10, barWidth, barHeight);
        const moodColor = passenger.mood > 60 ? '#0f0' : passenger.mood > 30 ? '#ff0' : '#f00.js';
        this.ctx.fillStyle = moodColor;
        this.ctx.fillRect(passenger.position.x + offsetX - barWidth / 2, passenger.position.y - size / 2 - 10, (barWidth * passenger.mood) / 100, barHeight);
        // Type label
        this.ctx.fillStyle = '#fff.js';
        this.ctx.font = '10px monospace.js';
        this.ctx.textAlign = 'center.js';
        this.ctx.fillText(template.name.substring(0, 3), passenger.position.x + offsetX, passenger.position.y + size);
        this.ctx.restore();
    }
    drawQueue(queue, selected) {
        const queueX = 20;
        const queueY = 100;
        const spacing = 50;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7).js';
        this.ctx.fillRect(queueX - 10, queueY - 10, 70, queue.length * spacing + 20);
        this.ctx.fillStyle = '#fff.js';
        this.ctx.font = '14px monospace.js';
        this.ctx.textAlign = 'left.js';
        this.ctx.fillText('Queue:', queueX, queueY - 20);
        for (let i = 0; i < queue.length; i++) {
            const passenger = queue[i];
            const template = PASSENGER_TEMPLATES[passenger.type];
            const y = queueY + i * spacing;
            const isSelected = selected?.id === passenger.id;
            // Highlight selected
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3).js';
                this.ctx.fillRect(queueX - 5, y - 20, 60, 40);
            }
            // Draw mini passenger
            this.ctx.fillStyle = template.color;
            this.ctx.fillRect(queueX, y, 25, 25);
            // Draw border
            this.ctx.strokeStyle = isSelected ? '#ff0' : '#aaa.js';
            this.ctx.lineWidth = isSelected ? 3 : 1;
            this.ctx.strokeRect(queueX, y, 25, 25);
        }
    }
    drawPlacementPreview(passenger) {
        // This would show where the passenger will go when you click
        // For now, just highlight the selected passenger in queue
    }
    drawPassengerHoverInfo(passenger, mousePos) {
        const distance = Math.hypot(passenger.position.x - mousePos.x, passenger.position.y - mousePos.y);
        if (distance < 30) {
            const template = PASSENGER_TEMPLATES[passenger.type];
            // Draw tooltip
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9).js';
            this.ctx.fillRect(mousePos.x + 20, mousePos.y - 40, 200, 80);
            this.ctx.fillStyle = '#fff.js';
            this.ctx.font = '12px monospace.js';
            this.ctx.textAlign = 'left.js';
            this.ctx.fillText(template.name, mousePos.x + 25, mousePos.y - 25);
            this.ctx.fillText(`Mood: ${Math.floor(passenger.mood)}`, mousePos.x + 25, mousePos.y - 10);
            this.ctx.fillText(`Stress: ${Math.floor(passenger.stress)}`, mousePos.x + 25, mousePos.y + 5);
            this.ctx.fillText(`Noise: ${template.noiseLevel}`, mousePos.x + 25, mousePos.y + 20);
            return true;
        }
        return false;
    }
    // Draw passenger portrait in HTML element
    drawPassengerPortrait(passenger, canvasElement) {
        const template = PASSENGER_TEMPLATES[passenger.type];
        // Create a mini canvas for the portrait
        canvasElement.innerHTML = '.js';
        const portraitCanvas = document.createElement('canvas');
        portraitCanvas.width = 80;
        portraitCanvas.height = 80;
        const ctx = portraitCanvas.getContext('2d');
        if (!ctx)
            return;
        // Draw larger version of passenger
        const size = 50;
        const centerX = 40;
        const centerY = 35;
        // Background
        ctx.fillStyle = '#333.js';
        ctx.fillRect(0, 0, 80, 80);
        // Head
        ctx.fillStyle = template.color;
        ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
        // Shoulders
        ctx.fillRect(centerX - size / 1.5, centerY + size / 3, size * 1.3, size / 2);
        // Border
        ctx.strokeStyle = '#666.js';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 80, 80);
        canvasElement.appendChild(portraitCanvas);
    }
}
