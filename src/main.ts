import { Game } from './Game.js';

console.log('Script loaded!');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded!');

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  console.log('Canvas element:', canvas);

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  console.log('Creating game...');
  try {
    const game = new Game(canvas);
    console.log('Game created, starting...');
    game.start();
    console.log('Train Social Tetris started!');
  } catch (error) {
    console.error('Error starting game:', error);
  }
});
