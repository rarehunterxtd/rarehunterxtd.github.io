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

// Metin dokularını yüksek DPI ekranlarda keskin tutar. Oyun canvas'ının ve
// sahne koordinatlarının aynı ölçekte kalması responsive yerleşimi korur.
const getRenderScale = () => Phaser.Math.Clamp(window.devicePixelRatio || 1, 1, 2.5);
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

const gameContainer = document.getElementById('game-container');

const readViewportSize = () => {
  const bounds = gameContainer.getBoundingClientRect();

  return {
    width: Math.max(1, Math.round(bounds.width || window.innerWidth)),
    height: Math.max(1, Math.round(bounds.height || window.innerHeight))
  };
};

const initialSize = readViewportSize();

const config = {
  type: Phaser.AUTO,
  width: initialSize.width,
  height: initialSize.height,
  pixelArt: false,
  antialias: true,
  backgroundColor: '#f7f4ea',
  parent: 'game-container',

  scale: {
    parent: 'game-container',
    // Parent ölçüsünü aşağıdaki ResizeObserver ile doğrudan uyguluyoruz.
    // Böylece mobil tarayıcı çubuğu, tam ekran ve yüksek DPI ekranlarda
    // ScaleManager'ın eski bir parent ölçüsünde kalması engellenir.
    mode: Phaser.Scale.NONE,
    width: initialSize.width,
    height: initialSize.height,
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

const game = new Phaser.Game(config);
window.game = game;

let refreshFrame = 0;
let lastTextResolution = getTextResolution();
let lastViewportWidth = 0;
let lastViewportHeight = 0;
let lastRenderScale = 0;

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

const syncHighDpiRenderer = (width, height) => {
  const renderScale = getRenderScale();
  const renderWidth = Math.max(1, Math.round(width * renderScale));
  const renderHeight = Math.max(1, Math.round(height * renderScale));

  // Phaser'ın sahne ölçülerini CSS pikselinde bırakırken WebGL çizim
  // yüzeyini cihaz piksel yoğunluğunda oluştur. Böylece bütün yerleşim ve
  // dokunma koordinatları değişmeden metinler, şekiller ve görseller keskinleşir.
  game.canvas.width = renderWidth;
  game.canvas.height = renderHeight;
  game.canvas.style.width = `${width}px`;
  game.canvas.style.height = `${height}px`;
  game.renderer.resize(renderWidth, renderHeight);

  game.scale.baseSize.setSize(renderWidth, renderHeight);
  game.scale.displaySize.setSize(width, height);
  game.scale.updateBounds();
  game.scale.displayScale.set(
    renderWidth / Math.max(1, game.scale.canvasBounds.width),
    renderHeight / Math.max(1, game.scale.canvasBounds.height)
  );

  game.scene.getScenes(true).forEach((scene) => {
    scene.cameras?.cameras.forEach((camera) => {
      camera.setViewport(0, 0, renderWidth, renderHeight);
      camera.setOrigin(0, 0);
      camera.setZoom(renderScale);
    });
  });

  lastViewportWidth = width;
  lastViewportHeight = height;
  lastRenderScale = renderScale;
};

// Yeni açılan sahnenin kamerasını da ilk çizimden önce yüksek DPI yüzeyine
// eşitle. Boyut değişmediyse yalnızca yeni kamera güncellenmiş olur.
game.events.on(Phaser.Core.Events.PRE_RENDER, () => {
  if (!lastViewportWidth || !lastViewportHeight) return;
  const renderScale = getRenderScale();
  const renderWidth = Math.max(1, Math.round(lastViewportWidth * renderScale));
  const renderHeight = Math.max(1, Math.round(lastViewportHeight * renderScale));

  game.scene.getScenes(true).forEach((scene) => {
    scene.cameras?.cameras.forEach((camera) => {
      if (camera.width !== renderWidth || camera.height !== renderHeight) {
        camera.setViewport(0, 0, renderWidth, renderHeight);
      }
      if (camera.originX !== 0 || camera.originY !== 0) camera.setOrigin(0, 0);
      if (camera.zoom !== renderScale) camera.setZoom(renderScale);
    });
  });
});

// Pencere, yön, tarayıcı tam ekranı ve parent ölçüsü değişikliklerini tek
// animasyon karesinde birleştirir. Ölçüyü DOM'dan okuyup Phaser canvas'ına
// doğrudan uygulamak, bazı mobil/4K tarayıcılarda görülen yarım ekran ve
// ekran dışında kalan menü sorunlarını ortadan kaldırır.
const queueScaleRefresh = () => {
  window.cancelAnimationFrame(refreshFrame);
  refreshFrame = window.requestAnimationFrame(() => {
    if (!game.scale?.canvas) return;

    const { width, height } = readViewportSize();
    const renderScale = getRenderScale();
    const sizeChanged = lastViewportWidth !== width
      || lastViewportHeight !== height
      || lastRenderScale !== renderScale;

    if (sizeChanged) {
      game.scale.resize(width, height);
      syncHighDpiRenderer(width, height);
    } else {
      game.scale.updateBounds();
    }

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
window.setTimeout(queueScaleRefresh, 120);
window.setTimeout(queueScaleRefresh, 600);
