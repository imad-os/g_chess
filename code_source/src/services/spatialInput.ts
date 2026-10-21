// Unified Keyboard, Smart TV Remote & W3C Gamepad Input + 2D Spatial Focus Engine

export type NavDirection = 'up' | 'down' | 'left' | 'right';

export type UnifiedAction =
  | NavDirection
  | 'confirm'
  | 'cancel'
  | 'zone_switch'
  | 'flip'
  | 'prev_tab'
  | 'next_tab'
  | 'pause'
  | 'undo'
  | 'resign'
  | 'chat';

export type InputSource = 'keyboard' | 'mypc' | 'gamepad';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-tv-focusable="true"]';

/**
 * Checks whether an element is visible and interactive on screen
 */
export function isElementVisible(el: HTMLElement): boolean {
  if (!el || !el.isConnected) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

/**
 * Returns all visible focusable elements inside a container
 */
export function getFocusableElements(
  container: HTMLElement | Document = document,
  excludeContainer?: HTMLElement | null
): HTMLElement[] {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((el) => {
    if (excludeContainer && excludeContainer.contains(el)) return false;
    if (el.dataset.tvIgnore === 'true') return false;
    return isElementVisible(el);
  });
}

/**
 * Gets the currently highlighted [data-tv-focused="true"] element inside a container
 */
export function getCurrentFocusedElement(
  container: HTMLElement | Document = document
): HTMLElement | null {
  const current = container.querySelector<HTMLElement>('[data-tv-focused="true"]');
  if (current && isElementVisible(current)) {
    return current;
  }
  return null;
}

/**
 * Clears all [data-tv-focused="true"] markers in the document
 */
export function clearAllSpatialFocus(): void {
  const all = document.querySelectorAll<HTMLElement>('[data-tv-focused="true"]');
  all.forEach((el) => el.removeAttribute('data-tv-focused'));
}

/**
 * Sets [data-tv-focused="true"] on a specific element and scrolls it gently into view
 */
export function setSpatialFocus(el: HTMLElement | null): HTMLElement | null {
  clearAllSpatialFocus();
  if (!el || !isElementVisible(el)) return null;
  el.setAttribute('data-tv-focused', 'true');
  try {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  } catch {
    try {
      el.scrollIntoView(false);
    } catch {}
  }
  return el;
}

/**
 * Ensures at least one element inside the container has [data-tv-focused="true"]
 */
export function ensureSpatialFocus(
  container: HTMLElement | Document = document,
  excludeContainer?: HTMLElement | null
): HTMLElement | null {
  const existing = getCurrentFocusedElement(container);
  if (existing && (!excludeContainer || !excludeContainer.contains(existing))) {
    return existing;
  }
  const preferred = container.querySelector<HTMLElement>(
    '[data-tv-autofocus="true"]:not([disabled])'
  );
  if (preferred && isElementVisible(preferred)) {
    return setSpatialFocus(preferred);
  }
  const list = getFocusableElements(container, excludeContainer);
  if (list.length > 0) {
    return setSpatialFocus(list[0]);
  }
  return null;
}

/**
 * Steps a React-controlled <input type="range"> slider left or right
 */
export function stepRangeInput(input: HTMLInputElement, direction: 'left' | 'right'): boolean {
  if (input.tagName !== 'INPUT' || input.type !== 'range') return false;
  const min = input.min !== '' ? Number(input.min) : 0;
  const max = input.max !== '' ? Number(input.max) : 100;
  const step = input.step !== '' && input.step !== 'any' ? Number(input.step) : 1;
  const current = Number(input.value);
  const delta = direction === 'right' ? step : -step;
  const nextVal = Math.min(max, Math.max(min, current + delta));
  if (nextVal === current) return true;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, String(nextVal));
  } else {
    input.value = String(nextVal);
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/**
 * Finds the best next focusable element in a 2D direction using bounding-box geometry
 */
export function findNextSpatialElement(
  candidates: HTMLElement[],
  current: HTMLElement,
  direction: NavDirection
): HTMLElement | null {
  const curRect = current.getBoundingClientRect();
  const curCx = curRect.left + curRect.width / 2;
  const curCy = curRect.top + curRect.height / 2;

  let bestCandidate: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of candidates) {
    if (el === current) continue;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = cx - curCx;
    const dy = cy - curCy;

    let primaryDist = 0;
    let perpDist = 0;
    let hasOverlap = false;

    if (direction === 'up') {
      if (cy >= curCy - 4 && rect.bottom >= curRect.top + 2) continue;
      primaryDist = Math.max(1, curRect.top - rect.bottom);
      if (curRect.top < rect.bottom) primaryDist = Math.abs(dy);
      perpDist = Math.abs(dx);
      hasOverlap = rect.right > curRect.left - 8 && rect.left < curRect.right + 8;
    } else if (direction === 'down') {
      if (cy <= curCy + 4 && rect.top <= curRect.bottom - 2) continue;
      primaryDist = Math.max(1, rect.top - curRect.bottom);
      if (rect.top < curRect.bottom) primaryDist = Math.abs(dy);
      perpDist = Math.abs(dx);
      hasOverlap = rect.right > curRect.left - 8 && rect.left < curRect.right + 8;
    } else if (direction === 'left') {
      if (cx >= curCx - 4 && rect.right >= curRect.left + 2) continue;
      primaryDist = Math.max(1, curRect.left - rect.right);
      if (curRect.left < rect.right) primaryDist = Math.abs(dx);
      perpDist = Math.abs(dy);
      hasOverlap = rect.bottom > curRect.top - 8 && rect.top < curRect.bottom + 8;
    } else if (direction === 'right') {
      if (cx <= curCx + 4 && rect.left <= curRect.right - 2) continue;
      primaryDist = Math.max(1, rect.left - curRect.right);
      if (rect.left < curRect.right) primaryDist = Math.abs(dx);
      perpDist = Math.abs(dy);
      hasOverlap = rect.bottom > curRect.top - 8 && rect.top < curRect.bottom + 8;
    }

    // Strongly prefer candidates aligned in the same row/column
    const overlapMultiplier = hasOverlap ? 1.35 : 3.6;
    const nonOverlapPenalty = hasOverlap ? 0 : 120;
    const score = primaryDist + perpDist * overlapMultiplier + nonOverlapPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestCandidate = el;
    }
  }

  return bestCandidate;
}

