export type Lang = "en" | "zh";

const STORAGE_KEY = "esptool-lang";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Page
    "page.title": "Firmware Serial Flasher",
    "page.safariErr": "This tool is not supported on Safari browser!",
    "page.debugLog": "Show Debug Log",

    // Terminal
    "terminal.title": "Device Output Console",

    // Badge
    "badge.html": `Supported by <a href="https://github.com/espressif/esptool-js" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">esptool-js</a>`,

    // Footer
    "footer.copyright": "\u00A9 2026 ACENOVA TECH Copyright",

    // Program section
    "program.title": "Program",
    "program.baudrate": "Baudrate:",
    "program.connected": "Connected to device: ",
    "program.connect": "Connect",
    "program.copyTrace": "Copy Trace",
    "program.disconnect": "Disconnect",
    "program.eraseFlash": "Erase Flash",

    // File table
    "table.flashAddr": "Address",
    "table.file": "File",
    "table.action": "Action",
    "table.progress": "Progress",
    "table.addFile": "Add File",
    "table.remove": "Remove",

    // Flash options
    "flash.mode": "Flash Mode:",
    "flash.freq": "Flash Frequency:",
    "flash.size": "Flash Size:",
    "flash.program": "Program",
    "flash.keep": "keep",
    "flash.detect": "detect",

    // Console section
    "console.title": "Console",
    "console.connected": "Connected to device: ",
    "console.baudrate": "Baudrate:",
    "console.reconnectDelay": "Reconnect Delay (ms):",
    "console.maxRetries": "Max Retries:",
    "console.start": "Start",
    "console.stop": "Stop",
    "console.reset": "Reset",

    // Dynamic messages
    "msg.deviceLost": "\n[DEVICE LOST] Device disconnected. Trying to reconnect...",
    "msg.reconnectAttempt": "\n[RECONNECT] Attempt {count}/{max}...",
    "msg.reconnectFound": "[RECONNECT] Found previously authorized device, connecting...",
    "msg.reconnectSuccess": "[RECONNECT] Successfully reconnected!",
    "msg.reconnectNotFound": "[RECONNECT] Device not found, retrying in {ms}ms...",
    "msg.reconnectFailed":
      "\n[RECONNECT] Failed to reconnect after {max} attempts. Please manually reconnect.",
    "msg.consoleError": "\n[CONSOLE ERROR] {error}",
    "msg.consoleLost": "\n[CONSOLE] Connection lost, waiting for reconnection...",

    // Validation
    "validate.offsetInvalid": "Offset field in row {row} is not a valid address!",
    "validate.offsetDuplicate": "Offset field in row {row} is already in use!",
    "validate.noFile": "No file selected for row {row}!",

    // Language switcher
    "lang.switch": "中文",
  },
  zh: {
    // Page
    "page.title": "固件串口烧录工具",
    "page.safariErr": "此工具不支持 Safari 浏览器！",
    "page.debugLog": "显示调试日志",

    // Terminal
    "terminal.title": "设备输出控制台",

    // Badge
    "badge.html": `源自 <a href="https://github.com/espressif/esptool-js" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">esptool-js</a>`,

    // Footer
    "footer.copyright": "\u00A9 2026 诚诺通科技 版权所有",

    // Program section
    "program.title": "烧录",
    "program.baudrate": "波特率：",
    "program.connected": "已连接设备：",
    "program.connect": "连接",
    "program.copyTrace": "复制日志",
    "program.disconnect": "断开连接",
    "program.eraseFlash": "擦除 Flash",

    // File table
    "table.flashAddr": "地址",
    "table.file": "文件",
    "table.action": "操作",
    "table.progress": "进度",
    "table.addFile": "添加文件",
    "table.remove": "移除",

    // Flash options
    "flash.mode": "Flash 模式：",
    "flash.freq": "Flash 频率：",
    "flash.size": "Flash 大小：",
    "flash.program": "烧录",
    "flash.keep": "保持不变",
    "flash.detect": "自动检测",

    // Console section
    "console.title": "控制台",
    "console.connected": "已连接设备：",
    "console.baudrate": "波特率：",
    "console.reconnectDelay": "重连延迟（毫秒）：",
    "console.maxRetries": "最大重试次数：",
    "console.start": "开始",
    "console.stop": "停止",
    "console.reset": "重置",

    // Dynamic messages
    "msg.deviceLost": "\n[设备断开] 设备已断开连接，正在尝试重连...",
    "msg.reconnectAttempt": "\n[重连] 第 {count}/{max} 次尝试...",
    "msg.reconnectFound": "[重连] 找到已授权设备，正在连接...",
    "msg.reconnectSuccess": "[重连] 重连成功！",
    "msg.reconnectNotFound": "[重连] 未找到设备，{ms} 毫秒后重试...",
    "msg.reconnectFailed": "\n[重连] 重试 {max} 次后仍无法连接，请手动重新连接。",
    "msg.consoleError": "\n[控制台错误] {error}",
    "msg.consoleLost": "\n[控制台] 连接断开，等待重连...",

    // Validation
    "validate.offsetInvalid": "第 {row} 行的地址字段不是有效地址！",
    "validate.offsetDuplicate": "第 {row} 行的地址已被使用！",
    "validate.noFile": "第 {row} 行未选择文件！",

    // Language switcher
    "lang.switch": "EN",
  },
};

