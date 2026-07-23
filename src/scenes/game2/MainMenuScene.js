import Phaser from 'phaser';

export default class Game2MainMenuScene extends Phaser.Scene {
  constructor() {
    super('Game2MainMenu');
  }

  create() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Oyun 2 - Ana Menü', {
      fontSize: '32px',
      color: '#fff',
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Başla', {
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5).setInteractive().on('pointerup', () => {
      this.scene.start('MiniGame2');
    });
  }
}