/**
 * Triggers confirmation (click or text input focus) on the currently focused element
 */
export function triggerSpatialConfirm(
  container: HTMLElement | Document = document
): boolean {
  const current = getCurrentFocusedElement(container);
  if (!current) return false;

  const tag = current.tagName;
  if (
    (tag === 'INPUT' &&
      (current as HTMLInputElement).type !== 'range' &&
      (current as HTMLInputElement).type !== 'checkbox' &&
      (current as HTMLInputElement).type !== 'button' &&
      (current as HTMLInputElement).type !== 'submit') ||
    tag === 'TEXTAREA'
  ) {
    if (document.activeElement !== current) {
      current.focus();
      return true;
    } else {
      // If inside a form, submit it; otherwise blur
      const form = current.closest('form');
      if (form) {
        form.requestSubmit?.();
      }
      current.blur();
      return true;
    }
  }

  current.click();
  return true;
}

/**
 * Maps MyPC SDK action strings to our unified semantic actions
 */
export function mapMyPCAction(rawAction: string): UnifiedAction | null {
  const a = (rawAction || '').toLowerCase().trim();
  switch (a) {
    case 'up':
    case 'dpad_up':
      return 'up';
    case 'down':
    case 'dpad_down':
      return 'down';
    case 'left':
    case 'dpad_left':
      return 'left';
    case 'right':
    case 'dpad_right':
      return 'right';
    case 'confirm':
    case 'jump':
    case 'action':
    case 'select':
    case 'ok':
    case 'enter':
    case 'a':
    case 'south':
      return 'confirm';
    case 'cancel':
    case 'back':
    case 'b':
    case 'east':
      return 'cancel';
    case 'run':
    case 'x':
    case 'west':
    case 'tab':
      return 'zone_switch';
    case 'y':
    case 'north':
    case 'flip':
      return 'flip';
    case 'l1':
    case 'lb':
    case 'pageup':
      return 'prev_tab';
    case 'r1':
    case 'rb':
    case 'pagedown':
      return 'next_tab';
    case 'menu':
    case 'pause':
    case 'start':
      return 'pause';
    default:
      return null;
  }
}

/**
 * Maps DOM KeyboardEvent (including Smart TV Remote keycodes for Android TV, WebOS, Tizen)
 * Note: Uses Arrow keys only for directional movement (no WASD).
 */
export function mapKeyboardOrTVEvent(e: KeyboardEvent): UnifiedAction | null {
  const key = e.key;
  const code = e.keyCode || e.which;

  // Directional Arrow Keys + Smart TV D-Pad keyCodes
  if (key === 'ArrowUp' || key === 'Up' || code === 19) return 'up';
  if (key === 'ArrowDown' || key === 'Down' || code === 20) return 'down';
  if (key === 'ArrowLeft' || key === 'Left' || code === 21) return 'left';
  if (key === 'ArrowRight' || key === 'Right' || code === 22) return 'right';

  // Confirm / OK / Center D-Pad on TV Remotes
  if (
    key === 'Enter' ||
    key === ' ' ||
    key === 'Spacebar' ||
    key === 'Select' ||
    key === 'Ok' ||
    key === 'Accept' ||
    code === 23 || // Android TV DPAD_CENTER
    code === 66
  ) {
    return 'confirm';
  }

  // Cancel / Back on Keyboard & Smart TV Remotes (WebOS 461, Tizen 10009, Android TV 4)
  if (
    key === 'Escape' ||
    key === 'Backspace' ||
    key === 'BrowserBack' ||
    key === 'GoBack' ||
    key === 'XF86Back' ||
    key === 'Back' ||
    code === 27 ||
    code === 8 ||
    code === 4 ||
    code === 461 ||
    code === 10009
  ) {
    return 'cancel';
  }

  // Zone Switch (Board <-> Side Panels & Action Buttons)
  if (key === 'Tab' || key === 'ColorF2Yellow') {
    return 'zone_switch';
  }

  // TV Remote Menu / PlayPause / Red button -> Pause
  if (
    key === 'MediaPlayPause' ||
    key === 'ContextMenu' ||
    key === 'Menu' ||
    key === 'ColorF0Red' ||
    code === 82
  ) {
    return 'pause';
  }

  // TV Remote Green button -> Flip Board
  if (key === 'ColorF1Green') {
    return 'flip';
  }

  // TV Remote Blue button -> Chat / Notes
  if (key === 'ColorF3Blue') {
    return 'chat';
  }

  // PageUp / PageDown -> Prev / Next Tab or Move History Step
  if (key === 'PageUp') return 'prev_tab';
  if (key === 'PageDown') return 'next_tab';

  return null;
}
