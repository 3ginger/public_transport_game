import { Game } from './Game';
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const game = new Game(canvas);
    game.start();
    console.log('Train Social Tetris started!');
    console.log('Controls:');
    console.log('- Click on queue to select passenger');
    console.log('- Click on seat or corridor to place passenger');
    console.log('- Arrow keys or mouse wheel to scroll');
});
