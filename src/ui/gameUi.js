import Phaser from 'phaser';

export const UI_COLORS = {
  ink: 0x17324d,
  inkSoft: 0x49657d,
  cream: 0xfff8ec,
  paper: 0xffffff,
  sky: 0xeaf6f5,
  navy: 0x17324d,
  teal: 0x1f9d8b,
  tealDark: 0x147565,
  blue: 0x3d7fc4,
  blueDark: 0x285f9c,
  amber: 0xf2b84b,
  amberDark: 0xc9861a,
  coral: 0xe97862,
  coralDark: 0xb94f3c,
  green: 0x49a66f,
  greenDark: 0x2f7c50,
  lavender: 0x7768b5,
  lavenderDark: 0x564695,
  muted: 0x91a5b5,
  mutedDark: 0x667d90,
  line: 0xd7e5e7,
  shadow: 0x102a3d
};

const toCss = (color) => `#${Number(color).toString(16).padStart(6, '0')}`;

export function addBackdrop(scene, options = {}) {
  const { width, height } = scene.scale;
  const base = scene.add.rectangle(0, 0, width, height, options.color ?? UI_COLORS.cream)
    .setOrigin(0)
    .setDepth(options.depth ?? -200);
  const glowA = scene.add.circle(width * 0.08, height * 0.12, Math.max(width, height) * 0.18, options.accent ?? UI_COLORS.teal, 0.08)
    .setDepth((options.depth ?? -200) + 1);
  const glowB = scene.add.circle(width * 0.92, height * 0.86, Math.max(width, height) * 0.24, options.secondary ?? UI_COLORS.amber, 0.08)
    .setDepth((options.depth ?? -200) + 1);

  return {
    base,
    glowA,
    glowB,
    resize(nextWidth, nextHeight) {
      base.setDisplaySize(nextWidth, nextHeight).setPosition(0, 0);
      const radius = Math.max(nextWidth, nextHeight);
      glowA.setPosition(nextWidth * 0.08, nextHeight * 0.12).setRadius(radius * 0.18);
      glowB.setPosition(nextWidth * 0.92, nextHeight * 0.86).setRadius(radius * 0.24);
    }
  };
}

export function createPanel(scene, x, y, width, height, options = {}) {
  const graphics = scene.add.graphics().setPosition(x, y).setDepth(options.depth ?? 0);
  const state = {
    width,
    height,
    fill: options.fill ?? UI_COLORS.paper,
    fillAlpha: options.fillAlpha ?? 0.97,
    stroke: options.stroke ?? UI_COLORS.line,
    strokeAlpha: options.strokeAlpha ?? 1,
    lineWidth: options.lineWidth ?? 2,
    radius: options.radius ?? 20,
    shadow: options.shadow !== false,
    shadowColor: options.shadowColor ?? UI_COLORS.shadow,
    shadowAlpha: options.shadowAlpha ?? 0.12,
    shadowY: options.shadowY ?? 7
  };

  const redraw = () => {
    graphics.clear();
    const left = -state.width / 2;
    const top = -state.height / 2;
    if (state.shadow) {
      graphics.fillStyle(state.shadowColor, state.shadowAlpha);
      graphics.fillRoundedRect(left, top + state.shadowY, state.width, state.height, state.radius);
    }
    graphics.fillStyle(state.fill, state.fillAlpha);
    graphics.fillRoundedRect(left, top, state.width, state.height, state.radius);
    if (state.lineWidth > 0) {
      graphics.lineStyle(state.lineWidth, state.stroke, state.strokeAlpha);
      graphics.strokeRoundedRect(left, top, state.width, state.height, state.radius);
    }
  };
  redraw();

  graphics.resizePanel = (nextWidth, nextHeight) => {
    state.width = Math.max(1, nextWidth);
    state.height = Math.max(1, nextHeight);
    redraw();
    return graphics;
  };
  graphics.setPanelColors = (fill, stroke = state.stroke) => {
    state.fill = fill;
    state.stroke = stroke;
    redraw();
    return graphics;
  };
  graphics.panelState = state;
  return graphics;
}

