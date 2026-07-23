import Phaser from 'phaser';
import { createButton, createPanel, pulseSuccess, UI_COLORS } from '../../ui/gameUi.js';

// Item definitions: keys, file paths and relative positions/sizes (percent of game size)
// pos: { x: 0..1, y: 0..1 } relative to width/height
// size: width as percent of game width (0..1)
const ITEM_DEFS = {
  item1: {
    keys: ['game2_menfez_off', 'game2_menfez_on'],
    paths: ['/assets/game2/menfez_off.png', '/assets/game2/menfez_on.png'],
    pos: { x: 0.65, y: 0.20 },
    size: 0.10,
    desc: 'Menfez kapatılırsa temiz hava girişi engellenir ve gaz birikmesi yaşanabilir.'
  },
  item2: {
    keys: ['game2_ocak_off', 'game2_ocak_on'],
    paths: ['/assets/game2/ocak_off.png', '/assets/game2/ocak_on.png'],
    pos: { x: 0.58, y: 0.75 },
    size: 0.28,
    desc: 'Açık ocak unutulursa gaz kaçağı ve patlama riski olabilir.'
  },
  item3: {
    keys: ['game2_hortum_off', 'game2_hortum_on'],
    paths: ['/assets/game2/hortum_off.png', '/assets/game2/hortum_on.png'],
    pos: { x: 0.125, y: 0.63 },
    size: 0.25,
    desc: 'Gevşek hortum kaçak yapabilir; bağlantılar sağlam olmalıdır.'
  },
  item4: {
    keys: ['game2_kombi_off', 'game2_kombi_on'],
    paths: ['/assets/game2/kombi_off.png', '/assets/game2/kombi_on.png'],
    pos: { x: 0.21, y: 0.30 },
    size: 0.20,
    desc: 'Kombi etrafının kapatılması havalandırmayı engeller; boşluk bırakılmalı.'
  }
};

