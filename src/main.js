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

//const RENDER_DPR = window.devicePixelRatio || 1;

if (!Phaser.GameObjects.GameObjectFactory.prototype.__gazmerTextPatched) {
  const originalText = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style = {}) {
    const textObject = originalText.call(this, x, y, text, {
      ...DEFAULT_TEXT_STYLE,
      ...style
    });
    //textObject.setResolution(RENDER_DPR);
    return textObject;
  };
  Phaser.GameObjects.GameObjectFactory.prototype.__gazmerTextPatched = true;
}

const config = {
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  // Match the render buffer to device pixel density for sharper output on mobile.
  //resolution: RENDER_DPR,
  pixelArt: false,
  antialias: true,
  backgroundColor: '#222',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
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

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});
