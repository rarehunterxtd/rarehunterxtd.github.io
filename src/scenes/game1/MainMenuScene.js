import Phaser from 'phaser';

export default class Game1MainMenuScene extends Phaser.Scene {
  constructor() {
    super('Game1MainMenu');
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Oyun 1 - Ana Menü', {
      fontSize: '32px',
      color: '#fff',
    }).setOrigin(0.5);
  }
}
