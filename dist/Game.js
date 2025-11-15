import { PassengerType } from './types';
import { PASSENGER_TEMPLATES } from './PassengerTypes';
import { TrainCoach } from './TrainCoach';
import { SocialSimulation } from './SocialSimulation';
import { Renderer } from './Renderer';
export class Game {
    constructor(canvas) {
        this.lastTime = 0;
        this.touchStartX = 0;
        this.touchStartScrollOffset = 0;
        this.lastTouchPos = null;
        this.canvas = canvas;
        this.config = {
            canvasWidth: 1200,
            canvasHeight: 600,
            coachWidth: 2000,
            coachHeight: 600,
            seatRows: 15,
            seatsPerRow: 8,
            roundDuration: 30,
            initialQueueSize: 5,
            placementTimePerStation: 15,
        };
        this.coach = new TrainCoach(this.config.coachWidth, this.config.coachHeight, this.config.seatRows, this.config.seatsPerRow);
        this.simulation = new SocialSimulation();
        this.renderer = new Renderer(canvas);
        this.state = {
            stationNumber: 1,
            totalStress: 0,
            passengers: [],
            queue: [],
            seats: this.coach.seats,
            isPlacementPhase: true,
            roundTimer: this.config.placementTimePerStation,
            currentSelectedPassenger: null,
            viewingPassenger: null,
            gameOver: false,
            scrollOffset: 0,
        };
        this.setupEventListeners();
        this.startStation();
    }
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        // Profile close button
        const closeBtn = document.getElementById('closeProfile');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePassengerProfile());
        }
        // Keyboard for scrolling
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.state.scrollOffset = Math.max(0, this.state.scrollOffset - 50);
            }
            else if (e.key === 'ArrowRight') {
                const maxScroll = this.config.coachWidth - this.config.canvasWidth;
                this.state.scrollOffset = Math.min(maxScroll, this.state.scrollOffset + 50);
            }
        });
        // Mouse wheel for scrolling
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const maxScroll = this.config.coachWidth - this.config.canvasWidth;
            this.state.scrollOffset = Math.max(0, Math.min(maxScroll, this.state.scrollOffset + e.deltaY * 0.5));
        });
        // Resize handler for mobile
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartScrollOffset = this.state.scrollOffset;
        const rect = this.canvas.getBoundingClientRect();
        this.lastTouchPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    }
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = this.touchStartX - touch.clientX;
        const maxScroll = this.config.coachWidth - this.config.canvasWidth;
        this.state.scrollOffset = Math.max(0, Math.min(maxScroll, this.touchStartScrollOffset + deltaX));
    }
    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.lastTouchPos)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const x = this.lastTouchPos.x + this.state.scrollOffset;
        const y = this.lastTouchPos.y;
        this.handleClickAt(x, y, this.lastTouchPos.x, this.lastTouchPos.y);
        this.lastTouchPos = null;
    }
    handleResize() {
        const container = document.getElementById('gameContainer');
        if (!container)
            return;
        const maxWidth = Math.min(1200, window.innerWidth);
        const maxHeight = Math.min(600, window.innerHeight);
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
    }
    handleClick(e) {
        if (this.state.gameOver)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.state.scrollOffset;
        const y = e.clientY - rect.top;
        this.handleClickAt(x, y, e.clientX - rect.left, e.clientY - rect.top);
    }
    handleClickAt(worldX, worldY, screenX, screenY) {
        if (this.state.gameOver)
            return;
        // Check if clicking on queue during placement phase
        if (this.state.isPlacementPhase && screenX < 100 && screenY > 80) {
            const queueIndex = Math.floor((screenY - 100) / 50);
            if (queueIndex >= 0 && queueIndex < this.state.queue.length) {
                this.state.currentSelectedPassenger = this.state.queue[queueIndex];
                this.state.viewingPassenger = this.state.currentSelectedPassenger;
                this.updatePassengerProfile(this.state.currentSelectedPassenger);
                return;
            }
        }
        // Check if clicking on existing passenger (view profile)
        for (const passenger of this.state.passengers) {
            const distance = Math.hypot(passenger.position.x - worldX, passenger.position.y - worldY);
            if (distance < 30) {
                this.state.viewingPassenger = passenger;
                this.updatePassengerProfile(passenger);
                return;
            }
        }
        // Place passenger if one is selected during placement phase
        if (this.state.isPlacementPhase && this.state.currentSelectedPassenger) {
            this.placePassenger({ x: worldX, y: worldY });
        }
    }
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.state.scrollOffset;
        const y = e.clientY - rect.top;
        // Show info on hover
        for (const passenger of this.state.passengers) {
            if (this.renderer.drawPassengerHoverInfo(passenger, { x, y })) {
                break;
            }
        }
    }
    placePassenger(position) {
        if (!this.state.currentSelectedPassenger)
            return;
        const passenger = this.state.currentSelectedPassenger;
        // Check if clicking on a seat
        const seat = this.coach.findNearestSeat(position);
        if (seat) {
            // Place on seat
            passenger.position = { ...seat.position };
            passenger.isSeated = true;
            this.coach.occupySeat(seat, passenger.id);
        }
        else if (this.coach.isValidStandingPosition(position)) {
            // Place standing
            passenger.position = { ...position };
            passenger.isSeated = false;
        }
        else {
            // Invalid position
            return;
        }
        // Add to passengers and remove from queue
        this.state.passengers.push(passenger);
        this.state.queue = this.state.queue.filter(p => p.id !== passenger.id);
        this.state.currentSelectedPassenger = null;
        // Auto-select next in queue
        if (this.state.queue.length > 0) {
            this.state.currentSelectedPassenger = this.state.queue[0];
            this.updatePassengerProfile(this.state.currentSelectedPassenger);
        }
        else {
            this.hidePassengerProfile();
        }
    }
    startStation() {
        // Generate new queue
        const queueSize = this.config.initialQueueSize + Math.floor(this.state.stationNumber / 2);
        this.state.queue = this.generateQueue(queueSize);
        this.state.isPlacementPhase = true;
        this.state.roundTimer = this.config.placementTimePerStation;
        if (this.state.queue.length > 0) {
            this.state.currentSelectedPassenger = this.state.queue[0];
            this.updatePassengerProfile(this.state.currentSelectedPassenger);
        }
    }
    generateQueue(size) {
        const queue = [];
        const types = Object.values(PassengerType);
        // Ensure couples come together
        let addCouple = false;
        if (Math.random() < 0.3 && size >= 2) {
            addCouple = true;
            size -= 2;
        }
        for (let i = 0; i < size; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            queue.push(this.createPassenger(type));
        }
        if (addCouple) {
            queue.push(this.createPassenger(PassengerType.COUPLE_LEFT));
            queue.push(this.createPassenger(PassengerType.COUPLE_RIGHT));
        }
        return queue;
    }
    createPassenger(type) {
        const template = PASSENGER_TEMPLATES[type];
        return {
            id: `passenger_${Date.now()}_${Math.random()}`,
            type,
            position: { x: 0, y: 0 },
            mood: template.mood,
            stress: template.stress,
            socialEnergy: template.socialEnergy,
            noiseLevel: template.noiseLevel,
            smellLevel: template.smellLevel,
            bubbleSize: template.bubbleSize,
            isSeated: false,
            lastInteractionTime: 0,
            isExiting: false,
            exitProgress: 0,
        };
    }
    update(deltaTime) {
        if (this.state.gameOver)
            return;
        // Update exit animations
        this.updateExitAnimations(deltaTime);
        if (this.state.isPlacementPhase) {
            // Placement phase
            this.state.roundTimer -= deltaTime;
            if (this.state.roundTimer <= 0) {
                this.endPlacementPhase();
            }
        }
        else {
            // Simulation phase
            this.state.roundTimer -= deltaTime;
            // Update social simulation (only for non-exiting passengers)
            const activePassengers = this.state.passengers.filter(p => !p.isExiting);
            this.state.totalStress = this.simulation.updatePassengers(activePassengers, deltaTime);
            // Check game over
            if (this.simulation.checkGameOver(activePassengers)) {
                this.gameOver();
            }
            if (this.state.roundTimer <= 0) {
                this.nextStation();
            }
        }
        this.updateUI();
    }
    updateExitAnimations(deltaTime) {
        // Update exit progress for passengers who are leaving
        for (const passenger of this.state.passengers) {
            if (passenger.isExiting) {
                passenger.exitProgress += deltaTime * 2; // 0.5 second animation
            }
        }
        // Remove passengers who have finished exiting
        this.state.passengers = this.state.passengers.filter(p => {
            if (p.isExiting && p.exitProgress >= 1) {
                if (p.isSeated) {
                    this.coach.freeSeat(p.id);
                }
                // Clear viewing if this passenger was being viewed
                if (this.state.viewingPassenger?.id === p.id) {
                    this.state.viewingPassenger = null;
                    this.hidePassengerProfile();
                }
                return false;
            }
            return true;
        });
    }
    endPlacementPhase() {
        // Auto-place remaining queue randomly (they rush in)
        for (const passenger of this.state.queue) {
            const randomX = Math.random() * (this.config.coachWidth - 200) + 100;
            const randomY = this.config.coachHeight / 2 + (Math.random() - 0.5) * 100;
            passenger.position = { x: randomX, y: randomY };
            passenger.isSeated = false;
            this.state.passengers.push(passenger);
        }
        this.state.queue = [];
        this.state.isPlacementPhase = false;
        this.state.roundTimer = this.config.roundDuration;
        this.state.currentSelectedPassenger = null;
        this.hidePassengerProfile();
    }
    nextStation() {
        this.state.stationNumber++;
        // Mark some random passengers to exit with animation
        const activePassengers = this.state.passengers.filter(p => !p.isExiting);
        const exitCount = Math.min(Math.floor(Math.random() * 3) + 1, activePassengers.length);
        for (let i = 0; i < exitCount; i++) {
            const exitIndex = Math.floor(Math.random() * activePassengers.length);
            const passenger = activePassengers[exitIndex];
            passenger.isExiting = true;
            passenger.exitProgress = 0;
            activePassengers.splice(exitIndex, 1); // Remove from active list
        }
        this.startStation();
    }
    gameOver() {
        this.state.gameOver = true;
        alert(`Game Over! You made it to station ${this.state.stationNumber}`);
    }
    updateUI() {
        const stationEl = document.getElementById('stationNumber');
        const stressEl = document.getElementById('stressLevel');
        const queueEl = document.getElementById('queueSize');
        const timerEl = document.getElementById('roundTimer');
        if (stationEl)
            stationEl.textContent = String(this.state.stationNumber);
        if (stressEl) {
            const avgStress = this.state.passengers.length > 0
                ? Math.floor(this.state.totalStress / this.state.passengers.length)
                : 0;
            stressEl.textContent = `${avgStress}%`;
            stressEl.style.color = avgStress > 70 ? '#f00' : avgStress > 50 ? '#ff0' : '#0f0';
        }
        if (queueEl)
            queueEl.textContent = String(this.state.queue.length);
        if (timerEl)
            timerEl.textContent = `${Math.ceil(this.state.roundTimer)}s`;
    }
    updatePassengerProfile(passenger) {
        const profileEl = document.getElementById('passengerProfile');
        const typeEl = document.getElementById('passengerType');
        const traitsEl = document.getElementById('passengerTraits');
        const portraitEl = document.getElementById('portrait');
        if (!profileEl || !typeEl || !traitsEl || !portraitEl)
            return;
        const template = PASSENGER_TEMPLATES[passenger.type];
        profileEl.style.display = 'block';
        typeEl.textContent = template.name;
        // Use renderer to draw passenger portrait
        this.renderer.drawPassengerPortrait(passenger, portraitEl);
        // Show traits with current status
        const moodStatus = passenger.mood > 60 ? '😊' : passenger.mood > 30 ? '😐' : '😟';
        const stressStatus = passenger.stress > 70 ? '🔴' : passenger.stress > 40 ? '🟡' : '🟢';
        traitsEl.innerHTML = `
      <div class="trait">Mood: ${Math.floor(passenger.mood)} ${moodStatus}</div>
      <div class="trait">Stress: ${Math.floor(passenger.stress)} ${stressStatus}</div>
      <div class="trait">Noise: ${template.noiseLevel}/3</div>
      <div class="trait">Smell: ${template.smellLevel}/3</div>
      <div class="trait ${template.socialEnergy > 0 ? 'positive' : 'negative'}">
        Social: ${template.socialEnergy > 0 ? '+' : ''}${template.socialEnergy}
      </div>
      <div class="trait">Space: ${template.bubbleSize}px</div>
      <p style="margin-top: 10px; font-size: 11px; color: #aaa;">${template.description}</p>
    `;
    }
    hidePassengerProfile() {
        const profileEl = document.getElementById('passengerProfile');
        if (profileEl)
            profileEl.style.display = 'none';
        this.state.viewingPassenger = null;
    }
    render() {
        this.renderer.render(this.state, this.coach);
    }
    start() {
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            if (deltaTime < 0.1) { // Cap deltaTime to avoid huge jumps
                this.update(deltaTime);
                this.render();
            }
            requestAnimationFrame(gameLoop);
        };
        this.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}
