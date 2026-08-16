import Phaser from 'phaser';
import { addBackdrop, createButton, createPanel, pulseSuccess, shakeSoft, UI_COLORS } from '../../ui/gameUi.js';

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/game5/${file}`;

const SAFE_MIN = -31;
const SAFE_MAX = 32;
const showSafeAngles = false;
const TIMER_SECONDS = 30;
const NEEDLE_MIN = -90;
const NEEDLE_MAX = 90;
const REQUIRED_SAFE_SECONDS = 20;
const REQUIRED_INPUTS = 4;

export default class MiniGame5Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame5');
    this.valve = null;
    this.pressureMeter = null;
    this.needle = null;
    this.safeMinNeedle = null;
    this.safeMaxNeedle = null;
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
    this.lastDisplayedSecond = TIMER_SECONDS;
    this.elapsedTime = 0;
    this.safeElapsed = 0;
    this.inputCount = 0;
    this.inputCooldown = 0;
    this.resultAction = 'restart';
    this.transitioning = false;
    this.cursors = null;
    this.mainMenuButton = null;
  }

  preload() {
    this.load.image('game5_valve', assetUrl('vana.png'));
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
    this.elapsedTime = 0;
    this.safeElapsed = 0;
    this.inputCount = 0;
    this.inputCooldown = 0;
    this.resultAction = 'restart';
    this.transitioning = false;

    this.backdrop = addBackdrop(this, { color: 0xf3f0fb, accent: UI_COLORS.lavender, secondary: UI_COLORS.teal, depth: -200 });
    this.bgFill = this.add.rectangle(0, 0, width, height, 0xf3f0fb, 0.3).setOrigin(0).setDepth(-100);
    this.titleText = this.add.text(20, 18, 'OYUN 05  •  BASINÇ USTASI', { fontSize: '14px', color: '#564695', fontStyle: 'bold' }).setDepth(50);
    const menuButton = createButton(this, {
      x: width - 92, y: 34, width: 164, height: 46, label: '←  Ana Menü',
      fill: UI_COLORS.navy, stroke: 0x9ccbd2, fontSize: 15, depth: 1200,
      onClick: () => this._goToMainMenu()
    });
    this.mainMenuButton = { rect: menuButton.bg, txt: menuButton.text };

    this.timerText = this.add.text(width / 2, 24, `Süre: ${TIMER_SECONDS}`, {
      fontSize: '24px',
      color: '#17324d'
    }).setOrigin(0.5, 0).setDepth(60);
    this.feedbackText = this.add.text(width / 2, 58, 'İbreyi ortada tut.', {
      fontSize: '18px',
      color: '#564695',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(60);

    this.valve = this.add.image(width / 2, height / 2 + 140, 'game5_valve').setOrigin(0.5).setDepth(12);
    this.pressureMeter = this.add.image(width / 2, height / 2, 'game5_pressure_meter').setOrigin(0.5).setDepth(10);
    this.needle = this.add.image(width / 2, height / 2, 'game5_needle').setOrigin(0.5, 1).setDepth(20);
    if (showSafeAngles) {
      this.safeMinNeedle = this.add.image(width / 2, height / 2, 'game5_needle').setOrigin(0.5, 1).setDepth(19).setAlpha(0.45);
      this.safeMaxNeedle = this.add.image(width / 2, height / 2, 'game5_needle').setOrigin(0.5, 1).setDepth(19).setAlpha(0.45);
      this.safeMinNeedle.setAngle(SAFE_MIN);
      this.safeMaxNeedle.setAngle(SAFE_MAX);
    }
    this.currentAngle = 0;
    this.angularVelocity = 0;
    this.needle.setAngle(this.currentAngle);

    this.leftButton = this._createButton(width / 2 - 190, height / 2, '◀', () => this._nudgeNeedle(-10));
    this.rightButton = this._createButton(width / 2 + 190, height / 2, '▶', () => this._nudgeNeedle(10));

    this.cursors = this.input.keyboard.createCursorKeys();
    this.lastDisplayedSecond = TIMER_SECONDS;

    this.overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.68)
      .setOrigin(0)
      .setDepth(1000)
      .setVisible(false)
      .setInteractive();

    this.panel = this.add.container(width / 2, height / 2).setDepth(1001).setVisible(false);
    const panelBg = createPanel(this, 0, 0, Math.min(440, width - 40), 250, {
      fill: UI_COLORS.paper, stroke: 0xc9c0e8, radius: 24, shadow: false
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
      if (this.resultAction === 'menu') this._goToMainMenu();
      else this._restartGame();
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
    this._animateValve(Math.sign(delta));
    this.inputCount += 1;
    this.angularVelocity += delta * 0.9;
    this.manualForce += delta * 0.35;
  }

  _animateValve(direction) {
    if (!this.valve || this.isFinished || direction === 0) return;
    this.tweens.killTweensOf(this.valve);
    this.valve.setAngle(0);
    this.tweens.add({
      targets: this.valve,
      angle: direction < 0 ? -30 : 30,
      duration: 90,
      ease: 'Sine.Out',
      yoyo: true,
      hold: 20
    });
  }

  _stepPhysics(deltaSeconds, elapsedSeconds) {
    // Basınç iki farklı ritimde sürekli değişir. Mevcut açı da dışarı doğru
    // küçük bir ivme üretir; oyuncu yön tuşlarıyla düzenli karşılık vermelidir.
    const pressureWave = Math.sin(elapsedSeconds * 1.08) * 18
      + Math.sin(elapsedSeconds * 2.37 + 1.15) * 10
      + Math.cos(elapsedSeconds * 0.41 + 0.55) * 7;
    const destabilizingForce = this.currentAngle * 0.08;
    const inputForce = this.manualForce;

    this.angularVelocity += (destabilizingForce + pressureWave + inputForce) * deltaSeconds;
    this.angularVelocity *= Math.exp(-0.85 * deltaSeconds);
    this.angularVelocity = Phaser.Math.Clamp(this.angularVelocity, -58, 58);
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

    // Büyük kare gecikmelerini sınırlamak, sekme geri geldiğinde fiziğin ve
    // sayacın bir anda sona atlayıp sahneyi kilitlenmiş gibi göstermesini önler.
    const totalDelta = Math.min(Math.max(delta, 0) / 1000, 0.12);
    this.elapsedTime += totalDelta;
    this.countdown = Math.max(0, this.countdown - totalDelta);
    this.inputCooldown = Math.max(0, this.inputCooldown - totalDelta);

    const heldDirection = Number(Boolean(this.cursors?.right?.isDown))
      - Number(Boolean(this.cursors?.left?.isDown));
    if (heldDirection !== 0 && this.inputCooldown <= 0) {
      this._nudgeNeedle(heldDirection * 8);
      this.inputCooldown = 0.14;
    }

    const displayedSecond = Math.ceil(this.countdown);
    if (displayedSecond !== this.lastDisplayedSecond) {
      this.lastDisplayedSecond = displayedSecond;
      this.timerText.setText(`Süre: ${displayedSecond}`);
    }

    const stepCount = Math.max(1, Math.ceil(totalDelta / (1 / 60)));
    const step = totalDelta / stepCount;
    for (let index = 0; index < stepCount; index += 1) {
      this._stepPhysics(step, this.elapsedTime - totalDelta + step * (index + 1));
    }
    this._syncNeedle();

    if (this.currentAngle >= SAFE_MIN && this.currentAngle <= SAFE_MAX) {
      this.safeElapsed += totalDelta;
    }

    if (this.countdown <= 0) {
      this._finishGame();
    }
  }

  _finishGame() {
    if (this.isFinished) return;
    this.isFinished = true;

    const success = this.currentAngle >= SAFE_MIN
      && this.currentAngle <= SAFE_MAX
      && this.safeElapsed >= REQUIRED_SAFE_SECONDS
      && this.inputCount >= REQUIRED_INPUTS;
    if (success) {
      this._markGameCompleted();
      this._showResult('Tebrikler!', 'Basınç ibresini güvenli aralıkta tuttun.', 'Ana Menüye Dön', 'menu');
      pulseSuccess(this, [this.panel, this.panelActionBg.face]);
    } else {
      const body = this.inputCount < REQUIRED_INPUTS
        ? 'Basınç kendiliğinden değişir. Yön tuşlarıyla aktif olarak dengele.'
        : 'İbreyi güvenli bölgede daha uzun süre tutmalısın.';
      this._showResult('Tekrar dene', body, 'Yeniden Dene', 'restart');
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

  _showResult(title, body, actionLabel, action = 'restart') {
    this.resultAction = action;
    if (this.overlay) this.overlay.setVisible(true);
    if (this.panel) this.panel.setVisible(true);
    if (this.panelActionBg) this.panelActionBg.setVisible(true);
    if (this.panelTitle) this.panelTitle.setText(title);
    if (this.panelBody) this.panelBody.setText(body);
    if (this.panelActionText) this.panelActionText.setText(actionLabel);
  }

  _goToMainMenu() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start('MainMenu');
  }

  _restartGame() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.restart();
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

    const meterWidth = Math.round(compact
      ? Math.min(width * 0.78, height * 0.5)
      : Math.min(width * 0.5, height * 0.64));
    const meterHeight = Math.round(meterWidth * (349 / 667));
    const needleHeight = Math.round(meterHeight * 0.72);
    const valveWidth = Math.round(meterWidth * (compact ? 0.42 : 0.36));
    const centerX = Math.round(width / 2);
    const centerY = Math.round(height * (compact ? 0.39 : 0.48));

    if (this.valve) {
      const source = this.valve.texture.getSourceImage();
      const scale = valveWidth / Math.max(1, source.width);
      this.valve.setPosition(centerX, centerY + Math.round(meterHeight * 0.86));
      this.valve.setScale(scale);
    }

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

    if (this.safeMinNeedle) {
      this.safeMinNeedle.setPosition(centerX, centerY + Math.round(meterHeight * 0.32));
      this.safeMinNeedle.setDisplaySize(Math.max(12, Math.round(needleHeight * (37 / 244))), needleHeight);
      this.safeMinNeedle.setOrigin(0.5, 1);
      this.safeMinNeedle.setAngle(SAFE_MIN);
    }

    if (this.safeMaxNeedle) {
      this.safeMaxNeedle.setPosition(centerX, centerY + Math.round(meterHeight * 0.32));
      this.safeMaxNeedle.setDisplaySize(Math.max(12, Math.round(needleHeight * (37 / 244))), needleHeight);
      this.safeMaxNeedle.setOrigin(0.5, 1);
      this.safeMaxNeedle.setAngle(SAFE_MAX);
    }

    if (this.leftButton) {
      const x = compact ? 48 : centerX - Math.round(meterWidth * 0.7);
      this.leftButton.bg.setDisplaySize(compact ? 62 : 88, compact ? 62 : 88);
      this.leftButton.bg.setPosition(x, centerY);
      this.leftButton.text.setPosition(x, centerY).setFontSize(compact ? 31 : 38);
    }

    if (this.rightButton) {
      const x = compact ? width - 48 : centerX + Math.round(meterWidth * 0.7);
      this.rightButton.bg.setDisplaySize(compact ? 62 : 88, compact ? 62 : 88);
      this.rightButton.bg.setPosition(x, centerY);
      this.rightButton.text.setPosition(x, centerY).setFontSize(compact ? 31 : 38);
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
      this.mainMenuButton.txt.setPosition(mx, my).setFontSize(compact ? 13 : 15);
    }
    this.titleText?.setVisible(!compact);
  }
}
