const baudrates = document.getElementById("baudrates") as HTMLSelectElement;
const consoleBaudrates = document.getElementById("consoleBaudrates") as HTMLSelectElement;
const reconnectDelay = document.getElementById("reconnectDelay") as HTMLInputElement;
const maxRetriesInput = document.getElementById("maxRetries") as HTMLInputElement;
const connectButton = document.getElementById("connectButton") as HTMLButtonElement;
const traceButton = document.getElementById("copyTraceButton") as HTMLButtonElement;
const disconnectButton = document.getElementById("disconnectButton") as HTMLButtonElement;
const resetButton = document.getElementById("resetButton") as HTMLButtonElement;
const consoleStartButton = document.getElementById("consoleStartButton") as HTMLButtonElement;
const consoleStopButton = document.getElementById("consoleStopButton") as HTMLButtonElement;
const eraseButton = document.getElementById("eraseButton") as HTMLButtonElement;
const disconnectGroup = document.getElementById("disconnectGroup");
const addFileButton = document.getElementById("addFile") as HTMLButtonElement;
const programButton = document.getElementById("programButton");
const filesDiv = document.getElementById("files");
const flashSettingsDiv = document.getElementById("flashSettings");
const programBtnWrap = document.getElementById("programBtnWrap");
const terminal = document.getElementById("terminal");
const programDiv = document.getElementById("program");
const consoleDiv = document.getElementById("console");
const lblBaudrate = document.getElementById("lblBaudrate");
const baudrateGroup = document.getElementById("baudrateGroup");
const consoleBaudGroup = document.getElementById("consoleBaudGroup");
const lblConsoleFor = document.getElementById("lblConsoleFor");
const lblConnTo = document.getElementById("lblConnTo");
const table = document.getElementById("fileTable") as HTMLTableElement;
const alertDiv = document.getElementById("alertDiv");
const flashMode = document.getElementById("flashMode") as HTMLSelectElement;
const flashFreq = document.getElementById("flashFreq") as HTMLSelectElement;
const flashSize = document.getElementById("flashSize") as HTMLSelectElement;

const debugLogging = document.getElementById("debugLogging") as HTMLInputElement;

// This is a frontend example of Esptool-JS using local bundle file
// To optimize use a CDN hosted version like
// https://unpkg.com/esptool-js@0.5.0/bundle.js
import {
  ESPLoader,
  FlashOptions,
  FlashModeValues,
  FlashFreqValues,
  FlashSizeValues,
  LoaderOptions,
  Transport,
  WebUSBSerialPort,
} from "../../../lib";
import { serial } from "web-serial-polyfill";
import { t, initI18n, onLanguageChange } from "./i18n";

const serialLib = !navigator.serial && navigator.usb ? serial : navigator.serial;
const useWebUsb = document.getElementById("useWebUsb") as HTMLInputElement;

declare let Terminal; // Terminal is imported in HTML script
declare let CryptoJS; // CryptoJS is imported in HTML script

const term = new Terminal({ cols: 120, rows: 40 });
term.open(terminal);

let device = null;
let deviceInfo = null;
let usingWebUsb = false;
let transport: Transport;
let chip: string = null;
let esploader: ESPLoader;

traceButton.classList.add("hidden");
consoleStopButton.classList.add("hidden");
resetButton.classList.add("hidden");
filesDiv.classList.add("hidden");
flashSettingsDiv.classList.add("hidden");
programBtnWrap.classList.add("hidden");

// Initialize i18n — must run after DOM elements are available
initI18n();
onLanguageChange(updateConnLabel);

// Update "Connected to device: <chip>" label with current language + chip name
function updateConnLabel() {
  if (chip) {
    lblConnTo.textContent = t("program.connected") + chip;
  }
}

/**
 * The built in Event object.
 * @external Event
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
 */

/**
 * File reader handler to read given local file.
 * @param {Event} evt File Select event
 */
function handleFileSelect(evt) {
  const file = evt.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (ev: ProgressEvent<FileReader>) => {
    if (ev.target.result instanceof ArrayBuffer) {
      evt.target.data = new Uint8Array(ev.target.result);
    } else {
      evt.target.data = ev.target.result;
    }
  };

  reader.readAsArrayBuffer(file);
}

