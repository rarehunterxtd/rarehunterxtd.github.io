import Phaser from 'phaser';
import { addBackdrop, createButton, createPanel, pulseSuccess, shakeSoft, UI_COLORS } from '../../ui/gameUi.js';

const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/game1/${file}`;

// Senaryolar dizisi: her bir senaryo video içerip içermediğini, video/resim yollarını ve seçenek listesini içerir
const DEFAULT_SCENARIOS = [
  {
    id: 'scenario1',
    hasVideo: true,
    videoPath: assetUrl('video1.mp4'),
    imagePath: assetUrl('sonuc1.png'),
    text: 'Mutfaktaki ocaktan hafif bir duman geliyor.',
    options: [
      { id: 'opt1', label: 'Ocağı açık bırakıp balkona çıkarım', isCorrect: false, feedback: 'Yanlış! Tekrar dene.' },
      { id: 'opt2', label: 'Ocağı kapatır, mutfağı havalandırırım', isCorrect: true,  feedback: 'Doğru! Tebrikler.' },
      { id: 'opt3', label: 'Çakmakla kontrol ederim', isCorrect: false, feedback: 'Yanlış! Başka bir seçim deneyin.' }
    ]
  },
  {
    id: 'scenario2',
    hasVideo: false,
    imagePath: assetUrl('sonuc2.png'),
    text: 'Evde yoğun bir gaz kokusu var.',
    options: [
      { id: 'opt1', label: 'Elektrik düğmesini açarım', isCorrect: false, feedback: 'Yanlış! Tekrar dene.' },
      { id: 'opt2', label: 'Üzerine oda spreyi sıkarım', isCorrect: false,  feedback: 'Yanlış! Başka bir seçim deneyin.' },
      { id: 'opt3', label: 'Gaz vanasını kapatır, pencereyi açarım', isCorrect: true, feedback: 'Doğru! Tebrikler.' }
    ]
  },
  {
    id: 'scenario3',
    hasVideo: true,
    videoPath: assetUrl('video3.mp4'),
    imagePath: assetUrl('sonuc3.png'),
    text: 'Kış ayları geldi, havalar çok soğudu ve camdaki havalandırma menfezinden içeriye sürekli soğuk hava giriyor.',
    options: [
      { id: 'opt1', label: 'İçeri soğuk girmesin diye menfezi bantla tamamen kapatırım', isCorrect: false, feedback: 'Yanlış! Tekrar dene.' },
      { id: 'opt2', label: 'Menfezi kesinlikle kapatmam, açık kalmasını sağlarım', isCorrect: true,  feedback: 'Doğru! Tebrikler.' },
      { id: 'opt3', label: 'Menfezi çıkarıp yerine düz cam taktırırım', isCorrect: false, feedback: 'Yanlış! Başka bir seçim deneyin.' }
    ]
  },
  {
    id: 'scenario4',
    hasVideo: false,
    imagePath: assetUrl('sonuc4.png'),
    text: 'Kombiden tuhaf tıkırtılar gelmeye başladı, cihaz hata kodu veriyor ve evin içi ısınmıyor.',
    options: [
      { id: 'opt1', label: 'Cihaza müdahale etmeden hemen yetkili servisi çağırırım', isCorrect: true, feedback: 'Doğru! Tebrikler.' },
      { id: 'opt2', label: 'Cihazın ön kapağını açıp içindeki vanaları ve kabloları kendim düzeltmeye çalışırım', isCorrect: false, feedback: 'Yanlış! Tekrar dene.' },
      { id: 'opt3', label: 'Kombiye birkaç kez vurur, düzelene kadar sürekli açıp kapatırım', isCorrect: false,  feedback: 'Yanlış! Başka bir seçim deneyin.' }
    ]
  },
  {
    id: 'scenario5',
    hasVideo: false,
    imagePath: assetUrl('sonuc5.png'),
    text: 'Evinizin önündeki doğal gaz kutusunun veya hattının çok yakınında, dikkatsiz bir kazı çalışması yapıldığını gördün.',
    options: [
      { id: 'opt1', label: '"Beni ilgilendirmez" diyerek oradan uzaklaşırım', isCorrect: false, feedback: 'Yanlış! Tekrar dene.' },
      { id: 'opt2', label: 'Çalışanları uyarır ve hemen 187 Doğal Gaz Acil Hattı\'nı ararım.', isCorrect: true, feedback: 'Doğru! Tebrikler.' },
      { id: 'opt3', label: 'Ne aradıklarını merak edip kazı alanının tam kenarına gidip izlerim', isCorrect: false,  feedback: 'Yanlış! Başka bir seçim deneyin.' }
    ]
  }
  // İleride burada başka senaryolar ekleyebilirsiniz
];

export default class MiniGame1Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame1');
    // Senaryolar ve başlangıç indeksi
    this.scenarios = DEFAULT_SCENARIOS;
    this.currentScenarioIndex = 0;
    this.video = null;
    this.optionButtons = [];
    this.feedbackText = null;
    this.resultImage = null;
    this.sceneImage = null; // for scenarios without video
    this.scenarioText = null; // overlay descriptive text shown over media
    this.continueButton = null; // { rect, txt }
    this.mainMenuButton = null; // { rect, txt }
  }

  preload() {
    // Tüm senaryolardaki gerekli assetleri yükle
    this.scenarios.forEach((s, i) => {
      if (s.hasVideo && s.videoPath) {
        this.load.video(`game1_video_${i}`, s.videoPath, 'loadeddata', false, true);
      }
      if (s.imagePath) {
        this.load.image(`game1_result_${i}`, s.imagePath);
      }
    });
  }

  create() {
    const { width, height } = this.scale;
    this.currentScenarioIndex = 0;
    this.backdrop = addBackdrop(this, { color: 0x102a3d, accent: UI_COLORS.blue, secondary: UI_COLORS.teal, depth: -220 });
    this.bgFill = this.add.rectangle(0, 0, width, height, 0x102a3d, 0.56).setOrigin(0).setDepth(-10);
    const mediaBounds = this._getMediaBounds(width, height);
    this.mediaFrame = createPanel(this, mediaBounds.x, mediaBounds.y, mediaBounds.width + 16, mediaBounds.height + 16, {
      fill: 0x0b1f30,
      fillAlpha: 0.96,
      stroke: 0x9ccbd2,
      strokeAlpha: 0.48,
      lineWidth: 2,
      radius: 28,
      shadowAlpha: 0.18,
      shadowY: 7,
      depth: -5
    });
    this.mediaMaskGraphics = this.make.graphics({ add: false });
    this.mediaMask = this.mediaMaskGraphics.createGeometryMask();
    this._updateMediaMask(mediaBounds);

    const menuButton = createButton(this, {
      x: width - 92, y: 34, width: 164, height: 46, label: '←  Ana Menü',
      fill: UI_COLORS.navy, stroke: 0x8eb5c5, fontSize: 15, depth: 300,
      onClick: () => this.scene.start('MainMenu')
    });
    this.mainMenuButton = { rect: menuButton.bg, txt: menuButton.text };

    // medya sahnesi dinamik olarak _renderCurrentScenario içinde oluşturulacak

    // Feedback text (gizli)
    // depth 156: above result image (150) and scenario text (155), below option buttons (160+)
    this.feedbackText = this.add.text(width / 2, height - 140, '', {
      fontSize: '20px', color: '#fff', backgroundColor: '#17324d', padding: { x: 18, y: 11 },
      align: 'center', wordWrap: { width: Math.max(220, width - 48) }
    }).setOrigin(0.5).setVisible(false).setDepth(156);

    // Seçenek butonlarını oluştur
    this._renderCurrentScenario();

    // Resize handler
    this._resizeHandler = (gameSize) => {
      this._onResize(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);
  }

  _createOptionButtons(options) {
    const width = this.scale.width;
    const height = this.scale.height;
    const count = options.length;
    const stacked = width < 620;
    const padding = stacked ? 22 : 32;
    const spacing = stacked ? 10 : 16;
    const availableW = width - padding * 2 - (stacked ? 0 : spacing * (count - 1));
    const btnW = stacked ? availableW : Math.floor(availableW / count);
    const btnH = stacked ? 50 : 66;
    const y = stacked ? height - 174 : height - btnH / 2 - 32;

    // temizle varsa
    this.optionButtons.forEach(b => b.rect.destroy());
    this.optionButtons = [];

    options.forEach((opt, idx) => {
      const x = stacked ? width / 2 : padding + btnW / 2 + idx * (btnW + spacing);
      const buttonY = stacked ? y + idx * (btnH + spacing) : y;
      const button = createButton(this, {
        x, y: buttonY, width: btnW, height: btnH, label: opt.label,
        fill: UI_COLORS.blue, stroke: 0xb8dfea, fontSize: stacked ? 15 : 17, depth: 160
      });
      const rect = button.bg;
      const txt = button.text;
      // ensure text fits inside button
      txt.setWordWrapWidth(Math.max(10, btnW - 16));
      this._fitTextToWidth(txt, Math.max(10, btnW - 16));

      rect.on('pointerup', () => this._onOptionSelected(opt, rect));

      this.optionButtons.push({ rect, txt, opt });
    });
  }

  _fitTextToWidth(txt, maxWidth, minFont = 10) {
    // start from current or default size
    let size = 18;
    try {
      const s = txt.style && txt.style.fontSize;
      if (typeof s === 'string' && s.endsWith('px')) size = parseInt(s, 10);
      else if (typeof s === 'number') size = s;
    } catch (e) {
      size = 18;
    }
    txt.setFontSize(size);
    txt.setWordWrapWidth(maxWidth);
    // decrease until it fits or minFont reached
    while (txt.width > maxWidth && size > minFont) {
      size -= 1;
      txt.setFontSize(size);
    }
  }

  _onOptionSelected(option, rect) {
    // Görsel geribildirim
    const correct = !!option.isCorrect;
    // Renk değişimi
    rect.setFillStyle(correct ? 0x388e3c : 0xd32f2f);

    // Gösterilecek mesaj: option.feedback (kodda belirtilebilir)
    const msg = option.feedback || (correct ? 'Doğru!' : 'Yanlış!');
    this.feedbackText.setText(`${correct ? '✓' : '↻'}  ${msg}`);
    this.feedbackText.setStyle({ backgroundColor: correct ? '#2f7c50' : '#b95e43' });
    this.feedbackText.setVisible(true);
    if (correct) pulseSuccess(this, [rect.face, rect.shadow, this.feedbackText]);
    else shakeSoft(this, rect.face);

    // butonları kilitle
    this.optionButtons.forEach(b => b.rect.disableInteractive());

    if (correct) {
      // keep option buttons visible; we'll ensure they render above the result image
      // eğer video varsa durdur ve gizle
      if (this.video) {
        const dispW = this.video.displayWidth || this.scale.width;
        const dispH = this.video.displayHeight || this.scale.height;
        this.video.stop();
        this.video.setVisible(false);
      }
      // sonuç görselini senaryoya göre göster
      const key = `game1_result_${this.currentScenarioIndex}`;
      if (this.textures.exists(key)) {
          // place result image above media
          this.resultImage = this.add.image(this.scale.width / 2, this.scale.height / 2, key).setOrigin(0.5).setDepth(150);
          this.resultImage.setMask(this.mediaMask);
          // preserve aspect ratio (contain) based on video display size if present, otherwise viewport
          const mediaBounds = this._getMediaBounds(this.scale.width, this.scale.height);
          this._setImageContain(this.resultImage, key, mediaBounds.width, mediaBounds.height);
          this.resultImage.setPosition(mediaBounds.x, mediaBounds.y);
          // ensure scenario text is above the result image
          if (this.scenarioText) { try { this.scenarioText.setDepth(155); } catch (e) {} }
          // ensure feedback text is above the result image (but below buttons)
          if (this.feedbackText) { try { this.feedbackText.setDepth(156); } catch (e) {} }
          if (this.optionButtons && this.optionButtons.length) {
            this.optionButtons.forEach(b => { try { b.rect.setDepth(160); b.txt.setDepth(161); } catch (e) {} });
          }
      }

      // feedback'i göster ve devam butonunu çıkar (son senaryo ise menü butonu göster)
      const isLast = this.currentScenarioIndex === this.scenarios.length - 1;
      this._showContinueButton(isLast);
    } else {
      // Yanlışsa, kısa gösterip normal duruma dön
      this.time.delayedCall(1600, () => {
        this.feedbackText.setVisible(false);
        this.optionButtons.forEach(b => {
          b.rect.setFillStyle(UI_COLORS.blue);
          b.rect.setInteractive({ useHandCursor: true });
        });
      });
    }
  }

  _nextScenario() {
    // temizle önceki öğeler
    if (this.resultImage) { this.resultImage.destroy(); this.resultImage = null; }
    if (this.video) { this.video.destroy(); this.video = null; }
    if (this.sceneImage) { this.sceneImage.destroy(); this.sceneImage = null; }
    if (this.scenarioText) { this.scenarioText.destroy(); this.scenarioText = null; }
    this._destroyContinueButton();

    this.currentScenarioIndex += 1;
    if (this.currentScenarioIndex >= this.scenarios.length) {
      // tüm senaryolar bitti - basit bitiş mesajı
      this.feedbackText.setText('Tebrikler! Tüm senaryolar tamamlandı.');
      this.feedbackText.setStyle({ backgroundColor: '#2e7d32' });
      this.feedbackText.setVisible(true);
      return;
    }

    // yeni senaryoyu render et
    this._renderCurrentScenario();
  }

  _renderCurrentScenario() {
    const s = this.scenarios[this.currentScenarioIndex];
    const width = this.scale.width;
    const height = this.scale.height;
    // temizle eski öğeler (güvenli)
    this.optionButtons.forEach(b => { try { b.rect.destroy(); } catch (e) {} });
    this.optionButtons = [];
    if (this.video) { try { this.video.destroy(); } catch (e) {} this.video = null; }
    if (this.sceneImage) { try { this.sceneImage.destroy(); } catch (e) {} this.sceneImage = null; }
    if (this.resultImage) { try { this.resultImage.destroy(); } catch (e) {} this.resultImage = null; }
    if (this.scenarioText) { try { this.scenarioText.destroy(); } catch (e) {} this.scenarioText = null; }
    this._destroyContinueButton();

    // ensure any previous feedback is hidden when rendering a new scenario
    if (this.feedbackText) { try { this.feedbackText.setVisible(false); this.feedbackText.setText(''); } catch (e) {} }

    // varsa video ekle, yoksa resim göster
    if (s.hasVideo && s.videoPath) {
      const key = `game1_video_${this.currentScenarioIndex}`;
      // ekle ve oynat
      const mediaBounds = this._getMediaBounds(width, height);
      this.video = this.add.video(mediaBounds.x, mediaBounds.y, key).setOrigin(0.5).setDepth(-4);
      this.video.setMask(this.mediaMask);
      this.video.play(true);
      const adjustVideo = () => this._resizeVideo(this.scale.width, this.scale.height);
      if (this.video.getVideoWidth && this.video.getVideoWidth() > 0) adjustVideo();
      else {
        this.video.on('play', adjustVideo, this);
        this.time.delayedCall(300, adjustVideo);
      }
    } else if (s.imagePath) {
      // gösterilecek medya olarak resim ekle (contain - letterbox)
      const key = `game1_result_${this.currentScenarioIndex}`;
      if (this.textures.exists(key)) {
        const mediaBounds = this._getMediaBounds(width, height);
        this.sceneImage = this.add.image(mediaBounds.x, mediaBounds.y, key).setOrigin(0.5).setDepth(-4);
        this.sceneImage.setMask(this.mediaMask);
        this._setImageContain(this.sceneImage, key, mediaBounds.width, mediaBounds.height);
      }
    }

    // Senaryo açıklama metnini oluştur (video/resim üzerinde orta-alt konumda)
    if (s.text) {
      const style = { fontSize: '20px', color: '#fff', align: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 12, y: 8 } };
      // depth 155 so it's above the result image (150) but below option buttons (160+)
      const mediaBounds = this._getMediaBounds(width, height);
      const textWidth = Math.max(180, mediaBounds.width - 48);
      this.scenarioText = this.add.text(mediaBounds.x, mediaBounds.bottom - 46, s.text, style).setOrigin(0.5).setDepth(155);
      this.scenarioText.setWordWrapWidth(textWidth);
      this._fitTextToWidth(this.scenarioText, textWidth);
    }

    // seçenekleri oluştur
    this._createOptionButtons(s.options || []);
  }

  _resizeVideo(width, height) {
    const mediaBounds = this._getMediaBounds(width, height);
    // ensure the background fill covers viewport (black bars)
    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
    }

    // Video varsa onu yeniden boyutlandır
    if (this.video) {
      const vw = this.video.getVideoWidth && this.video.getVideoWidth() > 0 ? this.video.getVideoWidth() : null;
      const vh = this.video.getVideoHeight && this.video.getVideoHeight() > 0 ? this.video.getVideoHeight() : null;
      if (vw && vh) {
        const scale = Math.min(mediaBounds.width / vw, mediaBounds.height / vh);
        const displayW = Math.round(vw * scale);
        const displayH = Math.round(vh * scale);
        this.video.setDisplaySize(displayW, displayH);
        this.video.setPosition(mediaBounds.x, mediaBounds.y);
      } else {
        const vwF = 16;
        const vhF = 9;
        const scale = Math.min(mediaBounds.width / vwF, mediaBounds.height / vhF);
        const displayW = Math.round(vwF * scale);
        const displayH = Math.round(vhF * scale);
        this.video.setDisplaySize(displayW, displayH);
        this.video.setPosition(mediaBounds.x, mediaBounds.y);
      }
    }

    // Eğer bir sahne resmi varsa, tam ekran contain olarak göster
    if (this.sceneImage) {
      try {
        const key = this.sceneImage.texture && this.sceneImage.texture.key;
        const tex = key ? this.textures.get(key) : null;
        const src = tex && tex.source && tex.source[0];
        const iw = src && src.width ? src.width : null;
        const ih = src && src.height ? src.height : null;
        if (iw && ih) {
          const scale = Math.min(mediaBounds.width / iw, mediaBounds.height / ih);
          const displayW = Math.round(iw * scale);
          const displayH = Math.round(ih * scale);
          this.sceneImage.setDisplaySize(displayW, displayH);
          this.sceneImage.setPosition(mediaBounds.x, mediaBounds.y);
        } else {
          this.sceneImage.setDisplaySize(mediaBounds.width, mediaBounds.height);
          this.sceneImage.setPosition(mediaBounds.x, mediaBounds.y);
        }
      } catch (e) {
        this.sceneImage.setDisplaySize(mediaBounds.width, mediaBounds.height);
        this.sceneImage.setPosition(mediaBounds.x, mediaBounds.y);
      }
    }

    // Eğer sonuç görseli gösterildiyse onu da mevcut medyaya göre boyutlandır
    if (this.resultImage) {
      // compute key for the current result image and preserve aspect ratio
      const key = `game1_result_${this.currentScenarioIndex}`;
      this._setImageContain(this.resultImage, key, mediaBounds.width, mediaBounds.height);
      this.resultImage.setPosition(mediaBounds.x, mediaBounds.y);
    }

    // Reposition scenario overlay text
    if (this.scenarioText) {
      const textWidth = Math.max(180, mediaBounds.width - 48);
      this.scenarioText.setPosition(mediaBounds.x, mediaBounds.bottom - 46);
      this.scenarioText.setWordWrapWidth(textWidth);
      this._fitTextToWidth(this.scenarioText, textWidth);
    }
  }

  _getMediaBounds(width, height) {
    const compact = width < 620;
    const top = compact ? 72 : 18;
    const bottomReserve = compact ? 222 : 112;
    const maxWidth = Math.max(260, width - (compact ? 24 : 40));
    const maxHeight = Math.max(160, height - top - bottomReserve);
    const aspect = 16 / 9;
    const mediaWidth = Math.min(maxWidth, maxHeight * aspect);
    const mediaHeight = mediaWidth / aspect;
    const x = Math.round(width / 2);
    const y = Math.round(top + maxHeight / 2);
    return {
      x,
      y,
      width: Math.round(mediaWidth),
      height: Math.round(mediaHeight),
      bottom: Math.round(y + mediaHeight / 2)
    };
  }

  _updateMediaMask(bounds) {
    if (!this.mediaMaskGraphics || !bounds) return;
    const radius = Math.min(24, Math.max(14, bounds.height * 0.035));
    this.mediaMaskGraphics.clear();
    this.mediaMaskGraphics.fillStyle(0xffffff, 1);
    this.mediaMaskGraphics.fillRoundedRect(
      bounds.x - bounds.width / 2,
      bounds.y - bounds.height / 2,
      bounds.width,
      bounds.height,
      radius
    );
  }

  _setImageContain(img, key, maxW, maxH) {
    if (!img) return;
    try {
      const tex = this.textures.get(key);
      const src = tex && tex.source && tex.source[0];
      const iw = src && src.width ? src.width : null;
      const ih = src && src.height ? src.height : null;
      if (iw && ih) {
        const scale = Math.min(maxW / iw, maxH / ih);
        const displayW = Math.round(iw * scale);
        const displayH = Math.round(ih * scale);
        img.setDisplaySize(displayW, displayH);
        return;
      }
    } catch (e) {
      // ignore and fallback
    }
    img.setDisplaySize(maxW, maxH);
  }

  _showContinueButton(isLast) {
    // destroy varsa
    this._destroyContinueButton();
    const width = this.scale.width;
    const height = this.scale.height;
    const w = 220;
    const h = 56;
    const mediaBounds = this._getMediaBounds(width, height);
    const x = mediaBounds.x;
    const y = mediaBounds.y;
    const label = isLast ? 'Ana Menüye Dön' : 'Devam Et';
    const button = createButton(this, {
      x, y, width: w, height: h,
      label: isLast ? `✓  ${label}` : `${label}  ›`,
      fill: isLast ? UI_COLORS.green : UI_COLORS.teal,
      stroke: 0xd8fff4,
      fontSize: 18,
      depth: 200
    });
    button.bg.on('pointerup', () => {
      this._destroyContinueButton();
      if (isLast) {
        this._markGameCompleted();
        this.scene.start('MainMenu');
      } else {
        this._nextScenario();
      }
    });
    this.continueButton = { rect: button.bg, txt: button.text, isLast };
  }

  _destroyContinueButton() {
    if (!this.continueButton) return;
    try {
      this.continueButton.rect.destroy();
    } catch (e) {}
    this.continueButton = null;
  }

  _markGameCompleted() {
    const completedGames = this.registry.get('completedGames') || {};
    this.registry.set('completedGames', { ...completedGames, game1: true });
  }

  _onShutdown() {
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    this.mediaMaskGraphics?.destroy();
    this.mediaMaskGraphics = null;
    this.mediaMask = null;
  }

  _onResize(width, height) {
    try {
      // video yeniden boyutlandır
      this._resizeVideo(width, height);
      this.backdrop?.resize(width, height);
      this.bgFill?.setDisplaySize(width, height).setPosition(0, 0);
      const mediaBounds = this._getMediaBounds(width, height);
      this._updateMediaMask(mediaBounds);
      this.mediaFrame?.setPosition(mediaBounds.x, mediaBounds.y);
      this.mediaFrame?.resizePanel(mediaBounds.width + 16, mediaBounds.height + 16);

      // feedback konum
      if (this.feedbackText) this.feedbackText.setPosition(width / 2, height - 140);

      // scenario text konum
      if (this.scenarioText) {
        const textWidth = Math.max(180, mediaBounds.width - 48);
        this.scenarioText.setPosition(mediaBounds.x, mediaBounds.bottom - 46);
        this.scenarioText.setWordWrapWidth(textWidth);
        this._fitTextToWidth(this.scenarioText, textWidth);
      }

      // seçenekleri yeniden yerleştir
      if (this.optionButtons && this.optionButtons.length) {
        const count = this.optionButtons.length;
        const stacked = width < 620;
        const padding = stacked ? 22 : 32;
        const spacing = stacked ? 10 : 16;
        const availableW = width - padding * 2 - (stacked ? 0 : spacing * (count - 1));
        const btnW = stacked ? availableW : Math.floor(availableW / count);
        const btnH = stacked ? 50 : 66;
        const y = stacked ? height - 174 : height - btnH / 2 - 32;
        this.optionButtons.forEach((b, idx) => {
          const x = stacked ? width / 2 : padding + btnW / 2 + idx * (btnW + spacing);
          const buttonY = stacked ? y + idx * (btnH + spacing) : y;
          try {
            b.rect.setPosition(x, buttonY);
            b.rect.setSize(btnW, btnH);
            b.txt.setPosition(x, buttonY);
            b.txt.setWordWrapWidth(Math.max(10, btnW - 16));
            this._fitTextToWidth(b.txt, Math.max(10, btnW - 16));
          } catch (e) {
            // ignore per-button errors
          }
        });
      }
      // reposition continue button if shown
      if (this.continueButton) {
        const cx = mediaBounds.x;
        const cy = mediaBounds.y;
        try { this.continueButton.rect.setPosition(cx, cy); this.continueButton.txt.setPosition(cx, cy); } catch (e) {}
      }

      if (this.mainMenuButton) {
        const mx = Math.round(width - 90);
        const my = 34;
        try {
          this.mainMenuButton.rect.setPosition(mx, my);
          this.mainMenuButton.txt.setPosition(mx, my);
        } catch (e) {}
      }
    } catch (err) {
      // if resize handling throws, restart scene to recover from broken state
      // log error to console for debugging
      // eslint-disable-next-line no-console
      console.error('Error in _onResize:', err);
      try { this.scene.restart(); } catch (e) {}
    }
  }
}
