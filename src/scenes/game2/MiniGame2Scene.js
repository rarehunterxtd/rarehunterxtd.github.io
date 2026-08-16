import Phaser from 'phaser';
import { createButton, createPanel, pulseSuccess, UI_COLORS } from '../../ui/gameUi.js';

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/game2/${file}`;

// Item definitions: keys, file paths and relative positions/sizes (percent of game size)
// pos: { x: 0..1, y: 0..1 } relative to width/height
// size: width as percent of game width (0..1)
const ITEM_DEFS = {
  item1: {
    keys: ['game2_menfez_off', 'game2_menfez_on'],
    paths: [assetUrl('menfez_off.png'), assetUrl('menfez_on.png')],
    pos: { x: 0.65, y: 0.20 },
    size: 0.10,
    desc: 'Menfez kapatılırsa temiz hava girişi engellenir ve gaz birikmesi yaşanabilir.'
  },
  item2: {
    keys: ['game2_ocak_off', 'game2_ocak_on'],
    paths: [assetUrl('ocak_off.png'), assetUrl('ocak_on.png')],
    pos: { x: 0.58, y: 0.75 },
    size: 0.28,
    desc: 'Açık ocak unutulursa gaz kaçağı ve patlama riski olabilir.'
  },
  item3: {
    keys: ['game2_hortum_off', 'game2_hortum_on'],
    paths: [assetUrl('hortum_off.png'), assetUrl('hortum_on.png')],
    pos: { x: 0.125, y: 0.63 },
    size: 0.25,
    desc: 'Gevşek hortum kaçak yapabilir; bağlantılar sağlam olmalıdır.'
  },
  item4: {
    keys: ['game2_kombi_off', 'game2_kombi_on'],
    paths: [assetUrl('kombi_off.png'), assetUrl('kombi_on.png')],
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
    this.titleText = null;
    this.mainMenuButton = null;
    this.completionOverlay = null;
    this.completionPanel = null;
    this.completionTitle = null;
    this.completionBody = null;
    this.completionButton = null;
    this.transitioning = false;
    this.cameraSyncFrames = 0;
    this._resizeHandler = null;
    this._backgroundPointerHandler = null;
    this._layoutWidth = 0;
    this._layoutHeight = 0;
  }

  preload() {
    // Background (user will place actual image at this path)
    // Load from public/assets with BASE_URL so subpath deployments are supported
    this.load.image('game2_bg', assetUrl('background.png'));

    // Load item image pairs from ITEM_DEFS
    Object.keys(ITEM_DEFS).forEach((id) => {
      const def = ITEM_DEFS[id];
      // keys[0] = unclicked, keys[1] = clicked
      this.load.image(def.keys[0], def.paths[0]);
      this.load.image(def.keys[1], def.paths[1]);
    });
  }

  create() {
    this.transitioning = false;
    this.cameraSyncFrames = 30;
    window.__refreshGameViewport?.();
    this._syncCameraToCanvas();
    this.itemSprites = {};
    this.itemState = {};
    this.completed = false;
    // Scene nesnesi yeniden kullanılır. Önceki çalıştırmada Phaser tarafından
    // yok edilen başlık/düğme referansları kalırsa ilk responsive yerleşim
    // bunları güncellemeye çalışıp create akışını yarıda kesebilir.
    this.titleText = null;
    this.mainMenuButton = null;
    this.completionOverlay = null;
    this.completionPanel = null;
    this.completionTitle = null;
    this.completionBody = null;
    this.completionButton = null;
    this.bgFill = null;
    this.bg = null;
    this.infoBox = null;
    this.infoBg = null;
    this.infoText = null;
    this._layoutWidth = 0;
    this._layoutHeight = 0;

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
      depth: 5002, onClick: () => this._goToMainMenu()
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
    this._backgroundPointerHandler = (pointer, currentlyOver) => {
      // If clicked on empty space (not on interactive), hide info
      if (!currentlyOver || currentlyOver.length === 0) {
        this.infoBox?.setVisible(false);
      }
    };
    this.input.on('pointerdown', this._backgroundPointerHandler);

    // Title text
    this.titleText = this.add.text(20, 20, 'Tehlikeyi Bul - Mini Oyun', {
      fontSize: '22px', color: '#fff', fontStyle: 'bold'
    }).setDepth(300);

    const menuButton = createButton(this, {
      x: this.scale.width - 92, y: 34, width: 164, height: 46, label: '←  Ana Menü',
      fill: UI_COLORS.navy, stroke: 0x9ccbd2, fontSize: 15, depth: 300,
      onClick: () => this._goToMainMenu()
    });
    this.mainMenuButton = { rect: menuButton.bg, txt: menuButton.text };

    // Başlık ve menü butonu oluşturulduktan sonra mobil üst barı da yerleştir.
    this.resizeElements(this.scale.width, this.scale.height);
  }

  _onShutdown() {
    this.tweens?.killAll();
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._backgroundPointerHandler) {
      this.input.off('pointerdown', this._backgroundPointerHandler);
      this._backgroundPointerHandler = null;
    }
    this.cameraSyncFrames = 0;
    window.__refreshGameViewport?.();
  }

  _goToMainMenu() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.tweens?.killAll();
    window.__refreshGameViewport?.();
    this.scene.start('MainMenu');
  }

  _syncCameraToCanvas() {
    const canvas = this.game?.canvas;
    const camera = this.cameras?.main;
    if (!canvas || !camera) return;

    const bounds = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, bounds.width || window.innerWidth);
    const cssHeight = Math.max(1, bounds.height || window.innerHeight);
    const renderWidth = Math.max(1, canvas.width);
    const renderHeight = Math.max(1, canvas.height);
    const renderScale = Math.min(renderWidth / cssWidth, renderHeight / cssHeight);

    if (camera.width !== renderWidth || camera.height !== renderHeight) {
      camera.setViewport(0, 0, renderWidth, renderHeight);
    }
    if (camera.originX !== 0 || camera.originY !== 0) camera.setOrigin(0, 0);
    if (Math.abs(camera.zoom - renderScale) > 0.001) camera.setZoom(renderScale);
  }

  _getViewportSize() {
    const canvas = this.game?.canvas;
    const parent = canvas?.parentElement;
    const bounds = parent?.getBoundingClientRect?.() || canvas?.getBoundingClientRect?.();

    return {
      width: Math.max(1, Math.round(bounds?.width || window.innerWidth || this.scale.width)),
      height: Math.max(1, Math.round(bounds?.height || window.innerHeight || this.scale.height))
    };
  }

  update() {
    // Hızlı sahne geçişinde yeni kamera ilk PRE_RENDER olayından önce oluşabilir.
    // İlk birkaç karede oranı doğrula; sonrasında gereksiz DOM ölçümü yapma.
    if (this.cameraSyncFrames > 0) {
      this.cameraSyncFrames -= 1;
      this._syncCameraToCanvas();
      const viewport = this._getViewportSize();
      if (viewport.width !== this._layoutWidth || viewport.height !== this._layoutHeight) {
        this.resizeElements(viewport.width, viewport.height);
      }
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
      this._showCompletionUI();
    }
  }

  resizeElements(width, height) {
    const viewport = this._getViewportSize();
    // ScaleManager'ın sahne değişiminden kalan render-piksel ölçüsü yerine
    // her zaman gerçek CSS viewport ölçüsünü kullan.
    width = viewport.width;
    height = viewport.height;
    this._layoutWidth = width;
    this._layoutHeight = height;
    this._syncCameraToCanvas();
    const compact = width < 620;
    const portraitLayout = compact && height > width * 1.2;

    // Background
    let bgDisplayW = width;
    let bgDisplayH = height;
    let bgCenterX = Math.round(width / 2);
    let bgCenterY = Math.round(height / 2);
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
        if (portraitLayout) {
          bgCenterY = Math.round(76 + bgDisplayH / 2);
        }
        this.bg.setDisplaySize(bgDisplayW, bgDisplayH);
        this.bg.setPosition(bgCenterX, bgCenterY);
        this.bg.setOrigin(0.5);
      } else {
        // fallback: stretch
        bgDisplayW = width;
        bgDisplayH = height;
        this.bg.setDisplaySize(bgDisplayW, bgDisplayH);
        this.bg.setPosition(bgCenterX, bgCenterY);
        this.bg.setOrigin(0.5);
      }
    }

    // Compute background top-left so items align to background coordinates
    const bgLeft = Math.round(bgCenterX - bgDisplayW / 2);
    const bgTop = Math.round(bgCenterY - bgDisplayH / 2);

    // Info box position and size
    if (this.infoBox && this.infoBg && this.infoText) {
      const boxW = Math.min(700, Math.round(width * 0.9));
      const boxH = portraitLayout
        ? Phaser.Math.Clamp(Math.round(height * 0.12), 88, 108)
        : Math.max(64, Math.round(height * 0.12));
      const infoY = portraitLayout
        ? Math.min(height - boxH / 2 - 14, bgTop + bgDisplayH + boxH / 2 + 12)
        : Math.round(height * 0.12);
      this.infoBox.setPosition(Math.round(width / 2), Math.round(infoY));
      this.infoBg.resizePanel(boxW, boxH);
      this.infoText.setPosition(-boxW / 2 + 16, -boxH / 2 + 8);
      this.infoText.setWordWrapWidth(boxW - 40);
      this.infoText.setFontSize(compact ? 15 : 17);
    }

    // Resize solid background fill to always cover viewport
    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
      this.bgFill.setPosition(0, 0);
    }

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

    if (this.titleText) {
      this.titleText
        .setText(compact ? 'Tehlikeyi Bul' : 'Tehlikeyi Bul - Mini Oyun')
        .setPosition(compact ? 14 : 20, compact ? 22 : 20)
        .setFontSize(compact ? 17 : 22);
    }

    if (this.mainMenuButton) {
      const buttonWidth = compact ? 124 : 164;
      const buttonHeight = compact ? 40 : 46;
      const mx = Math.round(width - buttonWidth / 2 - (compact ? 10 : 8));
      const my = compact ? 34 : 34;
      this.mainMenuButton.rect.setDisplaySize(buttonWidth, buttonHeight);
      this.mainMenuButton.rect.setPosition(mx, my);
      this.mainMenuButton.txt
        .setText('←  Ana Menü')
        .setPosition(mx, my)
        .setFontSize(compact ? 12 : 15);
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
