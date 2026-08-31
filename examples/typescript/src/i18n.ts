export type Lang = "en" | "zh";

const STORAGE_KEY = "esptool-lang";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Page
    "page.title": "ESP Tool",
    "page.subtitle": "A Serial Flasher utility for Espressif chips",
    "page.safariErr": "This tool is not supported on Safari browser!",
    "page.apiDocs": "View the API Documentation",
    "page.debugLog": "Show Debug log",

    // Program section
    "program.title": "Program",
    "program.baudrate": "Baudrate:",
    "program.connected": "Connected to device: ",
    "program.connect": "Connect",
    "program.copyTrace": "Copy Trace",
    "program.disconnect": "Disconnect",
    "program.eraseFlash": "Erase Flash",

    // File table
    "table.flashAddr": "Flash Address",
    "table.file": "File",
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
    "page.title": "ESP 烧录工具",
    "page.subtitle": "乐鑫芯片串口烧录工具",
    "page.safariErr": "此工具不支持 Safari 浏览器！",
    "page.apiDocs": "查看 API 文档",
    "page.debugLog": "显示调试日志",

    // Program section
    "program.title": "烧录",
    "program.baudrate": "波特率：",
    "program.connected": "已连接设备：",
    "program.connect": "连接",
    "program.copyTrace": "复制跟踪",
    "program.disconnect": "断开连接",
    "program.eraseFlash": "擦除 Flash",

    // File table
    "table.flashAddr": "Flash 地址",
    "table.file": "文件",
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
      el.value = t(key);
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
    btn.textContent = t("lang.switch");
  }
  // Update page title
  document.title = t("page.title");
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
 * Initialize i18n: apply current language and wire up the switch button.
 */
export function initI18n(): void {
  applyI18n();
  const btn = document.getElementById("langSwitch");
  if (btn) {
    btn.addEventListener("click", toggleLang);
  }
}
