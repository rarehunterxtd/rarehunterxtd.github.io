import Phaser from 'phaser';
import { addBackdrop, createButton, createPanel, pulseSuccess, UI_COLORS } from '../../ui/gameUi.js';

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/game4/${file}`;

const VENT_KEY = 'game4_menfez';
const OBSTACLE_KEY = 'game4_engel';
const GAZO_KEYS = ['gazo_stage1', 'gazo_stage2', 'gazo_stage3', 'gazo_stage4', 'gazo_stage5'];

const VENT_LAYOUT = [
  { x: 0.28, y: 0.28 },
  { x: 0.72, y: 0.28 },
  { x: 0.28, y: 0.72 },
  { x: 0.72, y: 0.72 }
];

export default class MiniGame4Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame4');
    this.vents = [];
    this.ventFrames = [];
    this.obstacles = [];
    this.gazo = null;
    this.stageIndex = 0;
    this.completed = false;
    this.completionPanel = null;
    this.completionText = null;
    this.menuButtonBg = null;
    this.menuButtonText = null;
    this.mainMenuButton = null;
  }

  preload() {
    this.load.image(VENT_KEY, assetUrl('menfez.png'));
    this.load.image(OBSTACLE_KEY, assetUrl('engel.png'));
    GAZO_KEYS.forEach((key, idx) => {
      this.load.image(key, assetUrl(`gazo_stage${idx + 1}.png`));
    });
  }

  create() {
    const { width, height } = this.scale;
    this.stageIndex = 0;
    this.completed = false;
    this.vents = [];
    this.obstacles = [];

    this.backdrop = addBackdrop(this, { color: 0xeaf6f5, accent: UI_COLORS.teal, secondary: UI_COLORS.amber, depth: -200 });
    this.bgFill = this.add.rectangle(0, 0, width, height, 0xeaf6f5, 0.35).setOrigin(0).setDepth(-100);
    this.add.text(20, 18, 'OYUN 04  •  TEMİZ HAVA', { fontSize: '14px', color: '#147565', fontStyle: 'bold' }).setDepth(50);
    this.instructionText = this.add.text(width / 2, 54, 'Engelleri sürükleyip menfezlerden uzaklaştır.', {
      fontSize: '20px',
      color: '#17324d',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50);

    const menuButton = createButton(this, {
      x: width - 92, y: 34, width: 164, height: 46, label: '←  Ana Menü',
      fill: UI_COLORS.navy, stroke: 0x9ccbd2, fontSize: 15, depth: 300,
      onClick: () => this.scene.start('MainMenu')
    });
    this.mainMenuButton = { rect: menuButton.bg, txt: menuButton.text };

    this.gazoFrame = createPanel(this, width / 2, height / 2, 210, 210, {
      fill: UI_COLORS.paper, stroke: 0xb8d8c6, radius: 28, shadowAlpha: 0.13, depth: 3
    });
    this.gazo = this.add.image(width / 2, height / 2, GAZO_KEYS[0]).setOrigin(0.5).setDepth(20);
    this.vents = [];
    this.ventFrames = [];
    this.obstacles = [];

    VENT_LAYOUT.forEach((pos, index) => {
      const ventX = Math.round(width * pos.x);
      const ventY = Math.round(height * pos.y);

      const ventFrame = createPanel(this, ventX, ventY, 112, 112, {
        fill: UI_COLORS.paper, stroke: 0x9ccbd2, radius: 20, shadowAlpha: 0.12, depth: 4
      });
      this.ventFrames.push(ventFrame);
      const vent = this.add.image(ventX, ventY, VENT_KEY).setOrigin(0.5).setDepth(5);
      vent.setData('index', index);
      this.vents.push(vent);

      const obstacle = this.add.image(ventX, ventY, OBSTACLE_KEY).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
      obstacle.setData('index', index);
      obstacle.setData('homeX', ventX);
      obstacle.setData('homeY', ventY);
      obstacle.setData('removed', false);
      obstacle.setData('locked', false);
      obstacle.setDisplaySize(vent.displayWidth || obstacle.displayWidth, vent.displayHeight || obstacle.displayHeight);
      this.input.setDraggable(obstacle);
      this.obstacles.push(obstacle);
    });

    this.completionPanel = this.add.container(width / 2, height / 2).setDepth(1000).setVisible(false);
    const panelBg = createPanel(this, 0, 0, Math.min(440, width - 40), 230, {
      fill: UI_COLORS.paper, stroke: 0xb8d8c6, radius: 24, shadowAlpha: 0.24
    });
    this.completionText = this.add.text(0, -42, '✓  Tebrikler!', { fontSize: '30px', color: '#2f7c50', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add.text(0, 6, 'Tüm engeller kaldırıldı.', {
      fontSize: '18px',
      color: '#49657d'
    }).setOrigin(0.5);
    this.completionPanel.add([panelBg, this.completionText, body]);
    const completeButton = createButton(this, {
      x: width / 2, y: height / 2 + 68, width: 228, height: 54,
      label: 'Ana Menüye Dön  ›', fill: UI_COLORS.green, stroke: 0xd8f5e3,
      depth: 1002, onClick: () => this.scene.start('MainMenu')
    });
    completeButton.bg.setVisible(false);
    this.menuButtonBg = completeButton.bg;
    this.menuButtonText = completeButton.text;

    this.input.on('dragstart', (pointer, gameObject) => {
      if (this.completed || !gameObject || gameObject.getData('removed')) return;
      gameObject.setDepth(50);
      gameObject.setAlpha(1);
      gameObject.setData('dragStartX', gameObject.x);
      gameObject.setData('dragStartY', gameObject.y);
      gameObject.setData('pointerOffsetX', (pointer.worldX ?? pointer.x) - gameObject.x);
      gameObject.setData('pointerOffsetY', (pointer.worldY ?? pointer.y) - gameObject.y);
    });

    this.input.on('drag', (pointer, gameObject) => {
      if (this.completed || !gameObject || gameObject.getData('removed')) return;
      const worldX = pointer.worldX ?? pointer.x;
      const worldY = pointer.worldY ?? pointer.y;
      const offsetX = gameObject.getData('pointerOffsetX') || 0;
      const offsetY = gameObject.getData('pointerOffsetY') || 0;
      gameObject.x = worldX - offsetX;
      gameObject.y = worldY - offsetY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (this.completed || !gameObject || gameObject.getData('removed')) return;

      const homeX = gameObject.getData('homeX');
      const homeY = gameObject.getData('homeY');
      const distance = Phaser.Math.Distance.Between(homeX, homeY, gameObject.x, gameObject.y);

      if (distance >= 80) {
        this._forceEndPointerDrag(pointer);
        gameObject.setData('removed', true);
        gameObject.disableInteractive();
        this.input.setDraggable(gameObject, false);

        this.tweens.add({
          targets: gameObject,
          alpha: 0,
          duration: 400,
          ease: 'Linear',
          onComplete: () => {
            gameObject.destroy();
          }
        });

        this._advanceStage();
      } else {
        this._forceEndPointerDrag(pointer);
        this.tweens.add({
          targets: gameObject,
          x: homeX,
          y: homeY,
          duration: 220,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            gameObject.setDepth(10);
          }
        });
      }

      gameObject.removeData('pointerOffsetX');
      gameObject.removeData('pointerOffsetY');
      gameObject.removeData('dragStartX');
      gameObject.removeData('dragStartY');
    });

    this._resizeHandler = (gameSize) => {
      this._onResize(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);

    this._onResize(width, height);
  }

  _forceEndPointerDrag(pointer) {
    if (!pointer) return;
    if (typeof this.input?.setDragState === 'function') {
      this.input.setDragState(pointer, 0);
      return;
    }
    if (typeof pointer.dragState === 'number') {
      pointer.dragState = 0;
    }
  }

  _advanceStage() {
    if (this.completed) return;

    this.stageIndex = Math.min(this.stageIndex + 1, GAZO_KEYS.length - 1);
    const nextKey = GAZO_KEYS[this.stageIndex];
    if (this.gazo && this.textures.exists(nextKey)) {
      this.tweens.add({
        targets: this.gazo,
        alpha: 0,
        duration: 120,
        ease: 'Linear',
        onComplete: () => {
          this.gazo.setTexture(nextKey);
          this.gazo.setAlpha(1);
          this._onResize(this.scale.width, this.scale.height);
        }
      });
    }

    if (this.stageIndex === GAZO_KEYS.length - 1) {
      this._showCompletionUI();
    }
  }

  _showCompletionUI() {
    if (this.completed) return;
    this.completed = true;
    this._markGameCompleted();
    if (this.completionPanel) {
      this.completionPanel.setVisible(true);
    }
    this.menuButtonBg?.setVisible(true);
    pulseSuccess(this, [this.completionPanel, this.menuButtonBg?.face].filter(Boolean));
  }

  _markGameCompleted() {
    const completedGames = this.registry.get('completedGames') || {};
    this.registry.set('completedGames', { ...completedGames, game4: true });
  }

  _onShutdown() {
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  _onResize(width, height) {
    this.backdrop?.resize(width, height);
    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
      this.bgFill.setPosition(0, 0);
    }

    if (this.instructionText) {
      this.instructionText.setPosition(Math.round(width / 2), 54);
    }

    if (this.gazo) {
      this.gazo.setPosition(Math.round(width / 2), Math.round(height / 2));
      const targetHeight = Math.round(Math.min(width, height) * 0.34);
      const sourceImage = this.gazo.texture?.getSourceImage?.();
      const sourceW = sourceImage?.width || this.gazo.width || 1;
      const sourceH = sourceImage?.height || this.gazo.height || 1;
      const aspect = sourceW / sourceH;
      const targetWidth = Math.round(targetHeight * aspect);

      this.gazo.setDisplaySize(targetWidth, targetHeight);
      this.gazoFrame?.setPosition(Math.round(width / 2), Math.round(height / 2));
      this.gazoFrame?.resizePanel(targetWidth + 32, targetHeight + 32);
    }

    const ventSize = Math.round(Math.min(width, height) * 0.14);
    const obstacleSize = Math.round(ventSize * 0.95);

    this.vents.forEach((vent, index) => {
      const pos = VENT_LAYOUT[index];
      const ventX = Math.round(width * pos.x);
      const ventY = Math.round(height * pos.y);
      vent.setPosition(ventX, ventY);
      vent.setDisplaySize(ventSize, ventSize);
      this.ventFrames[index]?.setPosition(ventX, ventY);
      this.ventFrames[index]?.resizePanel(ventSize + 26, ventSize + 26);
    });

    this.obstacles.forEach((obstacle, index) => {
      if (!obstacle || obstacle.getData('removed')) return;
      const pos = VENT_LAYOUT[index];
      const ventX = Math.round(width * pos.x);
      const ventY = Math.round(height * pos.y);
      obstacle.setPosition(ventX, ventY);
      obstacle.setDisplaySize(obstacleSize, obstacleSize);
      obstacle.setData('homeX', ventX);
      obstacle.setData('homeY', ventY);
    });

    if (this.completionPanel) {
      this.completionPanel.setPosition(Math.round(width / 2), Math.round(height / 2));
      const panelBg = this.completionPanel.list?.[0];
      if (panelBg?.resizePanel) {
        const panelW = Math.min(440, width - 40);
        panelBg.resizePanel(panelW, 230);
      }
    }
    this.menuButtonBg?.setPosition(width / 2, height / 2 + 68);
    this.menuButtonText?.setPosition(width / 2, height / 2 + 68);

    if (this.mainMenuButton) {
      const mx = Math.round(width - 90);
      const my = 34;
      this.mainMenuButton.rect.setPosition(mx, my);
      this.mainMenuButton.txt.setPosition(mx, my);
    }
  }
}