export default class MiniGame2Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame2');
    this.itemSprites = {};
    this.itemState = {};
    this.completed = false;
    this.mainMenuButton = null;
    this.completionOverlay = null;
    this.completionPanel = null;
    this.completionTitle = null;
    this.completionBody = null;
    this.completionButton = null;
  }

  preload() {
    // Background (user will place actual image at this path)
    // Load from `public/assets` (served at `/assets/...`) so build/preview can find them
    this.load.image('game2_bg', '/assets/game2/background.png');

    // Load item image pairs from ITEM_DEFS
    Object.keys(ITEM_DEFS).forEach((id) => {
      const def = ITEM_DEFS[id];
      // keys[0] = unclicked, keys[1] = clicked (public folder: /assets/...)
      this.load.image(def.keys[0], def.paths[0]);
      this.load.image(def.keys[1], def.paths[1]);
    });
  }

  create() {
    this.itemSprites = {};
    this.itemState = {};
    this.completed = false;

    // Match Mini Game 1's warm navy letterbox/pillarbox color.
    this.bgFill = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x102a3d).setOrigin(0).setDepth(-100);
    // Background image (keep reference so we can resize it later). Centered
    this.bg = this.add.image(Math.round(this.scale.width / 2), Math.round(this.scale.height / 2), 'game2_bg').setOrigin(0.5).setDepth(-50);

    // Info box (hidden initially)
    this.infoBox = this.add.container(this.scale.width / 2, Math.round(this.scale.height * 0.12)).setDepth(100).setVisible(false);
    this.infoBg = createPanel(this, 0, 0, Math.min(700, Math.round(this.scale.width * 0.9)), 80, {
      fill: UI_COLORS.navy, fillAlpha: 0.94, stroke: 0x9ccbd2, radius: 18, shadow: true
    });
    this.infoText = this.add.text(-Math.min(700, Math.round(this.scale.width * 0.9)) / 2 + 20, -24, '', {
      fontSize: '17px', color: '#ffffff', wordWrap: { width: Math.min(700, Math.round(this.scale.width * 0.9)) - 48 }
    });
    this.infoBox.add([this.infoBg, this.infoText]);

    this.completionOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(5000)
      .setVisible(false)
      .setInteractive();

    this.completionPanel = this.add.container(this.scale.width / 2, this.scale.height / 2).setDepth(5001).setVisible(false);
    const panelBg = createPanel(this, 0, 0, Math.min(460, this.scale.width - 40), 230, {
      fill: UI_COLORS.paper, stroke: 0xb8d8c6, radius: 24, shadowAlpha: 0.25
    });
    this.completionTitle = this.add.text(0, -54, '✓  Tebrikler!', {
      fontSize: '30px',
      color: '#2f7c50',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.completionBody = this.add.text(0, 0, 'Tüm tehlikeleri buldun ve Mini Oyun 2 tamamlandı.', {
      fontSize: '18px',
      color: '#49657d',
      align: 'center',
      wordWrap: { width: Math.min(380, this.scale.width - 80) }
    }).setOrigin(0.5);
    this.completionPanel.add([panelBg, this.completionTitle, this.completionBody]);
    const completeButton = createButton(this, {
      x: this.scale.width / 2, y: this.scale.height / 2 + 72, width: 228, height: 54,
      label: 'Ana Menüye Dön  ›', fill: UI_COLORS.green, stroke: 0xd8f5e3,
      depth: 5002, onClick: () => this.scene.start('MainMenu')
    });
    completeButton.bg.setVisible(false);
    this.completionButton = completeButton;

    // Create interactive items (positions and sizes will be computed responsively)
    Object.keys(ITEM_DEFS).forEach((id) => {
      const def = ITEM_DEFS[id];
      const px = Math.round(this.scale.width * def.pos.x);
      const py = Math.round(this.scale.height * def.pos.y);
      const sprite = this.add.image(px, py, def.keys[0]).setInteractive({ useHandCursor: true }).setOrigin(0.5);
      sprite.setData('id', id);
      sprite.setData('offKey', def.keys[0]);
      sprite.setData('onKey', def.keys[1]);
      sprite.setData('desc', def.desc);
      sprite.def = def; // keep ref for layout updates
      sprite.on('pointerdown', () => this.handleItemClick(sprite));

      this.itemSprites[id] = sprite;
      this.itemState[id] = false; // not clicked
    });

    this._resizeHandler = (gameSize) => {
      this.resizeElements(gameSize.width, gameSize.height);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);

    // Initial layout (scaling & positioning)
    this.resizeElements(this.scale.width, this.scale.height);

    // Listen to resize events to keep elements responsive
    this.scale.on('resize', this._resizeHandler);

    // Clicking anywhere hides info box
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      // If clicked on empty space (not on interactive), hide info
      if (!currentlyOver || currentlyOver.length === 0) {
        this.infoBox.setVisible(false);
      }
    });

    // Title text
    this.add.text(20, 20, 'Tehlikeyi Bul - Mini Oyun', { fontSize: '22px', color: '#fff' });

    const menuButton = createButton(this, {
      x: this.scale.width - 92, y: 34, width: 164, height: 46, label: '←  Ana Menü',
      fill: UI_COLORS.navy, stroke: 0x9ccbd2, fontSize: 15, depth: 300,
      onClick: () => this.scene.start('MainMenu')
    });
    this.mainMenuButton = { rect: menuButton.bg, txt: menuButton.text };
  }

  _onShutdown() {
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  handleItemClick(sprite) {
    if (this.completed) return;
    const id = sprite.getData('id');
    if (this.itemState[id]) return; // already fixed

    // Swap texture to 'clicked' version
    sprite.setTexture(sprite.getData('onKey'));
    this.itemState[id] = true;

    // Show info box with description
    this.infoText.setText(sprite.getData('desc'));
    this.infoBox.setVisible(true);
    pulseSuccess(this, sprite);

    if (Object.values(this.itemState).every(Boolean)) {
      this._markGameCompleted();
      // Show completion UI after a short delay so completion state is perceived first
      this.time.delayedCall(5000, () => {
        this._showCompletionUI();
      });
    }
  }

  resizeElements(width, height) {
    // Background
    let bgDisplayW = width;
    let bgDisplayH = height;
    if (this.bg) {
      const tex = this.textures.get('game2_bg');
      const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
      if (src && src.width && src.height) {
        const ow = src.width;
        const oh = src.height;
        // fit inside viewport, preserve aspect ratio -> show black bars for leftover
        const scale = Math.min(width / ow, height / oh);
        bgDisplayW = Math.round(ow * scale);
        bgDisplayH = Math.round(oh * scale);
        this.bg.setDisplaySize(bgDisplayW, bgDisplayH);
        this.bg.setPosition(Math.round(width / 2), Math.round(height / 2));
        this.bg.setOrigin(0.5);
      } else {
        // fallback: stretch
        bgDisplayW = width;
        bgDisplayH = height;
        this.bg.setDisplaySize(bgDisplayW, bgDisplayH);
        this.bg.setPosition(Math.round(width / 2), Math.round(height / 2));
        this.bg.setOrigin(0.5);
      }
    }

    // Info box position and size
    if (this.infoBox && this.infoBg && this.infoText) {
      this.infoBox.setPosition(Math.round(width / 2), Math.round(height * 0.12));
      const boxW = Math.min(700, Math.round(width * 0.9));
      const boxH = Math.max(64, Math.round(height * 0.12));
      this.infoBg.resizePanel(boxW, boxH);
      this.infoText.setPosition(-boxW / 2 + 16, -boxH / 2 + 8);
      this.infoText.setWordWrapWidth(boxW - 40);
    }

    // Resize solid background fill to always cover viewport
    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
      this.bgFill.setPosition(0, 0);
    }

    // Compute background top-left so items align to background coordinates
    const bgLeft = Math.round((width - bgDisplayW) / 2);
    const bgTop = Math.round((height - bgDisplayH) / 2);

    // Update each item position & scale relative to the background image
    Object.keys(this.itemSprites).forEach((id) => {
      const sprite = this.itemSprites[id];
      const def = sprite.def || ITEM_DEFS[id];
      const px = bgLeft + Math.round(bgDisplayW * def.pos.x);
      const py = bgTop + Math.round(bgDisplayH * def.pos.y);
      sprite.setPosition(px, py);

      // Compute scale to reach desired width (def.size percent of background display width)
      const targetWidth = (def.size || 0.12) * bgDisplayW;
      // get original texture width
      const tex = this.textures.get(def.keys[0]);
      const origWidth = tex && tex.getSourceImage ? tex.getSourceImage().width : sprite.width;
      const scale = origWidth > 0 ? targetWidth / origWidth : 1;
      sprite.setScale(scale);
    });

    if (this.mainMenuButton) {
      const mx = Math.round(width - 90);
      const my = 34;
      this.mainMenuButton.rect.setPosition(mx, my);
      this.mainMenuButton.txt.setPosition(mx, my);
    }

    if (this.completionOverlay) {
      this.completionOverlay.setDisplaySize(width, height);
      this.completionOverlay.setPosition(0, 0);
    }

    if (this.completionPanel) {
      this.completionPanel.setPosition(Math.round(width / 2), Math.round(height / 2));
      const panelWidth = Math.min(460, width - 40);
      if (this.completionPanel.list && this.completionPanel.list[0]) {
        this.completionPanel.list[0].resizePanel(panelWidth, 230);
      }
      if (this.completionBody) {
        this.completionBody.setWordWrapWidth(Math.min(380, width - 80));
      }
    }
    this.completionButton?.bg.setPosition(Math.round(width / 2), Math.round(height / 2 + 72));
    this.completionButton?.text.setPosition(Math.round(width / 2), Math.round(height / 2 + 72));
  }

  _showCompletionUI() {
    if (this.completionOverlay) {
      this.completionOverlay.setVisible(true);
    }
    if (this.completionPanel) {
      this.completionPanel.setVisible(true);
    }
    this.completionButton?.bg.setVisible(true);
    pulseSuccess(this, [this.completionPanel, this.completionButton?.bg.face].filter(Boolean));
  }

  _markGameCompleted() {
    if (this.completed) return;
    this.completed = true;
    const completedGames = this.registry.get('completedGames') || {};
    this.registry.set('completedGames', { ...completedGames, game2: true });
  }

  // Optional: expose ITEM_DEFS so positions/keys can be changed from outside
  static getItemDefs() {
    return ITEM_DEFS;
  }
}