let currentLang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang) || "zh";
let onLangChange: (() => void) | null = null;

/**
 * Get current language.
 */
export function getLang(): Lang {
  return currentLang;
}

/**
 * Translate a key with optional interpolation.
 * Placeholders use {name} syntax, replaced by `params[name]`.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = translations[currentLang][key] ?? translations["en"][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/**
 * Register a callback to run after language changes.
 */
export function onLanguageChange(cb: () => void): void {
  onLangChange = cb;
}

/**
 * Apply translations to all DOM elements with `data-i18n` attribute.
 * Also updates `data-i18n-placeholder` and `data-i18n-value` if present.
 */
export function applyI18n(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll<HTMLInputElement>("[data-i18n-value]").forEach((el) => {
    const key = el.getAttribute("data-i18n-value");
    if (key) {
      if (el instanceof HTMLButtonElement) {
        if (el.querySelector("svg")) {
          el.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              node.textContent = t(key);
            }
          });
        } else {
          el.textContent = t(key);
        }
      } else {
        el.value = t(key);
      }
    }
  });
  // Update <option> elements that use data-i18n
  document.querySelectorAll<HTMLOptionElement>("option[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
  // Update the lang switch button text
  const btn = document.getElementById("langSwitch");
  if (btn) {
    btn.title = t("lang.switch");
  }
  // Update page title
  document.title = t("page.title");
  // Update badge (contains HTML link)
  const badge = document.getElementById("badge");
  if (badge) {
    badge.innerHTML = t("badge.html");
  }
  // Fire language change callback
  if (onLangChange) {
    onLangChange();
  }
}

/**
 * Toggle between zh and en, persist, and re-apply.
 */
export function toggleLang(): void {
  currentLang = currentLang === "en" ? "zh" : "en";
  localStorage.setItem(STORAGE_KEY, currentLang);
  applyI18n();
}

/**
 * Highlight the active language option in the dropdown.
 */
function updateActiveOption(): void {
  const menu = document.getElementById("langMenu");
  if (!menu) return;
  menu.querySelectorAll<HTMLElement>(".lang-option").forEach((opt) => {
    opt.classList.toggle("active", opt.getAttribute("data-lang") === currentLang);
  });
}

/**
 * Initialize i18n: apply current language and wire up the dropdown.
 */
export function initI18n(): void {
  applyI18n();

  const btn = document.getElementById("langSwitch");
  const menu = document.getElementById("langMenu");
  const dropdown = document.getElementById("langDropdown");

  if (btn && menu && dropdown) {
    // Toggle dropdown on button click
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
      updateActiveOption();
    });

    // Switch language on option click
    menu.querySelectorAll<HTMLElement>(".lang-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        const lang = opt.getAttribute("data-lang") as Lang;
        if (lang && lang !== currentLang) {
          currentLang = lang;
          localStorage.setItem(STORAGE_KEY, currentLang);
          applyI18n();
        }
        menu.classList.remove("open");
      });
    });

    // Close dropdown on outside click
    document.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  }
}
