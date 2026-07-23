import Phaser from 'phaser';
import { addBackdrop, createButton, createPanel, UI_COLORS } from '../../ui/gameUi.js';

const TOTAL_TIME = 30;
const QUESTION_PANEL_HEIGHT = 400;
const QUESTION_PANEL_OFFSET_Y = 0;

const QUESTIONS = [
  {
    question: 'Kombi bakımını kim yapabilir?',
    options: ['Komşumun oğlu', 'İnternetten bulduğum kişi', 'Yetkili teknik servis'],
    correctIndex: 2
  },
  {
    question: 'Kombiniz arıza verdiğinde ilk olarak kimi aramalısınız?',
    options: ['Yetkili teknik servisi', 'Mahallede tamir yapan birini', 'Sosyal medyada önerilen herhangi bir kişiyi'],
    correctIndex: 0
  },
  {
    question: 'Orijinal yedek parça kullanımını kim garanti eder?',
    options: ['Yetkili teknik servis', 'En ucuz tamirci', 'İnternette ilan veren herhangi biri'],
    correctIndex: 0
  },
  {
    question: 'Kombinizin garanti kapsamının korunması için bakım ve onarımı kim yapmalıdır?',
    options: ['Elektrikçi', 'Yetkili teknik servis', 'Tanıdık bir usta'],
    correctIndex: 1
  },
  {
    question: 'Aşağıdakilerden hangisi güvenli ve doğru bir tercihtir?',
    options: ['Arızayı kendim tamir etmeye çalışırım.', 'Yetkili teknik servisten destek alırım.', 'İnternette izlediğim videoyla müdahale ederim.'],
    correctIndex: 1
  }
];

export default class MiniGame6Scene extends Phaser.Scene {
  constructor() {
    super('MiniGame6');
    this.questions = QUESTIONS;
    this.currentQuestionIndex = 0;
    this.selectedAnswers = Array(this.questions.length).fill(null);
    this.questionTitle = null;
    this.questionText = null;
    this.optionButtons = [];
    this.timerText = null;
    this.progressText = null;
    this.feedbackText = null;
    this.resultText = null;
    this.navInfoText = null;
    this.prevButton = null;
    this.nextButton = null;
    this.finishButton = null;
    this.menuButton = null;
    this.timerEvent = null;
    this.remainingSeconds = TOTAL_TIME;
    this.reviewMode = false;
    this.finished = false;
    this.summary = { correct: 0, wrong: 0 };
  }

  _isCompactLayout(width, height) {
    return width <= 760 || height <= 760;
  }

  create() {
    const { width, height } = this.scale;
    this.currentQuestionIndex = 0;
    this.selectedAnswers = Array(this.questions.length).fill(null);
    this.remainingSeconds = TOTAL_TIME;
    this.reviewMode = false;
    this.finished = false;
    this.summary = { correct: 0, wrong: 0 };
    this._leftCooldown = false;
    this._rightCooldown = false;

    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }

