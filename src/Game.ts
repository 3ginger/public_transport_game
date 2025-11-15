import { GameState, GameConfig, PassengerState, PassengerType, Position } from './types';
import { PASSENGER_TEMPLATES } from './PassengerTypes';
import { TrainCoach } from './TrainCoach';
import { SocialSimulation } from './SocialSimulation';
import { Renderer } from './Renderer';

export class Game {
  private state: GameState;
  private config: GameConfig;
  private coach: TrainCoach;
  private simulation: SocialSimulation;
  private renderer: Renderer;
  private lastTime: number = 0;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
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

    this.coach = new TrainCoach(
      this.config.coachWidth,
      this.config.coachHeight,
      this.config.seatRows,
      this.config.seatsPerRow
    );

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
      gameOver: false,
      scrollOffset: 0,
    };

    this.setupEventListeners();
    this.startStation();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Keyboard for scrolling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.state.scrollOffset = Math.max(0, this.state.scrollOffset - 50);
      } else if (e.key === 'ArrowRight') {
        const maxScroll = this.config.coachWidth - this.config.canvasWidth;
        this.state.scrollOffset = Math.min(maxScroll, this.state.scrollOffset + 50);
      }
    });

    // Mouse wheel for scrolling
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const maxScroll = this.config.coachWidth - this.config.canvasWidth;
      this.state.scrollOffset = Math.max(0, Math.min(maxScroll,
        this.state.scrollOffset + e.deltaY * 0.5
      ));
    });
  }

  private handleClick(e: MouseEvent): void {
    if (this.state.gameOver || !this.state.isPlacementPhase) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + this.state.scrollOffset;
    const y = e.clientY - rect.top;

    // Check if clicking on queue
    if (e.clientX - rect.left < 100 && e.clientY - rect.top > 80) {
      const queueIndex = Math.floor((e.clientY - rect.top - 100) / 50);
      if (queueIndex >= 0 && queueIndex < this.state.queue.length) {
        this.state.currentSelectedPassenger = this.state.queue[queueIndex];
        this.updatePassengerProfile(this.state.currentSelectedPassenger);
        return;
      }
    }

    // Place passenger if one is selected
    if (this.state.currentSelectedPassenger) {
      this.placePassenger({ x, y });
    }
  }

  private handleMouseMove(e: MouseEvent): void {
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

  private placePassenger(position: Position): void {
    if (!this.state.currentSelectedPassenger) return;

    const passenger = this.state.currentSelectedPassenger;

    // Check if clicking on a seat
    const seat = this.coach.findNearestSeat(position);

    if (seat) {
      // Place on seat
      passenger.position = { ...seat.position };
      passenger.isSeated = true;
      this.coach.occupySeat(seat, passenger.id);
    } else if (this.coach.isValidStandingPosition(position)) {
      // Place standing
      passenger.position = { ...position };
      passenger.isSeated = false;
    } else {
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
    } else {
      this.hidePassengerProfile();
    }
  }

  private startStation(): void {
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

  private generateQueue(size: number): PassengerState[] {
    const queue: PassengerState[] = [];
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

  private createPassenger(type: PassengerType): PassengerState {
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
    };
  }

  update(deltaTime: number): void {
    if (this.state.gameOver) return;

    if (this.state.isPlacementPhase) {
      // Placement phase
      this.state.roundTimer -= deltaTime;

      if (this.state.roundTimer <= 0) {
        this.endPlacementPhase();
      }
    } else {
      // Simulation phase
      this.state.roundTimer -= deltaTime;

      // Update social simulation
      this.state.totalStress = this.simulation.updatePassengers(
        this.state.passengers,
        deltaTime
      );

      // Check game over
      if (this.simulation.checkGameOver(this.state.passengers)) {
        this.gameOver();
      }

      if (this.state.roundTimer <= 0) {
        this.nextStation();
      }
    }

    this.updateUI();
  }

  private endPlacementPhase(): void {
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

  private nextStation(): void {
    this.state.stationNumber++;

    // Remove some random passengers (they exit)
    const exitCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < exitCount && this.state.passengers.length > 0; i++) {
      const exitIndex = Math.floor(Math.random() * this.state.passengers.length);
      const passenger = this.state.passengers[exitIndex];
      if (passenger.isSeated) {
        this.coach.freeSeat(passenger.id);
      }
      this.state.passengers.splice(exitIndex, 1);
    }

    this.startStation();
  }

  private gameOver(): void {
    this.state.gameOver = true;
    alert(`Game Over! You made it to station ${this.state.stationNumber}`);
  }

  private updateUI(): void {
    const stationEl = document.getElementById('stationNumber');
    const stressEl = document.getElementById('stressLevel');
    const queueEl = document.getElementById('queueSize');
    const timerEl = document.getElementById('roundTimer');

    if (stationEl) stationEl.textContent = String(this.state.stationNumber);
    if (stressEl) {
      const avgStress = this.state.passengers.length > 0
        ? Math.floor(this.state.totalStress / this.state.passengers.length)
        : 0;
      stressEl.textContent = `${avgStress}%`;
      stressEl.style.color = avgStress > 70 ? '#f00' : avgStress > 50 ? '#ff0' : '#0f0';
    }
    if (queueEl) queueEl.textContent = String(this.state.queue.length);
    if (timerEl) timerEl.textContent = `${Math.ceil(this.state.roundTimer)}s`;
  }

  private updatePassengerProfile(passenger: PassengerState): void {
    const profileEl = document.getElementById('passengerProfile');
    const typeEl = document.getElementById('passengerType');
    const traitsEl = document.getElementById('passengerTraits');
    const portraitEl = document.getElementById('portrait');

    if (!profileEl || !typeEl || !traitsEl || !portraitEl) return;

    const template = PASSENGER_TEMPLATES[passenger.type];

    profileEl.style.display = 'block';
    typeEl.textContent = template.name;

    // Simple portrait representation
    portraitEl.style.backgroundColor = template.color;
    portraitEl.innerHTML = `<div style="width: 60px; height: 60px; background: ${template.color}; border: 2px solid #fff;"></div>`;

    // Show traits
    traitsEl.innerHTML = `
      <div class="trait">Noise: ${template.noiseLevel}/3</div>
      <div class="trait">Smell: ${template.smellLevel}/3</div>
      <div class="trait ${template.socialEnergy > 0 ? 'positive' : 'negative'}">
        Social: ${template.socialEnergy > 0 ? '+' : ''}${template.socialEnergy}
      </div>
      <div class="trait">Space: ${template.bubbleSize}px</div>
      <p style="margin-top: 10px; font-size: 11px; color: #aaa;">${template.description}</p>
    `;
  }

  private hidePassengerProfile(): void {
    const profileEl = document.getElementById('passengerProfile');
    if (profileEl) profileEl.style.display = 'none';
  }

  render(): void {
    this.renderer.render(this.state, this.coach);
  }

  start(): void {
    const gameLoop = (currentTime: number) => {
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