const espLoaderTerminal = {
  clean() {
    term.clear();
  },
  writeLine(data) {
    term.writeln(data);
  },
  write(data) {
    term.write(data);
  },
};

/**
 * Populate flash size and frequency dropdowns based on chip's supported values
 */
function populateFlashDropdowns() {
  if (!esploader || !esploader.chip) {
    return;
  }

  // Populate Flash Frequency dropdown
  flashFreq.innerHTML = `<option value="keep" data-i18n="flash.keep">${t("flash.keep")}</option>`;
  const flashFreqKeys = Object.keys(esploader.chip.FLASH_FREQUENCY).sort((a, b) => {
    const freqOrder = ["80m", "60m", "48m", "40m", "30m", "26m", "24m", "20m", "16m", "15m", "12m"];
    const indexA = freqOrder.indexOf(a);
    const indexB = freqOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
  flashFreqKeys.forEach((freq) => {
    const option = document.createElement("option");
    option.value = freq;
    option.textContent = freq;
    flashFreq.appendChild(option);
  });
  flashFreq.options[0].selected = true;

  // Populate Flash Size dropdown
  flashSize.innerHTML = `<option value="detect" data-i18n="flash.detect">${t("flash.detect")}</option><option value="keep" data-i18n="flash.keep">${t("flash.keep")}</option>`;
  const flashSizeKeys = Object.keys(esploader.chip.FLASH_SIZES).sort((a, b) => {
    const sizeOrder = [
      "256KB",
      "512KB",
      "1MB",
      "2MB",
      "2MB-c1",
      "4MB",
      "4MB-c1",
      "8MB",
      "16MB",
      "32MB",
      "64MB",
      "128MB",
    ];
    const indexA = sizeOrder.indexOf(a);
    const indexB = sizeOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
  flashSizeKeys.forEach((size) => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    flashSize.appendChild(option);
  });
  flashSize.options[1].selected = true;
}

/**
 * Request a serial device via Web Serial or opt-in CH340 WebUSB.
 * @returns {Promise<object>} Selected port.
 */
async function requestDevice() {
  if (useWebUsb.checked) {
    usingWebUsb = true;
    const port = await WebUSBSerialPort.requestPort();
    return port.asSerialPort();
  }
  usingWebUsb = false;
  return serialLib.requestPort({});
}

connectButton.onclick = async () => {
  try {
    if (device === null) {
      device = await requestDevice();
      deviceInfo = device.getInfo();
      transport = new Transport(device, true);
    }
    const flashOptions = {
      transport,
      baudrate: parseInt(baudrates.value),
      terminal: espLoaderTerminal,
      debugLogging: debugLogging.checked,
    } as LoaderOptions;
    esploader = new ESPLoader(flashOptions);

    chip = await esploader.main();

    // Populate flash dropdowns based on chip's supported values
    populateFlashDropdowns();

    // Temporarily broken
    // await esploader.flashId();
    // eslint-disable-next-line no-console
    console.log("Settings done for :" + chip);
    lblBaudrate.classList.add("hidden");
    baudrateGroup.classList.add("hidden");
    updateConnLabel();
    lblConnTo.classList.remove("hidden");
    connectButton.classList.add("hidden");
    traceButton.classList.remove("hidden");
    disconnectGroup.classList.remove("hidden");
    filesDiv.classList.remove("hidden");
    flashSettingsDiv.classList.remove("hidden");
    programBtnWrap.classList.remove("hidden");
    consoleDiv.classList.add("hidden");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    term.writeln(`Error: ${e.message}`);
  }
};

traceButton.onclick = async () => {
  if (transport) {
    transport.returnTrace();
  }
};

resetButton.onclick = async () => {
  if (transport) {
    await transport.setDTR(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await transport.setDTR(true);
  }
};

eraseButton.onclick = async () => {
  eraseButton.disabled = true;
  try {
    await esploader.eraseFlash();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    term.writeln(`Error: ${e.message}`);
  } finally {
    eraseButton.disabled = false;
  }
};

addFileButton.onclick = () => {
  const rowCount = table.rows.length;
  const row = table.insertRow(rowCount);

  //Column 1 - Offset
  const cell1 = row.insertCell(0);
  const element1 = document.createElement("input");
  element1.type = "text";
  element1.id = "offset" + rowCount;
  element1.value = "0x1000";
  cell1.appendChild(element1);

  // Column 2 - File selector
  const cell2 = row.insertCell(1);
  const fileCell = document.createElement("div");
  fileCell.classList.add("file-cell");
  const element2 = document.createElement("input");
  element2.type = "file";
  element2.id = "selectFile" + rowCount;
  element2.name = "selected_File" + rowCount;
  element2.addEventListener("change", handleFileSelect, false);
  fileCell.appendChild(element2);
  cell2.appendChild(fileCell);

  // Column 3  - Remove File
  const cell3 = row.insertCell(2);
  cell3.classList.add("action-cell");
  if (rowCount > 1) {
    const element4 = document.createElement("input");
    element4.type = "button";
    const btnName = "button" + rowCount;
    element4.name = btnName;
    element4.setAttribute("class", "btn");
    element4.setAttribute("value", t("table.remove"));
    element4.onclick = function () {
      removeRow(row);
    };
    cell3.appendChild(element4);
  }

  // Column 4  - Progress
  const cell4 = row.insertCell(3);
  cell4.classList.add("progress-cell");
  cell4.style.visibility = "collapse";
  cell4.innerHTML = `<progress value="0" max="100"></progress>`;
};

/**
 * The built in HTMLTableRowElement object.
 * @external HTMLTableRowElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement}
 */

/**
 * Remove file row from HTML Table
 * @param {HTMLTableRowElement} row Table row element to remove
 */
function removeRow(row: HTMLTableRowElement) {
  const rowIndex = Array.from(table.rows).indexOf(row);
  table.deleteRow(rowIndex);
}

/**
 * Clean devices variables on chip disconnect. Remove stale references if any.
 */
function cleanUp() {
  device = null;
  deviceInfo = null;
  usingWebUsb = false;
  transport = null;
  // Preserve chip name so console mode can display it if already detected
}

disconnectButton.onclick = async () => {
  if (transport) await transport.disconnect();

  term.reset();
  lblBaudrate.classList.remove("hidden");
  baudrateGroup.classList.remove("hidden");
  consoleBaudGroup.classList.remove("hidden");
  connectButton.classList.remove("hidden");
  disconnectGroup.classList.add("hidden");
  traceButton.classList.add("hidden");
  lblConnTo.classList.add("hidden");
  filesDiv.classList.add("hidden");
  flashSettingsDiv.classList.add("hidden");
  programBtnWrap.classList.add("hidden");
  alertDiv.classList.add("hidden");
  consoleDiv.classList.remove("hidden");
  cleanUp();
};

let isConsoleClosed = false;
let isReconnecting = false;

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

consoleStartButton.onclick = async () => {
  if (device === null) {
    device = await requestDevice();
    transport = new Transport(device, true);
    deviceInfo = device.getInfo();

    // Set up device lost callback
    transport.setDeviceLostCallback(async () => {
      if (!isConsoleClosed && !isReconnecting) {
        term.writeln(t("msg.deviceLost"));
        await sleep(parseInt(reconnectDelay.value));
        isReconnecting = true;

        const maxRetries = parseInt(maxRetriesInput.value);
        let retryCount = 0;

        while (retryCount < maxRetries && !isConsoleClosed) {
          retryCount++;
          term.writeln(t("msg.reconnectAttempt", { count: retryCount, max: maxRetries }));

          let newDevice = null;
          if (usingWebUsb && navigator.usb) {
            const usbDevices = await navigator.usb.getDevices();
            const match = usbDevices.find(
              (usbDevice) =>
                usbDevice.vendorId === deviceInfo.usbVendorId && usbDevice.productId === deviceInfo.usbProductId,
            );
            if (match) {
              newDevice = new WebUSBSerialPort(match).asSerialPort();
            }
          } else if (serialLib && serialLib.getPorts) {
            const ports = await serialLib.getPorts();
            newDevice = (ports as SerialPort[]).find(
              (port) =>
                port.getInfo().usbVendorId === deviceInfo.usbVendorId &&
                port.getInfo().usbProductId === deviceInfo.usbProductId,
            );
          }

          if (newDevice) {
            device = newDevice;
            transport.updateDevice(device);
            term.writeln(t("msg.reconnectFound"));
            await transport.connect(parseInt(consoleBaudrates.value));
            term.writeln(t("msg.reconnectSuccess"));
            consoleStopButton.classList.remove("hidden");
            resetButton.classList.remove("hidden");
            isReconnecting = false;

            startConsoleReading();
            return;
          }

          if (retryCount < maxRetries) {
            term.writeln(t("msg.reconnectNotFound", { ms: parseInt(reconnectDelay.value) }));
            await sleep(parseInt(reconnectDelay.value));
          }
        }

        if (retryCount >= maxRetries) {
          term.writeln(t("msg.reconnectFailed", { max: maxRetries }));
          isReconnecting = false;
        }
      }
    });
  }

  // Detect chip name before starting console (briefly resets device)
  if (!chip) {
    try {
      const detectTransport = new Transport(device, true);
      const detectLoader = new ESPLoader({
        transport: detectTransport,
        baudrate: 115200,
        terminal: { clean() {}, writeLine() {}, write() {} },
      });
      chip = await detectLoader.main();
      await detectLoader.after("hard_reset");
      await detectTransport.disconnect();
    } catch (e) {
      // Detection failed (timeout, device not responding) — fall back to VID/PID
      console.log("Chip detection skipped:", e instanceof Error ? e.message : e);
    }
  }

  const deviceId = chip
    ? chip
    : `VID:0x${deviceInfo.usbVendorId.toString(16).toUpperCase()} PID:0x${deviceInfo.usbProductId.toString(16).toUpperCase()}`;
  lblConsoleFor.textContent = t("console.connected") + deviceId;
  lblConsoleFor.classList.remove("hidden");
  consoleBaudGroup.classList.add("hidden");
  consoleStartButton.classList.add("hidden");
  consoleStopButton.classList.remove("hidden");
  resetButton.classList.remove("hidden");
  programDiv.classList.add("hidden");

  await transport.connect(parseInt(consoleBaudrates.value));
  isConsoleClosed = false;
  isReconnecting = false;

  startConsoleReading();
};

/**
 * IDF Monitor–style auto-coloring: inject ANSI codes by log level (E/W/I) so colors
 * work without CONFIG_LOG_COLORS on the device. Same regex as esp-idf-monitor.
 */
const IDF_LOG_LEVEL_REGEX = /^(I|W|E) \([\d.: -]+\)/;
const ANSI = {
  RED: "\x1b[1;31m",
  GREEN: "\x1b[0;32m",
  YELLOW: "\x1b[0;33m",
  NORMAL: "\x1b[0m",
};

/**
 * Use IDF Monitor style log level prefixes to inject ANSI color codes for better readability. Lines that don't match the pattern are returned unmodified.
 * @param {string} line Console line to colorize
 * @returns {string} Colorized console line
 */
function colorizeIdfLine(line: string): string {
  const match = IDF_LOG_LEVEL_REGEX.exec(line);
  if (!match) return line;
  const color = match[1] === "E" ? ANSI.RED : match[1] === "W" ? ANSI.YELLOW : ANSI.GREEN;
  return color + line + ANSI.NORMAL;
}

/**
 * Continuously read from the console until it's closed, applying colorization to IDF log lines. If the connection is lost, it will wait for reconnection and resume reading. Errors are caught and displayed in the terminal without breaking the reading loop.
 */
async function startConsoleReading() {
  if (isConsoleClosed || !transport) return;

  const decoder = new TextDecoder("utf-8");
  let lineBuffer = "";
  try {
    await transport.rawRead(
      (value) => {
        lineBuffer += decoder.decode(value);
        let idx: number;
        while ((idx = lineBuffer.indexOf("\n")) !== -1) {
          const lineWithEol = lineBuffer.slice(0, idx + 1);
          lineBuffer = lineBuffer.slice(idx + 1);
          const lineStripped = lineWithEol.replace(/\r?\n$/, "");
          const eol = lineWithEol.slice(lineStripped.length);
          term.write(colorizeIdfLine(lineStripped) + eol);
        }
      },
      () => isConsoleClosed,
    );
    if (lineBuffer.length > 0) {
      term.write(colorizeIdfLine(lineBuffer));
    }
  } catch (error) {
    if (!isConsoleClosed) {
      term.writeln(t("msg.consoleError", { error: error instanceof Error ? error.message : String(error) }));
    }
  }

  if (!isConsoleClosed) {
    term.writeln(t("msg.consoleLost"));
  }
}

consoleStopButton.onclick = async () => {
  isConsoleClosed = true;
  isReconnecting = false;
  if (transport) {
    await transport.disconnect();
    await transport.waitForUnlock(1500);
  }
  term.reset();
  consoleBaudGroup.classList.remove("hidden");
  consoleStartButton.classList.remove("hidden");
  consoleStopButton.classList.add("hidden");
  resetButton.classList.add("hidden");
  lblConsoleFor.classList.add("hidden");
  programDiv.classList.remove("hidden");
  cleanUp();
};

/**
 * Validate the provided files images and offset to see if they're valid.
 * @returns {string} Program input validation result
 */
function validateProgramInputs() {
  const offsetArr = [];
  const rowCount = table.rows.length;
  let row;
  let offset = 0;
  let fileData = null;

  // check for mandatory fields
  for (let index = 1; index < rowCount; index++) {
    row = table.rows[index];

    //offset fields checks
    const offSetObj = row.cells[0].childNodes[0];
    offset = parseInt(offSetObj.value);

    // Non-numeric or blank offset
    if (Number.isNaN(offset)) return t("validate.offsetInvalid", { row: index });
    // Repeated offset used
    else if (offsetArr.includes(offset)) return t("validate.offsetDuplicate", { row: index });
    else offsetArr.push(offset);

    const fileObj = row.cells[1].childNodes[0];
    fileData = fileObj.data;
    if (fileData == null) return t("validate.noFile", { row: index });
  }
  return "success";
}

programButton.onclick = async () => {
  const alertMsg = document.getElementById("alertmsg");
  const err = validateProgramInputs();

  if (err != "success") {
    alertMsg.innerHTML = "<strong>" + err + "</strong>";
    alertDiv.classList.remove("hidden");
    return;
  }

  // Hide error message
  alertDiv.classList.add("hidden");

  const fileArray = [];
  const progressBars = [];

  for (let index = 1; index < table.rows.length; index++) {
    const row = table.rows[index];

    const offSetObj = row.cells[0].childNodes[0] as HTMLInputElement;
    const offset = parseInt(offSetObj.value);

    const fileObj = row.cells[1].childNodes[0] as ChildNode & { data: Uint8Array };
    const progressBar = row.cells[3].childNodes[0];

    progressBar.textContent = "0";
    progressBars.push(progressBar);

    row.cells[3].style.visibility = "visible";
    row.cells[2].style.display = "none";

    fileArray.push({ data: fileObj.data, address: offset });
  }

  try {
    const flashOptions: FlashOptions = {
      fileArray: fileArray,
      eraseAll: false,
      compress: true,
      flashMode: flashMode.value as FlashModeValues,
      flashFreq: flashFreq.value as FlashFreqValues,
      flashSize: flashSize.value as FlashSizeValues,
      reportProgress: (fileIndex, written, total) => {
        progressBars[fileIndex].value = (written / total) * 100;
      },
      calculateMD5Hash: (image: Uint8Array) => {
        const latin1String = Array.from(image, (byte) => String.fromCharCode(byte)).join("");
        return CryptoJS.MD5(CryptoJS.enc.Latin1.parse(latin1String)).toString();
      },
    };
    await esploader.writeFlash(flashOptions);
    await esploader.after();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    term.writeln(`Error: ${e.message}`);
  } finally {
    // Hide progress bars and show erase buttons
    for (let index = 1; index < table.rows.length; index++) {
      table.rows[index].cells[3].style.visibility = "collapse";
      table.rows[index].cells[2].style.display = "initial";
    }
  }
};

addFileButton.onclick(this);
