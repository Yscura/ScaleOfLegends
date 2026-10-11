import { ScaleOfLegendsGame } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new ScaleOfLegendsGame();
});

// Register the service worker (PWA: installable + offline). Served over http(s) only.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
