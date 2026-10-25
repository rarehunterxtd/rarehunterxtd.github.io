import Phaser from 'phaser';
import { addBackdrop, createButton, createIntroModal, createPanel, pulseSuccess, UI_COLORS } from '../../ui/gameUi.js';

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

// GAZO'nun oksijen seviyesi: düşük başlar, kapalı menfezler yüzünden yavaşça azalır,
// her açılan menfez seviyeyi artırır.
const OXYGEN_START = 20;
const OXYGEN_PER_VENT = 20;
const OXYGEN_MIN = 8;
const OXYGEN_DRAIN_PER_CLOSED_VENT_PER_SEC = 0.25;
const OXYGEN_LOW = 30;
const OXYGEN_MID = 70;

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
    this.introModal = null;
    this.started = false;
    this.oxygen = OXYGEN_START;
    this.oxygenDisplay = OXYGEN_START;
    this.oxygenMeter = null;
  }

  preload() {
    this.load.audio('game4_remove_sound', assetUrl('remove_sound.mp3'));
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
    this.started = false;
    this.introModal = null;
    this.vents = [];
    this.obstacles = [];
    this.oxygen = OXYGEN_START;
    this.oxygenDisplay = OXYGEN_START;

    this.backdrop = addBackdrop(this, { color: 0xeaf6f5, accent: UI_COLORS.teal, secondary: UI_COLORS.amber, depth: -200 });
    this.bgFill = this.add.rectangle(0, 0, width, height, 0xeaf6f5, 0.35).setOrigin(0).setDepth(-100);
    this.eyebrowText = this.add.text(20, 18, 'OYUN 04  •  GAZO VE MENFEZLER', { fontSize: '14px', color: '#147565', fontStyle: 'bold' }).setDepth(50);
    this.instructionText = this.add.text(width / 2, 54, 'Engelleri sürükleyip menfezleri aç, GAZO\'nun oksijenini doldur!', {
      fontSize: '20px',
      color: '#17324d',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: Math.max(240, width - 40) }
    }).setOrigin(0.5, 0).setDepth(50);

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

    this._createOxygenMeter();

    this.completionPanel = this.add.container(width / 2, height / 2).setDepth(1000).setVisible(false);
    const panelBg = createPanel(this, 0, 0, Math.min(440, width - 40), 230, {
      fill: UI_COLORS.paper, stroke: 0xb8d8c6, radius: 24, shadowAlpha: 0.24
    });
    this.completionText = this.add.text(0, -42, '✓  Tebrikler!', { fontSize: '30px', color: '#2f7c50', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add.text(0, 6, 'Tüm menfezler açıldı, GAZO\'nun oksijeni %100!\nArtık rahat nefes alıyor ve çok güçlü.', {
      fontSize: '18px',
      color: '#49657d',
      align: 'center'
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
      if (this.completed || !this.started || !gameObject || gameObject.getData('removed')) return;
      gameObject.setDepth(50);
      gameObject.setAlpha(1);
      gameObject.setData('dragStartX', gameObject.x);
      gameObject.setData('dragStartY', gameObject.y);
      gameObject.setData('pointerOffsetX', (pointer.worldX ?? pointer.x) - gameObject.x);
      gameObject.setData('pointerOffsetY', (pointer.worldY ?? pointer.y) - gameObject.y);
    });

    this.input.on('drag', (pointer, gameObject) => {
      if (this.completed || !this.started || !gameObject || gameObject.getData('removed')) return;
      const worldX = pointer.worldX ?? pointer.x;
      const worldY = pointer.worldY ?? pointer.y;
      const offsetX = gameObject.getData('pointerOffsetX') || 0;
      const offsetY = gameObject.getData('pointerOffsetY') || 0;
      gameObject.x = worldX - offsetX;
      gameObject.y = worldY - offsetY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (this.completed || !this.started || !gameObject || gameObject.getData('removed')) return;

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

        this._advanceStage(homeX, homeY);
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

      gameObject.data?.remove(['pointerOffsetX', 'pointerOffsetY', 'dragStartX', 'dragStartY']);
    });

    this._resizeHandler = (gameSize) => {
      this._onResize(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);

    this._onResize(width, height);

    this.introModal = createIntroModal(this, {
      title: 'Oyun 4 - GAZO ve Menfezler',
      body: 'Karakterimiz GAZO nefes almakta zorlanıyor! Menfezler kapalı olduğu için oksijeni azalıyor. Menfezlerin önündeki engelleri sürükleyip uzaklaştır; açtığın her menfez GAZO\'nun oksijenini artırır. Tüm menfezleri açarak oksijeni %100\'e çıkar ve GAZO\'yu güçlendir!',
      fill: UI_COLORS.teal,
      stroke: 0xb8f7e4,
      onStart: () => { this.started = true; }
    });
    this.introModal.resize(width, height);
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

  update(time, delta) {
    if (!this.oxygenMeter) return;

    if (this.started && !this.completed) {
      // Kaldırılan engeller destroy edildiği için her açılan menfezde artan stageIndex üzerinden sayılır
      const closedVents = Math.max(0, this.obstacles.length - this.stageIndex);
      const drain = (OXYGEN_DRAIN_PER_CLOSED_VENT_PER_SEC * closedVents * delta) / 1000;
      this.oxygen = Math.max(OXYGEN_MIN, this.oxygen - drain);
    }

    const diff = this.oxygen - this.oxygenDisplay;
    if (Math.abs(diff) > 0.05) {
      this.oxygenDisplay += diff * Math.min(1, delta / 180);
    } else {
      this.oxygenDisplay = this.oxygen;
    }

    this._drawOxygenMeter(time);
  }

  _createOxygenMeter() {
    const panel = createPanel(this, 0, 0, 360, 72, {
      fill: UI_COLORS.paper, stroke: 0xb8d8c6, radius: 20, shadowAlpha: 0.12, depth: 60
    });
    const label = this.add.text(0, 0, 'GAZO\'nun Oksijeni', {
      fontSize: '15px', color: '#17324d', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(61);
    const valueText = this.add.text(0, 0, '%20', {
      fontSize: '18px', color: '#17324d', fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(61);
    const statusText = this.add.text(0, 0, '', {
      fontSize: '13px', color: '#49657d'
    }).setOrigin(0.5, 0.5).setDepth(61);
    const bar = this.add.graphics().setDepth(61);

    this.oxygenMeter = { panel, label, valueText, statusText, bar, x: 0, y: 0, width: 360, height: 72 };
  }

  _layoutOxygenMeter(width, height, compact) {
    const meter = this.oxygenMeter;
    if (!meter) return;
    meter.width = Math.min(compact ? 320 : 380, width - 32);
    meter.height = compact ? 66 : 72;
    meter.x = Math.round(width / 2);
    meter.y = Math.round(height - meter.height / 2 - (compact ? 14 : 18));

    const left = meter.x - meter.width / 2 + 18;
    const right = meter.x + meter.width / 2 - 18;
    const top = meter.y - meter.height / 2;

    meter.panel.setPosition(meter.x, meter.y).resizePanel(meter.width, meter.height);
    meter.label.setPosition(left, top + 17).setFontSize(compact ? 13 : 15);
    meter.valueText.setPosition(right, top + 17).setFontSize(compact ? 16 : 18);
    meter.statusText.setPosition(meter.x, top + meter.height - 13).setFontSize(compact ? 11 : 13);
    meter.barLeft = left;
    meter.barTop = top + 30;
    meter.barWidth = right - left;
    meter.barHeight = compact ? 14 : 16;
    this._drawOxygenMeter(this.time.now);
  }

  _drawOxygenMeter(time) {
    const meter = this.oxygenMeter;
    if (!meter || meter.barWidth === undefined) return;

    const value = Phaser.Math.Clamp(this.oxygenDisplay, 0, 100);
    const color = value < OXYGEN_LOW ? UI_COLORS.coral : value < OXYGEN_MID ? UI_COLORS.amber : UI_COLORS.green;
    const radius = meter.barHeight / 2;

    meter.bar.clear();
    meter.bar.fillStyle(UI_COLORS.line, 1);
    meter.bar.fillRoundedRect(meter.barLeft, meter.barTop, meter.barWidth, meter.barHeight, radius);

    const fillWidth = Math.max(meter.barHeight, (meter.barWidth * value) / 100);
    // Oksijen düşükken dolgu "nefes alır" gibi yanıp söner
    const lowPulse = value < OXYGEN_LOW && !this.completed ? 0.65 + 0.35 * Math.sin(time / 160) : 1;
    meter.bar.fillStyle(color, lowPulse);
    meter.bar.fillRoundedRect(meter.barLeft, meter.barTop, fillWidth, meter.barHeight, radius);

    meter.valueText.setText(`%${Math.round(value)}`);
    meter.valueText.setColor(value < OXYGEN_LOW ? '#c4513c' : value < OXYGEN_MID ? '#b07a12' : '#2f7c50');

    const status = value >= 99
      ? 'GAZO çok güçlü ve rahat nefes alıyor!'
      : value >= OXYGEN_MID
        ? 'GAZO güçleniyor, az kaldı!'
        : value >= OXYGEN_LOW
          ? 'GAZO biraz rahatladı, devam et!'
          : 'Menfezler kapalı, GAZO zor nefes alıyor!';
    if (meter.statusText.text !== status) meter.statusText.setText(status);
  }

  _showOxygenGain(x, y, amount) {
    const meter = this.oxygenMeter;
    const gain = this.add.text(x, y, `+%${amount} Oksijen`, {
      fontSize: '18px', color: '#2f7c50', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 4
    }).setOrigin(0.5).setDepth(80);

    this.tweens.add({
      targets: gain,
      x: meter ? meter.x : x,
      y: meter ? meter.y - meter.height / 2 : y - 60,
      alpha: { from: 1, to: 0.2 },
      duration: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        gain.destroy();
        if (meter) {
          this.tweens.add({ targets: meter.valueText, scale: 1.25, duration: 120, yoyo: true, ease: 'Sine.easeOut' });
        }
      }
    });
  }

  _advanceStage(fromX, fromY) {
    if (this.completed) return;

    this.sound.play('game4_remove_sound');
    const isLast = this.stageIndex + 1 >= GAZO_KEYS.length - 1;
    const before = this.oxygen;
    this.oxygen = isLast ? 100 : Math.min(100, this.oxygen + OXYGEN_PER_VENT);
    this._showOxygenGain(fromX ?? this.scale.width / 2, fromY ?? this.scale.height / 2, Math.round(this.oxygen - before));

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
    this.input.removeAllListeners('dragstart');
    this.input.removeAllListeners('drag');
    this.input.removeAllListeners('dragend');
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    this.introModal?.destroy();
    this.introModal = null;
    this.oxygenMeter = null;
  }

  _onResize(width, height) {
    const compact = width < 620;
    this.backdrop?.resize(width, height);
    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
      this.bgFill.setPosition(0, 0);
    }

    this.eyebrowText
      ?.setPosition(compact ? 14 : 20, compact ? 16 : 18)
      .setFontSize(compact ? 11 : 14);

    this.instructionText
      ?.setPosition(Math.round(width / 2), compact ? 72 : 54)
      .setFontSize(compact ? 16 : 20)
      .setWordWrapWidth(Math.max(220, width - (compact ? 28 : 40)));

    const topVentY = compact ? Math.max(178, Math.round(height * 0.24)) : null;
    const bottomVentY = compact ? Math.min(height - 126, Math.round(height * 0.72)) : null;
    const ventPositions = compact
      ? [
          { x: Math.round(width * 0.28), y: topVentY },
          { x: Math.round(width * 0.72), y: topVentY },
          { x: Math.round(width * 0.28), y: bottomVentY },
          { x: Math.round(width * 0.72), y: bottomVentY }
        ]
      : VENT_LAYOUT.map((pos) => ({ x: Math.round(width * pos.x), y: Math.round(height * pos.y) }));

    const contentCenterY = compact
      ? Math.round((topVentY + bottomVentY) / 2)
      : Math.round(height / 2);

    if (this.gazo) {
      this.gazo.setPosition(Math.round(width / 2), contentCenterY);
      const targetHeight = Math.round(Math.min(width, height) * 0.34);
      const sourceImage = this.gazo.texture?.getSourceImage?.();
      const sourceW = sourceImage?.width || this.gazo.width || 1;
      const sourceH = sourceImage?.height || this.gazo.height || 1;
      const aspect = sourceW / sourceH;
      const targetWidth = Math.round(targetHeight * aspect);

      this.gazo.setDisplaySize(targetWidth, targetHeight);
      this.gazoFrame?.setPosition(Math.round(width / 2), contentCenterY);
      this.gazoFrame?.resizePanel(targetWidth + 32, targetHeight + 32);
    }

    const ventSize = Math.round(Math.min(width, height) * 0.14);
    const obstacleSize = Math.round(ventSize * 0.95);

    this.vents.forEach((vent, index) => {
      const { x: ventX, y: ventY } = ventPositions[index];
      vent.setPosition(ventX, ventY);
      vent.setDisplaySize(ventSize, ventSize);
      this.ventFrames[index]?.setPosition(ventX, ventY);
      this.ventFrames[index]?.resizePanel(ventSize + 26, ventSize + 26);
    });

    this.obstacles.forEach((obstacle, index) => {
      if (!obstacle || obstacle.getData('removed')) return;
      const { x: ventX, y: ventY } = ventPositions[index];
      obstacle.setPosition(ventX, ventY);
      obstacle.setDisplaySize(obstacleSize, obstacleSize);
      obstacle.setData('homeX', ventX);
      obstacle.setData('homeY', ventY);
    });

    this._layoutOxygenMeter(width, height, compact);

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
      const mx = Math.round(width - (compact ? 72 : 90));
      const my = 34;
      this.mainMenuButton.rect.setDisplaySize(compact ? 132 : 164, compact ? 42 : 46);
      this.mainMenuButton.rect.setPosition(mx, my);
      this.mainMenuButton.txt.setPosition(mx, my).setFontSize(compact ? 13 : 15);
    }
    this.introModal?.resize(width, height);
  }
}
