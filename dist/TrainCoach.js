export class TrainCoach {
    constructor(width, height, rows, seatsPerRow) {
        this.seats = [];
        this.width = width;
        this.height = height;
        this.rows = rows;
        this.seatsPerRow = seatsPerRow;
        this.initializeSeats();
    }
    initializeSeats() {
        const seatWidth = 40;
        const seatHeight = 40;
        const rowSpacing = 100;
        const seatSpacing = 50;
        const startX = 100;
        const startY = 100;
        // Left side seats
        for (let row = 0; row < this.rows; row++) {
            for (let seat = 0; seat < this.seatsPerRow / 2; seat++) {
                this.seats.push({
                    position: {
                        x: startX + row * rowSpacing,
                        y: startY + seat * seatSpacing,
                    },
                    occupied: false,
                    passengerId: null,
                });
            }
        }
        // Right side seats
        for (let row = 0; row < this.rows; row++) {
            for (let seat = 0; seat < this.seatsPerRow / 2; seat++) {
                this.seats.push({
                    position: {
                        x: startX + row * rowSpacing,
                        y: this.height - startY - seat * seatSpacing,
                    },
                    occupied: false,
                    passengerId: null,
                });
            }
        }
    }
    findNearestSeat(position) {
        let nearest = null;
        let minDistance = Infinity;
        for (const seat of this.seats) {
            if (!seat.occupied) {
                const distance = Math.hypot(seat.position.x - position.x, seat.position.y - position.y);
                if (distance < minDistance && distance < 50) {
                    minDistance = distance;
                    nearest = seat;
                }
            }
        }
        return nearest;
    }
    occupySeat(seat, passengerId) {
        seat.occupied = true;
        seat.passengerId = passengerId;
    }
    freeSeat(passengerId) {
        const seat = this.seats.find(s => s.passengerId === passengerId);
        if (seat) {
            seat.occupied = false;
            seat.passengerId = null;
        }
    }
    isValidStandingPosition(position) {
        // Check if position is in the middle corridor
        const corridorY = this.height / 2;
        const corridorWidth = 150;
        return (position.x >= 50 &&
            position.x <= this.width - 50 &&
            position.y >= corridorY - corridorWidth / 2 &&
            position.y <= corridorY + corridorWidth / 2);
    }
}
