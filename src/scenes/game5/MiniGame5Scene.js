import Phaser from 'phaser';
import { addBackdrop, createButton, createPanel, pulseSuccess, shakeSoft, UI_COLORS } from '../../ui/gameUi.js';

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/game5/${file}`;

const SAFE_MIN = -30;
const SAFE_MAX = 30;
const TIMER_SECONDS = 30;
const NEEDLE_MIN = -90;
const NEEDLE_MAX = 90;

export default class MiniGame5Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame5');
    this.pressureMeter = null;
    this.needle = null;
    this.timerText = null;
    this.feedbackText = null;
    this.leftButton = null;
    this.rightButton = null;
    this.overlay = null;
    this.panel = null;
    this.panelTitle = null;
    this.panelBody = null;
    this.panelActionBg = null;
    this.panelActionText = null;
    this.currentAngle = 0;
    this.isFinished = false;
    this.countdown = TIMER_SECONDS;
    this.angularVelocity = 0;
    this.manualForce = 0;
    this.startedAt = 0;
    this.lastDisplayedSecond = TIMER_SECONDS;
    this.cursors = null;
    this.mainMenuButton = null;
  }

  preload() {
    this.load.image('game5_pressure_meter', assetUrl('pressure_meter.png'));
    this.load.image('game5_needle', assetUrl('ibre.png'));
  }

  create() {
    const { width, height } = this.scale;
    this.isFinished = false;
    this.countdown = TIMER_SECONDS;
    this.currentAngle = 0;
    this.angularVelocity = 0;
    this.manualForce = 0;

    this.backdrop = addBackdrop(this, { color: 0xf3f0fb, accent: UI_COLORS.lavender, secondary: UI_COLORS.teal, depth: -200 });
    this.bgFill = this.add.rectangle(0, 0, width, height, 0xf3f0fb, 0.3).setOrigin(0).setDepth(-100);
    this.titleText = this.add.text(20, 18, 'OYUN 05  •  BASINÇ USTASI', { fontSize: '14px', color: '#564695', fontStyle: 'bold' }).setDepth(50);
    const menuButton = createButton(this, {
      x: width - 92, y: 34, width: 164, height: 46, label: '←  Ana Menü',
      fill: UI_COLORS.navy, stroke: 0x9ccbd2, fontSize: 15, depth: 300,
      onClick: () => this.scene.start('MainMenu')
    });
    this.mainMenuButton = { rect: menuButton.bg, txt: menuButton.text };

    this.timerText = this.add.text(width / 2, 24, `Süre: ${TIMER_SECONDS}`, {
      fontSize: '24px',
      color: '#17324d',
      backgroundColor: '#ffffff',
      padding: { x: 14, y: 7 }
    }).setOrigin(0.5, 0).setDepth(60);
    this.feedbackText = this.add.text(width / 2, 58, 'İbreyi ortada tut.', {
      fontSize: '18px',
      color: '#564695',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(60);

    this.pressureMeter = this.add.image(width / 2, height / 2, 'game5_pressure_meter').setOrigin(0.5).setDepth(10);
    this.needle = this.add.image(width / 2, height / 2, 'game5_needle').setOrigin(0.5, 1).setDepth(20);
    this.currentAngle = 0;
    this.angularVelocity = 0;
    this.needle.setAngle(this.currentAngle);

    this.leftButton = this._createButton(width / 2 - 190, height / 2, '◀', () => this._nudgeNeedle(-10));
    this.rightButton = this._createButton(width / 2 + 190, height / 2, '▶', () => this._nudgeNeedle(10));

    this.cursors = this.input.keyboard.createCursorKeys();
    this.startedAt = performance.now();
    this.lastDisplayedSecond = TIMER_SECONDS;

    this.overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.68)
      .setOrigin(0)
      .setDepth(1000)
      .setVisible(false)
      .setInteractive();

    this.panel = this.add.container(width / 2, height / 2).setDepth(1001).setVisible(false);
    const panelBg = createPanel(this, 0, 0, Math.min(440, width - 40), 250, {
      fill: UI_COLORS.paper, stroke: 0xc9c0e8, radius: 24, shadowAlpha: 0.25
    });
    this.panelTitle = this.add.text(0, -58, '', { fontSize: '30px', color: '#17324d', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    this.panelBody = this.add.text(0, -8, '', {
      fontSize: '18px',
      color: '#49657d',
      align: 'center',
      wordWrap: { width: Math.min(340, width - 80) }
    }).setOrigin(0.5);
    this.panel.add([panelBg, this.panelTitle, this.panelBody]);
    const actionButton = createButton(this, {
      x: width / 2, y: height / 2 + 78, width: 228, height: 54, label: '',
      fill: UI_COLORS.lavender, stroke: 0xe7e0ff, depth: 1002
    });
    actionButton.bg.setVisible(false);
    this.panelActionBg = actionButton.bg;
    this.panelActionText = actionButton.text;

    this.panelActionBg.on('pointerup', () => {
      if (this.isFinished) {
        this.scene.start('MainMenu');
      } else {
        this.scene.restart();
      }
    });

    this._resizeHandler = (gameSize) => {
      this._onResize(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);

    this._onResize(width, height);
  }

  _createButton(x, y, label, handler) {
    return createButton(this, {
      x, y, width: 96, height: 96, label, fill: UI_COLORS.lavender,
      stroke: 0xe7e0ff, fontSize: 38, radius: 24, depth: 40, onClick: handler
    });
  }

  _nudgeNeedle(delta) {
    if (this.isFinished) return;
    this.angularVelocity += delta * 2.15;
    this.manualForce += delta * 0.7;
  }

  _stepPhysics(deltaSeconds, elapsedSeconds, keyboardForce) {
    const destabilizingForce = this.currentAngle * 0.075;
    const naturalWobble = Math.sin(elapsedSeconds * 1.35) * 5.2;
    const inputForce = keyboardForce * 92 + this.manualForce;

    this.angularVelocity += (destabilizingForce + naturalWobble + inputForce) * deltaSeconds;
    this.angularVelocity *= Math.exp(-0.48 * deltaSeconds);
    this.angularVelocity = Phaser.Math.Clamp(this.angularVelocity, -62, 62);
    this.currentAngle = Phaser.Math.Clamp(
      this.currentAngle + this.angularVelocity * deltaSeconds,
      NEEDLE_MIN,
      NEEDLE_MAX
    );
    this.manualForce *= Math.exp(-4.5 * deltaSeconds);

    if (this.currentAngle === NEEDLE_MIN || this.currentAngle === NEEDLE_MAX) {
      this.angularVelocity *= -0.18;
    }
  }

  _syncNeedle() {
    if (!this.needle) return;
    this.needle.setAngle(this.currentAngle);
  }

  update(time, delta) {
    if (this.isFinished) return;

    let keyboardForce = 0;
    if (this.cursors?.left?.isDown) keyboardForce -= 1;
    if (this.cursors?.right?.isDown) keyboardForce += 1;

    const now = performance.now();
    const elapsedSeconds = Math.max(0, (now - this.startedAt) / 1000);
    const remaining = Math.max(0, TIMER_SECONDS - elapsedSeconds);
    this.countdown = remaining;

    const displayedSecond = Math.ceil(remaining);
    if (displayedSecond !== this.lastDisplayedSecond) {
      this.lastDisplayedSecond = displayedSecond;
      this.timerText.setText(`Süre: ${displayedSecond}`);
    }

    const totalDelta = Math.min(Math.max(delta, 0) / 1000, 0.12);
    const stepCount = Math.max(1, Math.ceil(totalDelta / (1 / 60)));
    const step = totalDelta / stepCount;
    for (let index = 0; index < stepCount; index += 1) {
      this._stepPhysics(step, elapsedSeconds, keyboardForce);
    }
    this._syncNeedle();

    if (remaining <= 0) {
      this._finishGame();
    }
  }

  _finishGame() {
    if (this.isFinished) return;
    this.isFinished = true;

    const success = this.currentAngle >= SAFE_MIN && this.currentAngle <= SAFE_MAX;
    if (success) {
      this._markGameCompleted();
      this._showResult('Tebrikler!', 'Basınç ibresini güvenli aralıkta tuttun.', 'Ana Menüye Dön');
      pulseSuccess(this, [this.panel, this.panelActionBg.face]);
    } else {
      this._showResult('Tekrar dene', 'İbreyi -30 ile +30 arasında tutman gerekiyor.', 'Yeniden Dene');
      shakeSoft(this, this.panel);
    }
  }

  _markGameCompleted() {
    const completedGames = this.registry.get('completedGames') || {};
    this.registry.set('completedGames', { ...completedGames, game5: true });
  }

  _onShutdown() {
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  _showResult(title, body, actionLabel) {
    if (this.overlay) this.overlay.setVisible(true);
    if (this.panel) this.panel.setVisible(true);
    if (this.panelActionBg) this.panelActionBg.setVisible(true);
    if (this.panelTitle) this.panelTitle.setText(title);
    if (this.panelBody) this.panelBody.setText(body);
    if (this.panelActionText) this.panelActionText.setText(actionLabel);
  }

  _onResize(width, height) {
    this.backdrop?.resize(width, height);
    const compact = width < 620;
    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
      this.bgFill.setPosition(0, 0);
    }

    if (this.timerText) {
      this.timerText.setPosition(compact ? 18 : Math.round(width / 2), compact ? 18 : 24);
      this.timerText.setOrigin(compact ? 0 : 0.5, 0);
      this.timerText.setFontSize(compact ? 19 : 24);
    }

    if (this.feedbackText) {
      this.feedbackText.setPosition(Math.round(width / 2), compact ? 68 : 58);
      this.feedbackText.setFontSize(compact ? 16 : 18);
    }

    const meterWidth = Math.round(Math.min(width * (compact ? 0.88 : 0.56), height * 1.05));
    const meterHeight = Math.round(meterWidth * (349 / 667));
    const needleHeight = Math.round(meterHeight * 0.72);
    const centerX = Math.round(width / 2);
    const centerY = Math.round(height * (compact ? 0.47 : 0.52));

    if (this.pressureMeter) {
      this.pressureMeter.setPosition(centerX, centerY);
      this.pressureMeter.setDisplaySize(meterWidth, meterHeight);
    }

    if (this.needle) {
      this.needle.setPosition(centerX, centerY + Math.round(meterHeight * 0.32));
      this.needle.setDisplaySize(Math.max(12, Math.round(needleHeight * (37 / 244))), needleHeight);
      this.needle.setOrigin(0.5, 1);
      this.needle.setAngle(this.currentAngle);
    }

    if (this.leftButton) {
      const x = centerX - Math.round(meterWidth * 0.42);
      this.leftButton.bg.setDisplaySize(compact ? 72 : 88, compact ? 72 : 88);
      this.leftButton.bg.setPosition(x, centerY);
      this.leftButton.text.setPosition(x, centerY);
    }

    if (this.rightButton) {
      const x = centerX + Math.round(meterWidth * 0.42);
      this.rightButton.bg.setDisplaySize(compact ? 72 : 88, compact ? 72 : 88);
      this.rightButton.bg.setPosition(x, centerY);
      this.rightButton.text.setPosition(x, centerY);
    }

    if (this.overlay) {
      this.overlay.setDisplaySize(width, height);
      this.overlay.setPosition(0, 0);
    }

    if (this.panel) {
      this.panel.setPosition(centerX, centerY);
      const panelBg = this.panel.list?.[0];
      if (panelBg?.resizePanel) {
        const panelW = Math.min(440, width - 40);
        panelBg.resizePanel(panelW, 250);
      }
      if (this.panelBody) {
        this.panelBody.setWordWrapWidth(Math.min(340, width - 80));
      }
    }
    this.panelActionBg?.setPosition(centerX, centerY + 78);
    this.panelActionText?.setPosition(centerX, centerY + 78);

    if (this.mainMenuButton) {
      const mx = Math.round(width - (compact ? 72 : 90));
      const my = 34;
      this.mainMenuButton.rect.setDisplaySize(compact ? 132 : 164, compact ? 42 : 46);
      this.mainMenuButton.rect.setPosition(mx, my);
      this.mainMenuButton.txt.setPosition(mx, my);
    }
    this.titleText?.setVisible(!compact);
  }
}
