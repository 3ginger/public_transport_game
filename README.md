# Train Social Tetris

🎮 **[PLAY NOW](https://3ginger.github.io/public_transport_game/)** 🎮

A roguelike game about managing passengers in a train. Your goal is to survive as many stations as possible without letting the social dynamics explode!

## Game Concept

You're the conductor of a train, and at each station, new passengers board. Your job is to quickly assess each passenger's personality and find them the right spot - either seated or standing. Different passenger types have different needs, triggers, and social effects on others.

### Passenger Types

- **Office Worker** - Dislikes noise and smell, prefers calm environment
- **Punk** - Loud and energetic, scares introverts but uplifts other alternative types
- **Mom with Child** - Noisy but calms down near chill people
- **Homeless** - Strong smell, unbothered by chaos
- **Lovers (Couple)** - Must be placed near each other or they get stressed!
- **Introvert** - Needs lots of personal space, hates crowds and noise
- **Talkative Elder** - Periodically loud but calms other elders and moms
- **Hipster** - Dislikes office culture, likes alternative people
- **Chill Person** - Universal stabilizer, calms everyone nearby

## Gameplay Loop

### Station Phase (Placement)
1. Doors open, queue of passengers appears on the left
2. Click on a passenger in the queue to select them
3. Click on a seat or in the corridor to place them
4. You have limited time to place everyone
5. Unplaced passengers rush in randomly when time runs out

### Journey Phase (Simulation)
- Social dynamics activate automatically
- Passengers affect each other based on proximity
- Stress and mood change over time in real-time
- Click on any passenger to view their live stats
- Watch passengers exit with smooth animations
- If too many passengers reach critical stress → Game Over
- After ~30 seconds, next station arrives with some passengers exiting

### Win Condition
Survive as many stations as possible!

### Lose Conditions
- 3+ passengers with critical stress (≥90)
- 4+ passengers with very low mood (≤10)

## Controls

### Desktop
- **Click on queue** - Select passenger to place (during placement phase)
- **Click on passenger in coach** - View their detailed profile and current stats
- **Click on seat/corridor** - Place selected passenger (seat or standing area)
- **Arrow keys / Mouse wheel** - Scroll left/right through the coach
- **Hover over passenger** - Quick status preview

### Mobile/Touch
- **Tap on queue** - Select passenger to place
- **Tap on passenger** - View their profile with live stats
- **Tap on location** - Place selected passenger
- **Swipe left/right** - Scroll through the coach
- **Close button (×)** - Close passenger profile panel

## Game Mechanics

### Social Physics
Every 2-3 seconds, passengers interact with nearby people:
- **Triggers**: Certain types stress out others (e.g., punks stress office workers)
- **Social Energy**: Some spread positive vibes, others negative
- **Personal Space Bubble**: Violation increases stress
- **Noise & Smell**: Affect mood of nearby passengers

### Strategic Considerations
- Place couples together or they'll get very stressed
- Give introverts space
- Use chill people to stabilize volatile areas
- Keep conflicting types apart (office workers vs punks/homeless)
- Noisy passengers should be away from introverts

## How to Run

### Play Online
Just visit: **https://3ginger.github.io/public_transport_game/**

### Development
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Start local server
npm run serve

# Open browser to http://localhost:8000
```

### Watch Mode
```bash
# Auto-compile on changes
npm run watch

# In another terminal
npm run serve
```

## Technical Stack

- TypeScript
- HTML5 Canvas with touch support
- Responsive design for mobile devices
- No external game libraries (pure canvas rendering)
- Progressive Web App ready

## Game Structure

```
src/
├── types.ts              # Type definitions
├── PassengerTypes.ts     # Passenger templates and traits
├── TrainCoach.ts         # Coach layout and seat management
├── SocialSimulation.ts   # Social interaction logic
├── Renderer.ts           # Canvas rendering
├── Game.ts               # Main game loop and state
└── main.ts               # Entry point
```

## Features

### Current
- ✅ 10 unique passenger types with distinct behaviors
- ✅ Real-time social simulation with stress/mood mechanics
- ✅ Touch controls for mobile devices
- ✅ Click passengers to view live stats and profiles
- ✅ Smooth exit animations when passengers leave
- ✅ Responsive canvas that adapts to screen size
- ✅ Progressive difficulty through stations
- ✅ Interactive passenger portraits

### Future Improvements
- More passenger types (student groups, tourists, business travelers)
- Boss encounters (wedding party, school trip, football fans)
- Special events during journey
- Power-ups and abilities
- Enhanced visual effects and particle systems
- Sound effects and music
- Difficulty progression system
- High score tracking and leaderboards
- Save/load game state
