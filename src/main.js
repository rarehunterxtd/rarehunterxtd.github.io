import Phaser from 'phaser';
import MainMenuScene from './scenes/MainMenuScene.js';
import Game2MainMenuScene from './scenes/game2/MainMenuScene.js';
import MiniGame2Scene from './scenes/game2/MiniGame2Scene.js';
import Game1MainMenuScene from './scenes/game1/MainMenuScene.js';
import MiniGame1Scene from './scenes/game1/MiniGame1Scene.js';
import MiniGame3Scene from './scenes/game3/MiniGame3Scene.js';
import MiniGame4Scene from './scenes/game4/MiniGame4Scene.js';
import MiniGame5Scene from './scenes/game5/MiniGame5Scene.js';

const DEFAULT_TEXT_STYLE = {
  fontFamily: 'Trebuchet MS, sans-serif'
};

// Phaser Text nesnelerini retina / yüksek DPI ekranlarda keskin tutar.
// 2x sınırı, özellikle 4K mobil cihazlarda bellek kullanımının büyümesini önler.
const getTextResolution = () => Phaser.Math.Clamp(window.devicePixelRatio || 1, 1, 2);

if (!Phaser.GameObjects.GameObjectFactory.prototype.__gazmerTextPatched) {
  const originalText = Phaser.GameObjects.GameObjectFactory.prototype.text;

  Phaser.GameObjects.GameObjectFactory.prototype.text = function (
    x,
    y,
    text,
    style = {}
  ) {
    return originalText.call(this, x, y, text, {
      ...DEFAULT_TEXT_STYLE,
      resolution: getTextResolution(),
      ...style
    });
  };

  Phaser.GameObjects.GameObjectFactory.prototype.__gazmerTextPatched = true;
}

const config = {
  type: Phaser.AUTO,
  pixelArt: false,
  antialias: true,
  backgroundColor: '#f7f4ea',
  parent: 'game-container',

  scale: {
    parent: 'game-container',
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.NO_CENTER,
    autoRound: true,
    expandParent: false,
    fullscreenTarget: 'game-container'
  },

  scene: [
    MainMenuScene,
    Game2MainMenuScene,
    MiniGame2Scene,
    Game1MainMenuScene,
    MiniGame1Scene,
    MiniGame3Scene,
    MiniGame4Scene,
    MiniGame5Scene
  ]
};

const gameContainer = document.getElementById('game-container');
const game = new Phaser.Game(config);
window.game = game;

let refreshFrame = 0;
let lastTextResolution = getTextResolution();

const refreshTextResolution = () => {
  const nextResolution = getTextResolution();
  if (nextResolution === lastTextResolution) return;

  lastTextResolution = nextResolution;
  game.scene.getScenes(true).forEach((scene) => {
    scene.children?.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text) {
        child.setResolution(nextResolution);
      }
    });
  });
};

// Pencere, yön, tarayıcı tam ekranı ve parent ölçüsü değişikliklerini tek
// animasyon karesinde birleştirir. refresh(), RESIZE modunun güncel parent
// ölçülerini sahnelere Phaser.Scale.Events.RESIZE olarak iletmesini sağlar.
const queueScaleRefresh = () => {
  window.cancelAnimationFrame(refreshFrame);
  refreshFrame = window.requestAnimationFrame(() => {
    if (!game.scale?.canvas) return;
    game.scale.refresh();
    refreshTextResolution();
  });
};

const resizeObserver = new ResizeObserver(queueScaleRefresh);
resizeObserver.observe(gameContainer);

window.addEventListener('resize', queueScaleRefresh, { passive: true });
window.addEventListener('orientationchange', queueScaleRefresh, { passive: true });
window.visualViewport?.addEventListener('resize', queueScaleRefresh, { passive: true });
document.addEventListener('fullscreenchange', queueScaleRefresh);

queueScaleRefresh();