export function createButton(scene, {
  x,
  y,
  width = 180,
  height = 52,
  label = '',
  fill = UI_COLORS.blue,
  hoverFill,
  pressedFill,
  stroke = 0xffffff,
  textColor = '#ffffff',
  disabledFill = 0xd9e2e8,
  disabledTextColor = '#657b8c',
  radius = 15,
  fontSize = 17,
  depth = 100,
  onClick,
  icon = null,
  shadow = true
} = {}) {
  const shadowGraphics = scene.add.graphics().setDepth(depth);
  const faceGraphics = scene.add.graphics().setDepth(depth + 1);
  const hit = scene.add.zone(x, y, width, height).setOrigin(0.5).setDepth(depth + 3);
  const text = scene.add.text(x, y, label, {
    fontSize: `${fontSize}px`,
    color: textColor,
    align: 'center',
    fontStyle: 'bold',
    wordWrap: { width: Math.max(20, width - 28) }
  }).setOrigin(0.5).setDepth(depth + 2);
  text.setResolution(2);
  const animatedTargets = [faceGraphics, text];

  const state = {
    x,
    y,
    width,
    height,
    fill,
    hoverFill: hoverFill ?? Phaser.Display.Color.IntegerToColor(fill).brighten(8).color,
    pressedFill: pressedFill ?? Phaser.Display.Color.IntegerToColor(fill).darken(10).color,
    stroke,
    textColor,
    disabledFill,
    disabledTextColor,
    radius,
    lineWidth: 2,
    enabled: true,
    alpha: 1,
    over: false,
    down: false,
    shadow
  };

  const render = () => {
    shadowGraphics.clear();
    faceGraphics.clear();
    const left = -state.width / 2;
    const top = -state.height / 2;
    const color = !state.enabled
      ? state.disabledFill
      : state.down
        ? state.pressedFill
        : state.over
          ? state.hoverFill
          : state.fill;

    if (state.shadow) {
      shadowGraphics.fillStyle(UI_COLORS.shadow, state.enabled ? 0.16 : 0.08);
      shadowGraphics.fillRoundedRect(left, top, state.width, state.height, state.radius);
    }
    faceGraphics.fillStyle(color, 1);
    faceGraphics.fillRoundedRect(left, top, state.width, state.height, state.radius);
    faceGraphics.lineStyle(state.lineWidth, state.enabled ? state.stroke : 0xb9c8d2, state.enabled ? 0.75 : 0.55);
    faceGraphics.strokeRoundedRect(left, top, state.width, state.height, state.radius);
    text.setColor(state.enabled ? state.textColor : state.disabledTextColor);
    text.setWordWrapWidth(Math.max(20, state.width - (icon ? 54 : 28)));
  };

  const setWorldPosition = (nextX, nextY) => {
    state.x = nextX;
    state.y = nextY;
    shadowGraphics.setPosition(nextX, nextY + 5);
    faceGraphics.setPosition(nextX, nextY);
    hit.setPosition(nextX, nextY);
    text.setPosition(nextX + (icon ? 10 : 0), nextY);
  };

  const tweenLift = (offsetY, duration = 90) => {
    scene.tweens.killTweensOf(animatedTargets);
    scene.tweens.add({
      targets: animatedTargets,
      y: state.y + offsetY,
      duration,
      ease: 'Sine.easeOut'
    });
  };

  hit.setInteractive({ useHandCursor: true });
  hit.on('pointerover', () => {
    if (!state.enabled) return;
    state.over = true;
    render();
    tweenLift(-2, 100);
  });
  hit.on('pointerout', () => {
    state.over = false;
    state.down = false;
    render();
    tweenLift(0, 100);
  });
  hit.on('pointerdown', () => {
    if (!state.enabled) return;
    state.down = true;
    render();
    tweenLift(1, 65);
  });
  const handlePointerUp = () => {
    if (!state.enabled) return;
    state.down = false;
    render();
    tweenLift(state.over ? -2 : 0, 75);
  };
  hit.on('pointerup', handlePointerUp);
  if (onClick) hit.on('pointerup', onClick);

  const bg = {
    setPosition(nextX, nextY) {
      setWorldPosition(nextX, nextY);
      return bg;
    },
    setDisplaySize(nextWidth, nextHeight) {
      state.width = Math.max(1, nextWidth);
      state.height = Math.max(1, nextHeight);
      hit.setSize(state.width, state.height);
      render();
      return bg;
    },
    setSize(nextWidth, nextHeight) {
      return bg.setDisplaySize(nextWidth, nextHeight);
    },
    setFillStyle(nextFill) {
      state.fill = nextFill;
      state.hoverFill = Phaser.Display.Color.IntegerToColor(nextFill).brighten(8).color;
      state.pressedFill = Phaser.Display.Color.IntegerToColor(nextFill).darken(10).color;
      render();
      return bg;
    },
    setStrokeStyle(lineWidth, nextStroke) {
      state.lineWidth = lineWidth;
      state.stroke = nextStroke;
      render();
      return bg;
    },
    setInteractive() {
      state.enabled = true;
      hit.setInteractive({ useHandCursor: true });
      render();
      return bg;
    },
    disableInteractive() {
      state.enabled = false;
      state.over = false;
      state.down = false;
      hit.disableInteractive();
      tweenLift(0, 80);
      render();
      return bg;
    },
    on(event, handler) {
      hit.on(event, handler);
      return bg;
    },
    off(event, handler) {
      if (handler) {
        hit.off(event, handler);
      } else {
        hit.removeAllListeners(event);
        if (event === 'pointerup') hit.on('pointerup', handlePointerUp);
      }
      return bg;
    },
    setAlpha(alpha) {
      state.alpha = alpha;
      shadowGraphics.setAlpha(alpha);
      faceGraphics.setAlpha(alpha);
      hit.setAlpha(alpha);
      text.setAlpha(alpha);
      return bg;
    },
    setDepth(nextDepth) {
      shadowGraphics.setDepth(nextDepth);
      faceGraphics.setDepth(nextDepth + 1);
      text.setDepth(nextDepth + 2);
      hit.setDepth(nextDepth + 3);
      return bg;
    },
    setVisible(visible) {
      shadowGraphics.setVisible(visible);
      faceGraphics.setVisible(visible);
      hit.setVisible(visible);
      text.setVisible(visible);
      return bg;
    },
    destroy() {
      shadowGraphics.destroy();
      faceGraphics.destroy();
      hit.destroy();
      text.destroy();
    },
    get x() { return state.x; },
    get y() { return state.y; },
    get displayWidth() { return state.width; },
    get displayHeight() { return state.height; },
    state,
    hit,
    face: faceGraphics,
    shadow: shadowGraphics
  };

  setWorldPosition(x, y);
  render();

  if (icon) {
    const iconText = scene.add.text(x - width / 2 + 24, y, icon, {
      fontSize: `${Math.max(16, fontSize)}px`,
      color: textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(depth + 2);
    iconText.setResolution(2);
    animatedTargets.push(iconText);
    const originalSetPosition = bg.setPosition;
    bg.setPosition = (nextX, nextY) => {
      originalSetPosition(nextX, nextY);
      iconText.setPosition(nextX - state.width / 2 + 24, nextY);
      return bg;
    };
    const originalResize = bg.setDisplaySize;
    bg.setDisplaySize = (nextWidth, nextHeight) => {
      originalResize(nextWidth, nextHeight);
      iconText.setPosition(state.x - state.width / 2 + 24, state.y);
      return bg;
    };
    bg.setSize = bg.setDisplaySize;
    const originalAlpha = bg.setAlpha;
    bg.setAlpha = (alpha) => {
      originalAlpha(alpha);
      iconText.setAlpha(alpha);
      return bg;
    };
    const originalVisible = bg.setVisible;
    bg.setVisible = (visible) => {
      originalVisible(visible);
      iconText.setVisible(visible);
      return bg;
    };
    const originalDestroy = bg.destroy;
    bg.destroy = () => {
      iconText.destroy();
      originalDestroy();
    };
    bg.iconText = iconText;
  }

  return { bg, text, hit, state };
}

export function createHeader(scene, title, subtitle = '') {
  const eyebrow = scene.add.text(0, 0, 'BİLİNÇLİ KULLANIM • GÜVENLİ YAŞAM', {
    fontSize: '13px',
    color: toCss(UI_COLORS.tealDark),
    fontStyle: 'bold',
    letterSpacing: 1.5
  }).setOrigin(0.5);
  const heading = scene.add.text(0, 0, title, {
    fontSize: '32px',
    color: toCss(UI_COLORS.ink),
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5);
  const subheading = scene.add.text(0, 0, subtitle, {
    fontSize: '17px',
    color: toCss(UI_COLORS.inkSoft),
    align: 'center',
    wordWrap: { width: 680 }
  }).setOrigin(0.5);
  return { eyebrow, heading, subheading };
}

export function pulseSuccess(scene, targets) {
  const targetList = Array.isArray(targets) ? targets : [targets];
  targetList.filter(Boolean).forEach((target) => {
    const baseScaleX = Number.isFinite(target.scaleX) ? target.scaleX : 1;
    const baseScaleY = Number.isFinite(target.scaleY) ? target.scaleY : 1;
    scene.tweens.killTweensOf(target);
    scene.tweens.add({
      targets: target,
      scaleX: baseScaleX * 1.018,
      scaleY: baseScaleY * 1.018,
      duration: 105,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => target.setScale?.(baseScaleX, baseScaleY)
    });
  });
}

export function shakeSoft(scene, target) {
  const originX = target.x;
  scene.tweens.add({
    targets: target,
    x: { from: originX - 7, to: originX + 7 },
    duration: 55,
    repeat: 3,
    yoyo: true,
    ease: 'Sine.easeInOut',
    onComplete: () => target.setX(originX)
  });
}
