import Phaser from 'phaser';
import { addBackdrop, createButton, createHeader, createPanel, UI_COLORS } from '../ui/gameUi.js';

const GAME_CARDS = [
  { key: 'game1', scene: 'MiniGame1', number: '01', title: 'Doğru Seçimi Bul', subtitle: 'Güvenli davranışı seç', color: 0x3d7fc4, icon: 'choice' },
  { key: 'game2', scene: 'MiniGame2', number: '02', title: 'Tehlikeyi Bul', subtitle: 'Riskleri fark et', color: 0x1f9d8b, icon: 'search' },
  { key: 'game3', scene: 'MiniGame3', number: '03', title: 'Gaz Kaçağı', subtitle: 'Adımları sırala', color: 0xe97862, icon: 'steps' },
  { key: 'game4', scene: 'MiniGame4', number: '04', title: 'GAZO ve Menfezler', subtitle: 'Hava yolunu aç', color: 0xf2b84b, icon: 'vent' },
  { key: 'game5', scene: 'MiniGame5', number: '05', title: 'Basınç Ustası', subtitle: 'İbreyi dengede tut', color: 0x7768b5, icon: 'gauge' }
];

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
    this.cards = [];
    this.header = null;
    this.backdrop = null;
    this.completedGamesKey = 'completedGames';
    this.allGamesCelebratedKey = 'allGamesCelebrated';
    this.celebration = null;
    this._resizeHandler = null;
  }

  preload() {
    if (!this.textures.exists('game3_main_icon')) {
      this.load.image('game3_main_icon', `${import.meta.env.BASE_URL}assets/game3/icon.png`);
    }
  }

  create() {
    this.backdrop = addBackdrop(this, { color: UI_COLORS.cream, accent: UI_COLORS.teal, secondary: UI_COLORS.amber });
    this.header = createHeader(
      this,
      'Doğal Gaz Güvenliği',
      'Öğren, uygula ve günlük yaşamda güvenli seçimler yap.'
    );
    this.header.eyebrow.setDepth(20);
    this.header.heading.setDepth(20);
    this.header.subheading.setDepth(20);

    const completedGames = this.registry.get(this.completedGamesKey) || {};
    this.cards = GAME_CARDS.map((game, index) => this._createGameCard(game, index, Boolean(completedGames[game.key])));

    this._positionMenu(this.scale.width, this.scale.height);
    const allGamesCompleted = GAME_CARDS.every((game) => Boolean(completedGames[game.key]));
    if (allGamesCompleted && !this.registry.get(this.allGamesCelebratedKey)) {
      this.registry.set(this.allGamesCelebratedKey, true);
      this._showAllGamesCelebration();
    }
    this._resizeHandler = (gameSize) => this._positionMenu(gameSize.width, gameSize.height);
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);
  }

  _createGameCard(game, index, completed) {
    const shadow = this.add.graphics().setDepth(5);
    const surface = this.add.graphics().setDepth(6);
    const icon = this.add.graphics().setDepth(8);
    const pngIcon = this.add.image(0, 0, 'game3_main_icon').setOrigin(0.5).setDepth(9).setVisible(game.key === 'game3');
    const number = this.add.text(0, 0, `${completed ? '✓  ' : ''}OYUN ${game.number}`, {
      fontSize: '12px',
      color: '#49657d',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(8);
    const title = this.add.text(0, 0, game.title, {
      fontSize: '20px',
      color: '#17324d',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(8);
    const subtitle = this.add.text(0, 0, game.subtitle, {
      fontSize: '14px',
      color: '#667d90'
    }).setOrigin(0, 0.5).setDepth(8);
    const action = this.add.text(0, 0, completed ? 'Tekrar Oyna  ›' : 'Oyna  ›', {
      fontSize: '14px',
      color: completed ? '#2f7c50' : '#17324d',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(8);
    const hit = this.add.zone(0, 0, 10, 10).setOrigin(0.5).setDepth(10);
    const state = { x: 0, y: 0, width: 240, height: 132, completed, over: false, down: false };

    const redraw = () => {
      const { x, y, width, height } = state;
      const phoneCard = width < 220;
      const radius = Math.min(22, height * 0.18);
      const left = x - width / 2;
      const top = y - height / 2;
      const iconInset = phoneCard ? 10 : 14;
      const iconColumnWidth = phoneCard ? 54 : 66;
      const iconCenterX = left + iconInset + iconColumnWidth / 2;
      const iconVerticalInset = phoneCard ? 10 : 14;
      shadow.clear().fillStyle(UI_COLORS.shadow, completed ? 0.07 : 0.13)
        .fillRoundedRect(left, top + (state.over ? 4 : 7), width, height, radius);
      surface.clear();
      surface.fillStyle(completed ? 0xf3f7f5 : 0xffffff, 0.98);
      surface.fillRoundedRect(left, top - (state.over ? 3 : 0), width, height, radius);
      surface.lineStyle(2, completed ? 0xb8d8c6 : game.color, completed ? 0.75 : 0.42);
      surface.strokeRoundedRect(left, top - (state.over ? 3 : 0), width, height, radius);
      surface.fillStyle(completed ? 0x8fbda2 : game.color, completed ? 0.22 : 0.13);
      surface.fillRoundedRect(
        left + iconInset,
        top + iconVerticalInset - (state.over ? 3 : 0),
        iconColumnWidth,
        height - iconVerticalInset * 2,
        Math.min(phoneCard ? 14 : 17, radius)
      );

      if (game.key === 'game3') {
        icon.clear();
        pngIcon.setVisible(true);
        const iconSize = Math.min(phoneCard ? 42 : 50, Math.max(30, height * 0.36));
        pngIcon.setPosition(iconCenterX, y - (state.over ? 3 : 0)).setDisplaySize(iconSize, iconSize);
        return;
      }

      pngIcon.setVisible(false);
      this._drawCardIcon(icon, game.icon, iconCenterX, y - (state.over ? 3 : 0), completed ? UI_COLORS.greenDark : game.color, height);
    };

    {
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        state.over = true;
        redraw();
        this.tweens.add({ targets: [number, title, subtitle, action], y: '-=3', duration: 110, ease: 'Sine.easeOut' });
      });
      hit.on('pointerout', () => {
        state.over = false;
        state.down = false;
        redraw();
        this._positionCardText({ number, title, subtitle, action, state });
      });
      hit.on('pointerdown', () => {
        state.down = true;
        surface.setAlpha(0.9);
        this.tweens.add({ targets: [number, title, subtitle, action], scaleX: 0.985, scaleY: 0.985, duration: 60 });
      });
      hit.on('pointerup', () => {
        state.down = false;
        surface.setAlpha(1);
        this.tweens.add({
          targets: [number, title, subtitle, action],
          scaleX: 1,
          scaleY: 1,
          duration: 70,
          onComplete: () => this.scene.start(game.scene)
        });
      });
    }

    const card = { game, index, completed, shadow, surface, icon, pngIcon, number, title, subtitle, action, hit, state, redraw };
    return card;
  }

  _drawCardIcon(graphics, type, x, y, color, cardHeight) {
    const size = Phaser.Math.Clamp(cardHeight * 0.2, 14, 25);
    graphics.clear().lineStyle(3, color, 1).fillStyle(color, 0.12);

    if (type === 'search') {
      graphics.strokeCircle(x - 4, y - 4, size * 0.65);
      graphics.lineBetween(x + 7, y + 7, x + 18, y + 18);
    } else if (type === 'steps') {
      graphics.strokeRoundedRect(x - 20, y - 17, 15, 15, 4);
      graphics.strokeRoundedRect(x - 7, y - 7, 15, 15, 4);
      graphics.strokeRoundedRect(x + 6, y + 3, 15, 15, 4);
    } else if (type === 'vent') {
      for (let row = -1; row <= 1; row += 1) graphics.lineBetween(x - 20, y + row * 10, x + 20, y + row * 10);
      graphics.strokeRoundedRect(x - 24, y - 20, 48, 40, 8);
    } else if (type === 'gauge') {
      graphics.beginPath().arc(x, y + 8, size, Math.PI, Math.PI * 2).strokePath();
      graphics.lineBetween(x, y + 8, x + 12, y - 6);
      graphics.fillCircle(x, y + 8, 4);
    } else if (type === 'badge') {
      graphics.strokeCircle(x, y - 3, size * 0.8);
      graphics.lineBetween(x - 9, y + 14, x - 14, y + 24);
      graphics.lineBetween(x + 9, y + 14, x + 14, y + 24);
      graphics.lineBetween(x - 9, y, x - 2, y + 7);
      graphics.lineBetween(x - 2, y + 7, x + 11, y - 8);
    } else {
      graphics.strokeRoundedRect(x - 22, y - 17, 44, 34, 9);
      graphics.lineBetween(x - 9, y, x - 2, y + 8);
      graphics.lineBetween(x - 2, y + 8, x + 13, y - 10);
    }
  }

  _positionCardText(card) {
    const { state, number, title, subtitle, action } = card;
    const left = state.x - state.width / 2;
    const phoneCard = state.width < 220;
    const textX = phoneCard
      ? left + 72
      : left + Math.min(98, Math.max(82, state.width * 0.36));
    const compact = state.height < 105;
    const narrow = state.width < 250;
    number.setPosition(textX, state.y - state.height * 0.29).setFontSize(phoneCard ? 9 : compact ? 10 : 12);
    title
      .setPosition(textX, state.y - (phoneCard ? 4 : narrow ? 2 : 3))
      .setFontSize(phoneCard ? 14 : compact || narrow ? 16 : 19)
      .setLineSpacing(phoneCard ? -2 : 0);
    title.setWordWrapWidth(Math.max(72, state.width - (textX - left) - (phoneCard ? 10 : 18)), true);
    subtitle.setVisible(!narrow).setPosition(textX, state.y + state.height * 0.25).setFontSize(compact ? 11 : 13);
    subtitle.setWordWrapWidth(Math.max(70, state.width - (textX - left) - 70));
    action
      .setPosition(state.x + state.width / 2 - (phoneCard ? 10 : 17), state.y + state.height * (phoneCard ? 0.33 : narrow ? 0.31 : 0.25))
      .setFontSize(phoneCard ? 10 : compact ? 11 : 13);
  }

  _positionMenu(width, height) {
    this._layoutWidth = width;
    this._layoutHeight = height;
    this.backdrop?.resize(width, height);
    const phoneLayout = width < 560;
    const compactHeight = height < 650;
    const top = phoneLayout ? Math.max(18, height * 0.03) : compactHeight ? 22 : Math.max(28, height * 0.055);
    this.header.eyebrow.setPosition(width / 2, top).setFontSize(phoneLayout ? 9 : width < 520 ? 10 : 13);
    this.header.heading
      .setPosition(width / 2, top + (phoneLayout ? 30 : compactHeight ? 28 : 38))
      .setFontSize(phoneLayout ? 23 : width < 520 ? 25 : compactHeight ? 28 : 34);
    this.header.subheading
      .setPosition(width / 2, top + (phoneLayout ? 66 : compactHeight ? 61 : 80))
      .setFontSize(phoneLayout ? 12 : width < 520 ? 13 : 16)
      .setWordWrapWidth(Math.min(680, width - (phoneLayout ? 24 : 36)));

    const cols = width >= 720 ? 3 : width >= 340 ? 2 : 1;
    const rows = Math.ceil(this.cards.length / cols);
    const sideMargin = phoneLayout ? 12 : Phaser.Math.Clamp(width * 0.055, 16, 64);
    const gapX = phoneLayout ? 8 : Phaser.Math.Clamp(width * 0.022, 10, 24);
    const gridTop = top + (phoneLayout ? 98 : compactHeight ? 91 : 118);
    const bottomMargin = phoneLayout || compactHeight ? 14 : 28;
    const gapY = phoneLayout ? 10 : Phaser.Math.Clamp(height * 0.022, 9, 20);
    const cardWidth = Math.min(360, (width - sideMargin * 2 - gapX * (cols - 1)) / cols);
    const availableHeight = Math.max(180, height - gridTop - bottomMargin - gapY * (rows - 1));
    const cardHeight = Math.min(phoneLayout ? 142 : 150, availableHeight / rows);
    const gridWidth = cardWidth * cols + gapX * (cols - 1);
    const gridHeight = cardHeight * rows + gapY * (rows - 1);
    const startX = width / 2 - gridWidth / 2 + cardWidth / 2;
    const centeredOffset = Math.max(0, (availableHeight - gridHeight) / 2);
    const startY = gridTop + (phoneLayout ? Math.min(36, centeredOffset) : centeredOffset) + cardHeight / 2;
    const remainder = this.cards.length % cols;
    const lastRowCount = remainder === 0 ? cols : remainder;

    this.cards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const isLastRow = row === rows - 1;
      const rowCount = isLastRow ? lastRowCount : cols;
      const rowWidth = cardWidth * rowCount + gapX * (rowCount - 1);
      const rowStartX = width / 2 - rowWidth / 2 + cardWidth / 2;
      card.state.x = rowStartX + col * (cardWidth + gapX);
      card.state.y = startY + row * (cardHeight + gapY);
      card.state.width = cardWidth;
      card.state.height = cardHeight;
      card.hit.setPosition(card.state.x, card.state.y).setSize(cardWidth, cardHeight);
      card.redraw();
      this._positionCardText(card);
    });
    this._positionCelebration(width, height);
  }

  update() {
    // Resize olayı tarayıcı tarafından geciktirilse bile menünün eski ekran
    // koordinatlarında kalmasına izin verme.
    if (this._layoutWidth !== this.scale.width || this._layoutHeight !== this.scale.height) {
      this._positionMenu(this.scale.width, this.scale.height);
    }
  }

  _showAllGamesCelebration() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, UI_COLORS.navy, 0.72)
      .setOrigin(0)
      .setDepth(500)
      .setInteractive();

    const panel = this.add.container(width / 2, height / 2).setDepth(502);
    const panelBg = createPanel(this, 0, 0, Math.min(520, width - 40), 286, {
      fill: UI_COLORS.paper,
      stroke: 0xb8d8c6,
      radius: 28,
      shadowAlpha: 0.28,
      shadowY: 10
    });
    const badge = this.add.text(0, -86, '★', {
      fontSize: '44px',
      color: '#f2b84b',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const title = this.add.text(0, -28, 'Tebrikler!', {
      fontSize: '34px',
      color: '#2f7c50',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    const body = this.add.text(
      0,
      34,
      'Tüm doğal gaz güvenliği oyunlarını tamamladın.\nArtık istediğin oyunu yeniden oynayabilirsin.',
      {
        fontSize: '18px',
        color: '#49657d',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: Math.min(410, width - 84) }
      }
    ).setOrigin(0.5);
    panel.add([panelBg, badge, title, body]);

    const button = createButton(this, {
      x: width / 2,
      y: height / 2 + 96,
      width: 232,
      height: 54,
      label: 'Oyunlara Dön  ›',
      fill: UI_COLORS.green,
      stroke: 0xd8f5e3,
      depth: 503
    });

    const colors = [
      UI_COLORS.teal,
      UI_COLORS.amber,
      UI_COLORS.coral,
      UI_COLORS.blue,
      UI_COLORS.lavender,
      UI_COLORS.green
    ];
    const confetti = Array.from({ length: 22 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 22;
      const distance = 170 + (index % 4) * 26;
      const dot = this.add.circle(width / 2, height / 2 - 70, 4 + (index % 3), colors[index % colors.length])
        .setDepth(501)
        .setAlpha(0);
      this.tweens.add({
        targets: dot,
        x: width / 2 + Math.cos(angle) * distance,
        y: height / 2 - 40 + Math.sin(angle) * distance * 0.65,
        alpha: { from: 0, to: 0.85 },
        scale: { from: 0.4, to: 1 },
        duration: 520,
        delay: index * 12,
        ease: 'Cubic.easeOut'
      });
      return { dot, angle, distance };
    });

    button.bg.on('pointerup', () => {
      overlay.setVisible(false);
      panel.setVisible(false);
      button.bg.setVisible(false);
      confetti.forEach(({ dot }) => dot.setVisible(false));
    });

    panel.setScale(0.9).setAlpha(0);
    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut'
    });

    this.celebration = { overlay, panel, panelBg, body, button, confetti };
  }

  _positionCelebration(width, height) {
    if (!this.celebration) return;
    const { overlay, panel, panelBg, body, button, confetti } = this.celebration;
    overlay.setDisplaySize(width, height).setPosition(0, 0);
    panel.setPosition(width / 2, height / 2);
    panelBg.resizePanel(Math.min(520, width - 40), 286);
    body.setWordWrapWidth(Math.min(410, width - 84));
    button.bg.setPosition(width / 2, height / 2 + 96);
    confetti.forEach(({ dot, angle, distance }) => {
      dot.setPosition(
        width / 2 + Math.cos(angle) * distance,
        height / 2 - 40 + Math.sin(angle) * distance * 0.65
      );
    });
  }

  _onShutdown() {
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }
}
