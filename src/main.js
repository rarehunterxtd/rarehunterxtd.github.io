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

// Telefonların 2.625x / 3x gibi yoğun ekranlarında canvas'ın tarayıcı
// tarafından büyütülüp bulanıklaştırılmasını önler. 2.5x sınırı görüntüyü
// cihazın doğal çözünürlüğüne yaklaştırırken GPU bellek kullanımını dengeler.
const getRenderScale = () => Phaser.Math.Clamp(window.devicePixelRatio || 1, 1, 2.5);
const getTextResolution = getRenderScale;

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

// Phaser 3'ün RESIZE modu canvas'ı CSS piksel boyutunda oluşturur. Burada
// oyun koordinatlarını CSS pikselinde bırakıp yalnızca çizim yüzeyini DPR ile
// büyütüyoruz. Böylece arayüzün boyutu değişmeden görseller ve şekiller keskin
// çizilir; ScaleManager da dokunma koordinatlarını doğru ölçeğe dönüştürür.
const originalUpdateScale = game.scale.updateScale.bind(game.scale);
game.scale.updateScale = function updateHighDpiScale() {
  originalUpdateScale();

  if (this.scaleMode !== Phaser.Scale.RESIZE || !this.canvas) return;

  const logicalWidth = Math.max(1, Math.round(this.gameSize.width));
  const logicalHeight = Math.max(1, Math.round(this.gameSize.height));
  const renderScale = getRenderScale();
  const physicalWidth = Math.max(1, Math.round(logicalWidth * renderScale));
  const physicalHeight = Math.max(1, Math.round(logicalHeight * renderScale));

  this.baseSize.setSize(physicalWidth, physicalHeight);
  this.canvas.width = physicalWidth;
  this.canvas.height = physicalHeight;
  this.canvas.style.width = `${logicalWidth}px`;
  this.canvas.style.height = `${logicalHeight}px`;
};

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

const syncActiveCameras = () => {
  const renderScale = getRenderScale();
  const physicalWidth = game.scale.baseSize.width;
  const physicalHeight = game.scale.baseSize.height;

  game.scene.getScenes(true).forEach((scene) => {
    scene.cameras?.cameras.forEach((camera) => {
      if (camera.width !== physicalWidth || camera.height !== physicalHeight) {
        camera.setSize(physicalWidth, physicalHeight);
      }
      if (camera.zoom !== renderScale) {
        camera.setZoom(renderScale);
      }
    });
  });
};

// Yeni bir sahne açıldığında kamerası da ilk çizimden önce yüksek DPI çizim
// yüzeyine eşitlenir. Boyutlar zaten doğruysa bu kontrol hiçbir işlem yapmaz.
game.events.on(Phaser.Core.Events.PRE_RENDER, syncActiveCameras);

// Pencere, yön, tarayıcı tam ekranı ve parent ölçüsü değişikliklerini tek
// animasyon karesinde birleştirir. refresh(), RESIZE modunun güncel parent
// ölçülerini sahnelere Phaser.Scale.Events.RESIZE olarak iletmesini sağlar.
const queueScaleRefresh = () => {
  window.cancelAnimationFrame(refreshFrame);
  refreshFrame = window.requestAnimationFrame(() => {
    if (!game.scale?.canvas) return;
    game.scale.refresh();
    syncActiveCameras();
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