    this.backdrop = addBackdrop(this, { color: 0xedf7f2, accent: UI_COLORS.green, secondary: UI_COLORS.blue, depth: -200 });
    this.bgFill = this.add.rectangle(0, 0, width, height, 0xedf7f2, 0.25).setOrigin(0).setDepth(-100);
    this.headerBar = createPanel(this, width / 2, 54, Math.min(760, width - 32), 84, {
      fill: UI_COLORS.navy, stroke: 0x8eb5c5, radius: 20, shadowAlpha: 0.15
    }).setDepth(0);
    this.titleText = this.add.text(width / 2, 34, 'Mini Oyun 6 - Teknik Servis Quiz', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(5);
    this.timerText = this.add.text(width - 32, 34, `Süre: ${TOTAL_TIME}`, {
      fontSize: '26px',
      color: '#fbbf24'
    }).setOrigin(1, 0).setDepth(5);

    this.progressText = this.add.text(width / 2, 98, '', {
      fontSize: '18px',
      color: '#49657d',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(5);

    this.questionPanel = createPanel(this, width / 2, height / 2 - QUESTION_PANEL_OFFSET_Y, Math.min(760, width - 32), QUESTION_PANEL_HEIGHT, {
      fill: UI_COLORS.paper, stroke: 0xb8d8c6, radius: 24, shadowAlpha: 0.13
    }).setDepth(0);

    this.questionText = this.add.text(width / 2, height / 2 - 160, '', {
      fontSize: '26px',
      color: '#17324d',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: Math.min(680, width - 96) }
    }).setOrigin(0.5, 0).setDepth(5);

    this.feedbackText = this.add.text(width / 2, height / 2 + 160, '', {
      fontSize: '18px',
      color: '#147565',
      align: 'center'
    }).setOrigin(0.5, 0).setDepth(5);

    this.resultText = this.add.text(width / 2, height - 120, '', {
      fontSize: '20px',
      color: '#17324d',
      align: 'center',
      wordWrap: { width: Math.min(700, width - 60) }
    }).setOrigin(0.5, 0).setDepth(5);

    this.navInfoText = this.add.text(width / 2, height - 76, 'Soru 1 / 5', {
      fontSize: '16px',
      color: '#49657d'
    }).setOrigin(0.5, 0).setDepth(5);

    this.optionButtons = this.questions[0].options.map((_, index) => this._createOptionButton(index));

    this.prevButton = this._createNavButton(width / 2 - 220, height - 34, 'Önceki Soru', () => this._goToQuestion(this.currentQuestionIndex - 1));
    this.nextButton = this._createNavButton(width / 2 - 70, height - 34, 'Sonraki Soru', () => this._goToQuestion(this.currentQuestionIndex + 1));
    this.finishButton = this._createNavButton(width / 2 + 88, height - 34, 'Testi Bitir', () => this._finishQuiz());
    this.menuButton = this._createNavButton(width / 2 + 250, height - 34, 'Ana Menüye Dön', () => this.scene.start('MainMenu'));

    this.menuButton.bg.setFillStyle(0x334155, 0.95);

    this._bindKeyboard();
    this._refreshQuestion();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished) return;
        this.remainingSeconds -= 1;
        this.timerText.setText(`Süre: ${Math.max(0, this.remainingSeconds)}`);
        if (this.remainingSeconds <= 0) {
          this.remainingSeconds = 0;
          this._finishQuiz(true);
        }
      }
    });

    this._resizeHandler = (gameSize) => this._onResize(gameSize.width, gameSize.height);
    this.scale.on('resize', this._resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);
    this._onResize(width, height);
  }

  _createOptionButton(index) {
    const button = createButton(this, {
      x: 0, y: 0, width: 620, height: 60, label: '',
      fill: UI_COLORS.blue, stroke: 0xb8dfea, fontSize: 17,
      radius: 16, depth: 10, onClick: () => this._selectAnswer(index)
    });
    return { bg: button.bg, text: button.text };
  }

  _createNavButton(x, y, label, handler) {
    const button = createButton(this, {
      x, y, width: 140, height: 44, label,
      fill: UI_COLORS.navy, stroke: 0x9ccbd2, fontSize: 14,
      radius: 14, depth: 20, onClick: handler
    });
    return { bg: button.bg, text: button.text };
  }

  _bindKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._keyboardHandler = (event) => {
      if (this.finished) return;
      if (event.code === 'ArrowLeft') this._goToQuestion(this.currentQuestionIndex - 1);
      else if (event.code === 'ArrowRight') this._goToQuestion(this.currentQuestionIndex + 1);
      else if (event.code === 'Enter' || event.code === 'Space') this._selectAnswer(this._getFocusedOptionIndex());
    };
    this.input.keyboard.on('keydown', this._keyboardHandler);
  }

  _getFocusedOptionIndex() {
    const current = this.selectedAnswers[this.currentQuestionIndex];
    return current ?? 0;
  }

  _selectAnswer(optionIndex) {
    if (this.finished) return;
    this.selectedAnswers[this.currentQuestionIndex] = optionIndex;
    this._refreshQuestion();
  }

  _goToQuestion(targetIndex) {
    if (targetIndex < 0 || targetIndex >= this.questions.length) return;
    this.currentQuestionIndex = targetIndex;
    this._refreshQuestion();
  }

  _refreshQuestion() {
    const question = this.questions[this.currentQuestionIndex];
    const isReview = this.reviewMode || this.finished;

    this.questionText.setText(question.question);
    this.progressText.setText(`Soru ${this.currentQuestionIndex + 1} / ${this.questions.length}`);
    this.navInfoText.setText(`Soru ${this.currentQuestionIndex + 1} / ${this.questions.length}`);

    question.options.forEach((optionText, index) => {
      const button = this.optionButtons[index];
      const selected = this.selectedAnswers[this.currentQuestionIndex] === index;
      const correct = question.correctIndex === index;

      button.text.setText(`${String.fromCharCode(65 + index)}) ${optionText}`);

      if (isReview) {
        if (correct) {
          button.bg.setFillStyle(0x16a34a, 0.98);
          button.bg.setStrokeStyle(2, 0xdcfce7);
        } else if (selected) {
          button.bg.setFillStyle(0xdc2626, 0.98);
          button.bg.setStrokeStyle(2, 0xfecaca);
        } else {
          button.bg.setFillStyle(0x475569, 0.9);
          button.bg.setStrokeStyle(2, 0x64748b);
        }
        button.bg.disableInteractive();
      } else {
        button.bg.setFillStyle(selected ? 0x0f766e : 0x1d4ed8, 0.98);
        button.bg.setStrokeStyle(2, selected ? 0x99f6e4 : 0x93c5fd);
        button.bg.setInteractive({ useHandCursor: true });
      }
    });

    if (this.feedbackText) {
      if (isReview) {
        const selected = this.selectedAnswers[this.currentQuestionIndex];
        const correct = question.correctIndex;
        this.feedbackText.setText(selected === correct ? 'Bu soru doğru cevaplanmış.' : `Doğru cevap: ${String.fromCharCode(65 + correct)}`);
      } else if (this.selectedAnswers[this.currentQuestionIndex] !== null) {
        this.feedbackText.setText('Cevap seçildi. İstersen başka sorulara geçebilirsin.');
      } else {
        this.feedbackText.setText('Doğru seçeneği işaretle.');
      }
    }

    this._updateNavState();
    this._updateSummaryText();
  }

  _updateNavState() {
    const first = this.currentQuestionIndex === 0;
    const last = this.currentQuestionIndex === this.questions.length - 1;

    this.prevButton.bg.setAlpha(first ? 0.45 : 1);
    this.prevButton.text.setAlpha(first ? 0.45 : 1);
    this.prevButton.bg.disableInteractive();
    if (!first) this.prevButton.bg.setInteractive({ useHandCursor: true });
    this.prevButton.bg.off('pointerup');
    if (!first) this.prevButton.bg.on('pointerup', () => this._goToQuestion(this.currentQuestionIndex - 1));

    this.nextButton.bg.setAlpha(last ? 0.45 : 1);
    this.nextButton.text.setAlpha(last ? 0.45 : 1);
    this.nextButton.bg.disableInteractive();
    if (!last) this.nextButton.bg.setInteractive({ useHandCursor: true });
    this.nextButton.bg.off('pointerup');
    if (!last) this.nextButton.bg.on('pointerup', () => this._goToQuestion(this.currentQuestionIndex + 1));
  }

  _updateSummaryText() {
    if (this.finished) {
      this.resultText.setText(`Doğru: ${this.summary.correct}  |  Yanlış: ${this.summary.wrong}`);
    } else if (this.reviewMode) {
      this.resultText.setText(`İnceleme modu açık. Doğru: ${this.summary.correct}  |  Yanlış: ${this.summary.wrong}`);
    } else {
      this.resultText.setText('');
    }
  }

  _finishQuiz(fromTimeout = false) {
    if (this.finished) return;

    this.finished = true;
    this.reviewMode = true;
    this._markGameCompleted();
    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }
    const stats = this._calculateStats();
    this.summary = stats;
    this.remainingSeconds = fromTimeout ? 0 : this.remainingSeconds;
    this.timerText.setText(`Süre: ${this.remainingSeconds}`);
    this._refreshQuestion();
  }

  _markGameCompleted() {
    const completedGames = this.registry.get('completedGames') || {};
    this.registry.set('completedGames', { ...completedGames, game6: true });
  }

  _onShutdown() {
    if (this._resizeHandler) {
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }

    if (this._keyboardHandler) {
      this.input.keyboard.off('keydown', this._keyboardHandler);
      this._keyboardHandler = null;
    }

    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }
  }

  _calculateStats() {
    let correct = 0;
    let wrong = 0;
    this.questions.forEach((question, index) => {
      const selected = this.selectedAnswers[index];
      if (selected === question.correctIndex) correct += 1;
      else wrong += 1;
    });
    return { correct, wrong };
  }

  update() {
    if (this.finished) return;

    if (this.cursors?.left?.isDown && !this._leftCooldown) {
      this._leftCooldown = true;
      this._goToQuestion(this.currentQuestionIndex - 1);
      this.time.delayedCall(160, () => { this._leftCooldown = false; });
    }

    if (this.cursors?.right?.isDown && !this._rightCooldown) {
      this._rightCooldown = true;
      this._goToQuestion(this.currentQuestionIndex + 1);
      this.time.delayedCall(160, () => { this._rightCooldown = false; });
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this._selectAnswer(this._getFocusedOptionIndex());
    }
  }

  _onResize(width, height) {
    this.backdrop?.resize(width, height);
    const compact = this._isCompactLayout(width, height);
    const navGrid = width < 1080 || compact;

    if (this.bgFill) {
      this.bgFill.setDisplaySize(width, height);
      this.bgFill.setPosition(0, 0);
    }

    if (this.headerBar) {
      this.headerBar.setPosition(width / 2, compact ? 46 : 54);
      this.headerBar.resizePanel(Math.min(compact ? width - 16 : 760, width - (compact ? 16 : 32)), compact ? 96 : 84);
    }

    if (this.titleText) {
      this.titleText.setText(compact ? 'Mini Oyun 6' : 'Mini Oyun 6 - Teknik Servis Quiz');
      this.titleText.setPosition(Math.round(width / 2), compact ? 10 : 34);
      this.titleText.setFontSize(compact ? 18 : 28);
    }

    if (this.timerText) {
      this.timerText.setPosition(Math.round(width - 20), compact ? 12 : 34);
      this.timerText.setFontSize(compact ? 18 : 26);
    }

    if (this.progressText) {
      this.progressText.setPosition(Math.round(width / 2), compact ? 62 : 98);
      this.progressText.setFontSize(compact ? 14 : 18);
      this.progressText.setColor(compact ? '#c9e7df' : '#49657d');
    }

    const questionPanelWidth = compact ? width - 16 : Math.min(760, width - 32);
    const questionPanelHeight = compact ? Math.max(300, Math.min(400, height - 240)) : QUESTION_PANEL_HEIGHT;
    const questionPanelY = compact ? 104 + Math.round(questionPanelHeight / 2) : Math.round(height / 2 - QUESTION_PANEL_OFFSET_Y);
    const questionPanelTop = Math.round(questionPanelY - questionPanelHeight / 2);

    if (this.questionPanel) {
      this.questionPanel.setPosition(Math.round(width / 2), questionPanelY);
      this.questionPanel.resizePanel(questionPanelWidth, questionPanelHeight);
    }

    if (this.questionText) {
      const questionTextY = compact ? questionPanelTop + 14 : Math.round(height / 2 - 160);
      this.questionText.setPosition(Math.round(width / 2), questionTextY);
      this.questionText.setWordWrapWidth(Math.min(compact ? width - 48 : 680, width - (compact ? 48 : 96)));
      this.questionText.setFontSize(compact ? 18 : 26);
    }

    const questionTextHeight = this.questionText ? this.questionText.height : 0;
    const optionStartY = compact
      ? Math.max(questionPanelTop + 132, questionPanelTop + 14 + questionTextHeight + 18)
      : Math.round(height / 2 - 20);
    const optionY = compact
      ? [optionStartY, optionStartY + 60, optionStartY + 120]
      : [optionStartY, optionStartY + 67, optionStartY + 134];
    const optionWidth = compact ? width - 24 : Math.min(620, width - 80);
    const optionHeight = compact ? 48 : 60;

    this.optionButtons.forEach((button, index) => {
      button.bg.setPosition(Math.round(width / 2), Math.round(optionY[index]));
      button.bg.setDisplaySize(optionWidth, optionHeight);
      button.text.setPosition(Math.round(width / 2), Math.round(optionY[index]));
      button.text.setWordWrapWidth(Math.min(compact ? width - 64 : 560, width - (compact ? 64 : 140)));
      button.text.setFontSize(compact ? 15 : 18);
    });

    if (this.feedbackText) {
      this.feedbackText.setPosition(Math.round(width / 2), compact ? Math.round(optionY[2] + 52) : Math.round(height / 2 + 160));
      this.feedbackText.setWordWrapWidth(Math.min(compact ? width - 48 : 680, width - (compact ? 48 : 96)));
      this.feedbackText.setFontSize(compact ? 15 : 18);
    }

    if (this.resultText) {
      this.resultText.setPosition(Math.round(width / 2), compact ? Math.round(height - 138) : Math.round(height - 120));
      this.resultText.setWordWrapWidth(Math.min(compact ? width - 32 : 700, width - (compact ? 32 : 60)));
      this.resultText.setFontSize(compact ? 16 : 20);
    }

    if (this.navInfoText) {
      this.navInfoText.setVisible(!compact);
      this.navInfoText.setPosition(Math.round(width / 2), compact ? Math.round(height - 108) : Math.round(height - 76));
      this.navInfoText.setFontSize(compact ? 13 : 16);
    }

    const navButtonHeight = navGrid ? 42 : 44;
    const navFontSize = navGrid ? 12 : 15;

    if (navGrid) {
      const navButtonWidth = Math.min(220, Math.floor((width - 56) / 2));
      const leftX = Math.round(width / 2 - navButtonWidth / 2 - 6);
      const rightX = Math.round(width / 2 + navButtonWidth / 2 + 6);
      const topY = Math.round(height - 92);
      const bottomY = Math.round(height - 40);

      if (this.prevButton) {
        this.prevButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.prevButton.bg.setPosition(leftX, topY);
        this.prevButton.text.setPosition(leftX, topY);
        this.prevButton.text.setFontSize(navFontSize);
        this.prevButton.text.setText('Önceki');
      }
      if (this.nextButton) {
        this.nextButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.nextButton.bg.setPosition(rightX, topY);
        this.nextButton.text.setPosition(rightX, topY);
        this.nextButton.text.setFontSize(navFontSize);
        this.nextButton.text.setText('Sonraki');
      }
      if (this.finishButton) {
        this.finishButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.finishButton.bg.setPosition(leftX, bottomY);
        this.finishButton.text.setPosition(leftX, bottomY);
        this.finishButton.text.setFontSize(navFontSize);
        this.finishButton.text.setText('Bitir');
      }
      if (this.menuButton) {
        this.menuButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.menuButton.bg.setPosition(rightX, bottomY);
        this.menuButton.text.setPosition(rightX, bottomY);
        this.menuButton.text.setFontSize(navFontSize);
        this.menuButton.text.setText('Ana Menü');
      }
    } else {
      const navButtonWidth = 140;
      const navBottomY = height - 34;

      if (this.prevButton) {
        this.prevButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.prevButton.bg.setPosition(Math.round(width / 2 - 220), navBottomY);
        this.prevButton.text.setPosition(Math.round(width / 2 - 220), navBottomY);
        this.prevButton.text.setFontSize(navFontSize);
        this.prevButton.text.setText('Önceki Soru');
      }
      if (this.nextButton) {
        this.nextButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.nextButton.bg.setPosition(Math.round(width / 2 - 70), navBottomY);
        this.nextButton.text.setPosition(Math.round(width / 2 - 70), navBottomY);
        this.nextButton.text.setFontSize(navFontSize);
        this.nextButton.text.setText('Sonraki Soru');
      }
      if (this.finishButton) {
        this.finishButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.finishButton.bg.setPosition(Math.round(width / 2 + 88), navBottomY);
        this.finishButton.text.setPosition(Math.round(width / 2 + 88), navBottomY);
        this.finishButton.text.setFontSize(navFontSize);
        this.finishButton.text.setText('Testi Bitir');
      }
      if (this.menuButton) {
        this.menuButton.bg.setDisplaySize(navButtonWidth, navButtonHeight);
        this.menuButton.bg.setPosition(Math.round(width / 2 + 250), navBottomY);
        this.menuButton.text.setPosition(Math.round(width / 2 + 250), navBottomY);
        this.menuButton.text.setFontSize(navFontSize);
        this.menuButton.text.setText('Ana Menüye Dön');
      }
    }
  }
}
