import Phaser from 'phaser';
import { addBackdrop, createButton, createPanel, pulseSuccess, shakeSoft, UI_COLORS } from '../../ui/gameUi.js';

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/game3/${file}`;
const ICON_KEY_PREFIX = 'game3_icon_';

const OPTIONS = [
  { id: 'card1', label: 'Gaz vanasını kapat', icon: 'valve' },
  { id: 'card2', label: 'Elektrik düğmesine dokun', icon: 'switch', wrongMsg: 'Elektrik düğmeleri kıvılcım oluşturabilir.' },
  { id: 'card3', label: 'Kapı ve pencereleri aç', icon: 'window' },
  { id: 'card4', label: 'Çakmakla kontrol et', icon: 'flame', wrongMsg: 'Ateşle kontrol etmek çok tehlikelidir.' },
  { id: 'card5', label: 'Binadan güvenle çık', icon: 'exit' },
  { id: 'card6', label: '187’yi güvenli yerden ara', icon: 'phone' }
];

const REQUIRED_ORDER = ['card1', 'card3', 'card5', 'card6'];

export default class MiniGame3Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame3');
    this.cards = [];
    this.slots = [];
    this.completed = false;
    this.draggingCard = null;
  }

  preload() {
    OPTIONS.forEach(({ icon }) => {
      const key = `${ICON_KEY_PREFIX}${icon}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, assetUrl(`${icon}.png`));
      }
    });
  }

  create() {
    const { width, height } = this.scale;
    this.cards = [];
    this.slots = [];
    this.completed = false;
    this.draggingCard = null;

    this.backdrop = addBackdrop(this, {
      color: 0xfff7ef,
      accent: UI_COLORS.coral,
      secondary: UI_COLORS.amber,
      depth: -200
    });

    this.eyebrowText = this.add.text(20, 18, 'OYUN 03  •  ACİL DURUM', {
      fontSize: '14px',
      color: '#b94f3c',
      fontStyle: 'bold'
    }).setDepth(60);

    this.instructionText = this.add.text(
      width / 2,
      88,
      'Mutfakta doğal gaz kokusu aldın!\nGüvenli adımları sırayla yerleştir.',
      {
        fontSize: '24px',
        color: '#17324d',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: Math.max(240, width - 48) }
      }
    ).setOrigin(0.5, 0).setDepth(60);

    const menuButton = createButton(this, {
      x: width - 92,
      y: 34,
      width: 164,
      height: 46,
      label: '←  Ana Menü',
      fill: UI_COLORS.navy,
      stroke: 0x9ccbd2,
      fontSize: 15,
      depth: 300,
      onClick: () => this.scene.start('MainMenu')
    });
    this.mainMenuButton = menuButton;

    OPTIONS.forEach((option, index) => this._createCard(option, index));
    REQUIRED_ORDER.forEach((requiredId, index) => this._createSlot(requiredId, index));

    this.feedbackText = this.add.text(width / 2, height - 56, '', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#b95e43',
      padding: { x: 18, y: 10 },
      align: 'center',
      wordWrap: { width: Math.max(220, width - 48) }
    }).setOrigin(0.5).setDepth(500).setVisible(false);

    this._createCompletionUI(width, height);
    this._layout(width, height, false);
    this._animateEntrance();

    this.input.on('dragstart', this._handleDragStart, this);
    this.input.on('drag', this._handleDrag, this);
    this.input.on('dragend', this._handleDragEnd, this);

    this._resizeHandler = (gameSize) => this._onResize(gameSize.width, gameSize.height);
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);
  }

  _createCard(option, index) {
    const panel = createPanel(this, 0, 0, 160, 176, {
      fill: UI_COLORS.paper,
      stroke: 0xf0c4ba,
      radius: 18,
      shadowAlpha: 0.16,
      shadowY: 6
    });
    const badge = this.add.text(0, 0, String(index + 1).padStart(2, '0'), {
      fontSize: '13px',
      color: '#b94f3c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const icon = this.add.image(0, 0, `${ICON_KEY_PREFIX}${option.icon}`).setOrigin(0.5);
    const label = this.add.text(0, 0, option.label, {
      fontSize: '16px',
      color: '#17324d',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 140 }
    }).setOrigin(0.5);
    const hitZone = this.add.zone(0, 0, 150, 166).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const card = this.add.container(0, 0, [panel, badge, icon, label, hitZone]).setDepth(20 + index);
    card.setDataEnabled();
    card.setData({
      id: option.id,
      option,
      panel,
      badge,
      icon,
      label,
      hitZone,
      placed: false,
      homeX: 0,
      homeY: 0
    });
    hitZone.setData('card', card);
    this.input.setDraggable(hitZone);

    hitZone.on('pointerover', () => {
      if (card.getData('placed') || this.draggingCard === card) return;
      this.tweens.add({ targets: card, scale: 1.025, duration: 100, ease: 'Sine.easeOut' });
    });
    hitZone.on('pointerout', () => {
      if (card.getData('placed') || this.draggingCard === card) return;
      this.tweens.add({ targets: card, scale: 1, duration: 100, ease: 'Sine.easeOut' });
    });

    this.cards.push(card);
  }

  _createSlot(requiredId, index) {
    const panel = createPanel(this, 0, 0, 170, 116, {
      fill: 0xffffff,
      fillAlpha: 0.6,
      stroke: index === 0 ? UI_COLORS.blue : 0xb7c6cf,
      strokeAlpha: 0.9,
      lineWidth: index === 0 ? 3 : 2,
      radius: 18,
      shadow: false
    });
    const number = this.add.text(0, -14, String(index + 1), {
      fontSize: '25px',
      color: index === 0 ? '#3d7fc4' : '#91a5b5',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const hint = this.add.text(0, 25, index === 0 ? 'BURAYA BIRAK' : 'SIRAYI BEKLİYOR', {
      fontSize: '11px',
      color: index === 0 ? '#285f9c' : '#7e919f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const slot = this.add.container(0, 0, [panel, number, hint]).setDepth(5);
    slot.setSize(170, 116);
    slot.setDataEnabled();
    slot.setData({
      index,
      requiredId,
      occupied: false,
      active: index === 0,
      panel,
      number,
      hint
    });
    this.slots.push(slot);
  }

  _handleDragStart(pointer, object) {
    const card = object.getData('card');
    if (!card || card.getData('placed') || this.completed) return;
    this.draggingCard = card;
    this.tweens.killTweensOf(card);
    card.setDepth(1000).setScale(1.045);
    card.setData('dragOffsetX', pointer.worldX - card.x);
    card.setData('dragOffsetY', pointer.worldY - card.y);
  }

  _handleDrag(pointer, object) {
    const card = object.getData('card');
    if (!card || card !== this.draggingCard || this.completed) return;
    card.setPosition(
      pointer.worldX - card.getData('dragOffsetX'),
      pointer.worldY - card.getData('dragOffsetY')
    );
  }

  _handleDragEnd(pointer, object) {
    const card = object.getData('card');
    if (!card || card !== this.draggingCard || this.completed) return;
    this.draggingCard = null;
    const activeSlot = this.slots.find((slot) => slot.getData('active') && !slot.getData('occupied'));

    if (!activeSlot || !Phaser.Geom.Intersects.RectangleToRectangle(card.getBounds(), activeSlot.getBounds())) {
      this._returnCard(card);
      return;
    }

    if (card.getData('id') !== activeSlot.getData('requiredId')) {
      const option = card.getData('option');
      const belongsLater = REQUIRED_ORDER.includes(card.getData('id'));
      this._showError(belongsLater
        ? 'Bu güvenli bir adım, ama sırası henüz gelmedi.'
        : (option.wrongMsg || 'Bu davranış güvenli değil. Başka bir kart dene.'));
      shakeSoft(this, card);
      this._returnCard(card, 320);
      return;
    }

    this._placeCard(card, activeSlot, object);
  }

  _returnCard(card, delay = 0) {
    this.time.delayedCall(delay, () => {
      this.tweens.add({
        targets: card,
        x: card.getData('homeX'),
        y: card.getData('homeY'),
        scale: 1,
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => card.setDepth(20 + card.getData('optionIndex'))
      });
    });
  }

  _placeCard(card, slot, hitZone) {
    card.setData('placed', true);
    slot.setData('occupied', true);
    slot.setData('active', false);
    hitZone.disableInteractive();
    this.input.setDraggable(hitZone, false);
    this._styleSlot(slot, 'complete');

    this.tweens.add({
      targets: card,
      x: slot.x,
      y: slot.y,
      scale: 0.72,
      duration: 190,
      ease: 'Back.easeOut',
      onComplete: () => pulseSuccess(this, [card])
    });

    const nextSlot = this.slots[slot.getData('index') + 1];
    if (nextSlot) {
      nextSlot.setData('active', true);
      this._styleSlot(nextSlot, 'active');
      this.tweens.add({
        targets: nextSlot,
        scale: 1.045,
        duration: 160,
        yoyo: true,
        ease: 'Sine.easeOut'
      });
    } else {
      this.time.delayedCall(260, () => this._showCompletionUI());
    }
  }

  _styleSlot(slot, state) {
    const panel = slot.getData('panel');
    const number = slot.getData('number');
    const hint = slot.getData('hint');
    if (state === 'complete') {
      panel.setPanelColors(0xe1f4e8, UI_COLORS.green);
      number.setText('✓').setColor('#2f7c50');
      hint.setText('TAMAMLANDI').setColor('#2f7c50');
    } else {
      panel.setPanelColors(0xeaf3fb, UI_COLORS.blue);
      number.setColor('#3d7fc4');
      hint.setText('BURAYA BIRAK').setColor('#285f9c');
    }
  }

  _showError(message) {
    this.feedbackText.setText(`↻  ${message}`).setVisible(true);
    this.tweens.killTweensOf(this.feedbackText);
    this.feedbackText.setAlpha(1);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      delay: 1450,
      duration: 260,
      onComplete: () => this.feedbackText.setVisible(false).setAlpha(1)
    });
  }

  _layout(width, height, animate = true) {
    const compact = width < 620;
    const columns = compact ? 3 : 6;
    const rows = Math.ceil(this.cards.length / columns);
    const margin = compact ? 16 : Math.max(30, Math.round(width * 0.045));
    const gapX = compact ? 10 : Math.max(16, Math.round(width * 0.018));
    const availableWidth = width - margin * 2 - gapX * (columns - 1);
    const cardWidth = Math.round(Phaser.Math.Clamp(
      availableWidth / columns,
      compact ? 82 : 104,
      compact ? 112 : 190
    ));
    const cardHeight = Math.round(cardWidth * (compact ? 1.04 : 0.9));
    const gapY = compact ? 14 : 0;
    const totalCardsWidth = columns * cardWidth + (columns - 1) * gapX;
    const startX = width / 2 - totalCardsWidth / 2 + cardWidth / 2;
    const mobileCardsTop = Math.max(
      148,
      Math.round((this.instructionText?.y || 70) + (this.instructionText?.height || 58) + 14)
    );
    const cardsCenterY = compact
      ? mobileCardsTop + (rows * cardHeight + (rows - 1) * gapY) / 2
      : height * 0.37;
    const startY = cardsCenterY - ((rows - 1) * (cardHeight + gapY)) / 2;

    this.cards.forEach((card, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = Math.round(startX + col * (cardWidth + gapX));
      const y = Math.round(startY + row * (cardHeight + gapY));
      if (!card.getData('placed')) {
        card.setData('homeX', x);
        card.setData('homeY', y);
        if (animate) this.tweens.add({ targets: card, x, y, duration: 160, ease: 'Sine.easeOut' });
        else card.setPosition(x, y);
      }
      card.setData('optionIndex', index);
      card.setSize(cardWidth, cardHeight);
      card.getData('panel').resizePanel(cardWidth, cardHeight);
      card.getData('badge').setPosition(-cardWidth / 2 + 22, -cardHeight / 2 + 19);
      const iconSize = Math.round(Math.min(58, cardWidth * 0.34));
      card.getData('icon')
        .setPosition(0, -cardHeight * 0.13)
        .setDisplaySize(iconSize, iconSize);
      card.getData('label')
        .setPosition(0, cardHeight * 0.3)
        .setFontSize(compact ? 11 : Phaser.Math.Clamp(cardWidth * 0.09, 13, 17))
        .setWordWrapWidth(cardWidth - 22);
      card.getData('hitZone').setSize(cardWidth, cardHeight);
    });

    const slotColumns = compact ? 2 : 4;
    const slotRows = Math.ceil(this.slots.length / slotColumns);
    const slotGapX = compact ? 18 : Math.max(22, Math.round(width * 0.025));
    const slotWidth = Math.round(Math.min(210, (width - margin * 2 - slotGapX * (slotColumns - 1)) / slotColumns));
    const slotHeight = Math.round(slotWidth * 0.58);
    const slotGapY = compact ? 16 : 0;
    const totalSlotsWidth = slotColumns * slotWidth + (slotColumns - 1) * slotGapX;
    const slotStartX = width / 2 - totalSlotsWidth / 2 + slotWidth / 2;
    const cardsBottom = startY + (rows - 1) * (cardHeight + gapY) + cardHeight / 2;
    const slotsCenterY = compact
      ? cardsBottom + 30 + (slotRows * slotHeight + (slotRows - 1) * slotGapY) / 2
      : height * 0.7;
    const slotStartY = slotsCenterY - ((slotRows - 1) * (slotHeight + slotGapY)) / 2;

    this.slots.forEach((slot, index) => {
      const col = index % slotColumns;
      const row = Math.floor(index / slotColumns);
      slot.setPosition(
        Math.round(slotStartX + col * (slotWidth + slotGapX)),
        Math.round(slotStartY + row * (slotHeight + slotGapY))
      );
      slot.setSize(slotWidth, slotHeight);
      slot.getData('panel').resizePanel(slotWidth, slotHeight);
      slot.getData('number').setPosition(0, -slotHeight * 0.13);
      slot.getData('hint').setPosition(0, slotHeight * 0.25);
    });
  }

  _animateEntrance() {
    this.cards.forEach((card, index) => {
      const targetY = card.y;
      card.setAlpha(0).setY(targetY + 22);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: targetY,
        duration: 260,
        delay: index * 45,
        ease: 'Cubic.easeOut'
      });
    });
  }

  _createCompletionUI(width, height) {
    this.completionOverlay = this.add.rectangle(0, 0, width, height, 0x102a3d, 0.72)
      .setOrigin(0)
      .setDepth(5000)
      .setVisible(false)
      .setInteractive();

    this.completionPanel = this.add.container(width / 2, height / 2).setDepth(5001).setVisible(false);
    const panelBg = createPanel(this, 0, 0, Math.min(460, width - 40), 238, {
      fill: UI_COLORS.paper,
      stroke: 0xb8d8c6,
      radius: 24,
      shadowAlpha: 0.24
    });
    const title = this.add.text(0, -56, '✓  Harika, doğru sıralama!', {
      fontSize: '27px',
      color: '#2f7c50',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    const body = this.add.text(0, -8, 'Vanayı kapat, ortamı havalandır, dışarı çık ve 187’yi güvenli bir yerden ara.', {
      fontSize: '17px',
      color: '#49657d',
      align: 'center',
      wordWrap: { width: Math.min(370, width - 80) }
    }).setOrigin(0.5);
    this.completionPanel.add([panelBg, title, body]);

    this.completionButton = createButton(this, {
      x: width / 2,
      y: height / 2 + 70,
      width: 228,
      height: 54,
      label: 'Ana Menüye Dön  ›',
      fill: UI_COLORS.green,
      stroke: 0xd8f5e3,
      depth: 5002,
      onClick: () => this.scene.start('MainMenu')
    });
    this.completionButton.bg.setVisible(false);
  }

  _showCompletionUI() {
    if (this.completed) return;
    this.completed = true;
    const completedGames = this.registry.get('completedGames') || {};
    this.registry.set('completedGames', { ...completedGames, game3: true });
    this.instructionText.setText('Tebrikler, başardın!');
    this.completionOverlay.setVisible(true);
    this.completionPanel.setVisible(true).setScale(0.92).setAlpha(0);
    this.completionButton.bg.setVisible(true);
    this.tweens.add({
      targets: this.completionPanel,
      alpha: 1,
      scale: 1,
      duration: 230,
      ease: 'Back.easeOut'
    });
  }

  _onResize(width, height) {
    const compact = width < 620;
    this.backdrop?.resize(width, height);
    this.eyebrowText
      ?.setPosition(compact ? 14 : 20, compact ? 16 : 18)
      .setFontSize(compact ? 11 : 14);
    this.mainMenuButton?.bg
      .setDisplaySize(compact ? 132 : 164, compact ? 42 : 46)
      .setPosition(width - (compact ? 72 : 92), 34);
    this.mainMenuButton?.text
      .setPosition(width - (compact ? 72 : 92), 34)
      .setFontSize(compact ? 13 : 15);
    this.instructionText
      ?.setPosition(width / 2, compact ? 70 : 88)
      .setFontSize(compact ? 17 : 24)
      .setLineSpacing(compact ? 2 : 7)
      .setWordWrapWidth(Math.max(220, width - (compact ? 28 : 48)));
    this.feedbackText
      ?.setPosition(width / 2, height - 56)
      .setWordWrapWidth(Math.max(220, width - 48));
    this.completionOverlay?.setDisplaySize(width, height).setPosition(0, 0);
    this.completionPanel?.setPosition(width / 2, height / 2);
    this.completionButton?.bg.setPosition(width / 2, height / 2 + 70);
    this._layout(width, height);
  }

  _onShutdown() {
    this.input.off('dragstart', this._handleDragStart, this);
    this.input.off('drag', this._handleDrag, this);
    this.input.off('dragend', this._handleDragEnd, this);
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }
}
