import type { Browser } from 'puppeteer-core';

let browserInstance: Browser | null = null;
let puppeteer: typeof import('puppeteer-core') | null = null;

/**
 * Lazily load puppeteer-core. Unlike the full `puppeteer` package it does not
 * bundle Chromium — instead it expects an executable path supplied via the
 * PUPPETEER_EXECUTABLE_PATH environment variable (set to the system Chromium
 * installed by nixpacks on Railway).
 */
async function getPuppeteer(): Promise<typeof import('puppeteer-core')> {
  if (!puppeteer) {
    try {
      puppeteer = await import('puppeteer-core');
    } catch {
      throw new Error(
        'puppeteer-core failed to load — ensure it is installed and ' +
        'PUPPETEER_EXECUTABLE_PATH points to a Chromium binary.'
      );
    }
  }
  return puppeteer;
}

/**
 * Returns (or creates) a shared browser instance.
 * Re-using avoids the overhead of spawning Chromium on every report.
 */
async function getBrowser(): Promise<Browser> {
  const pptr = await getPuppeteer();

  if (!browserInstance || !browserInstance.connected) {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
      throw new Error(
        'PUPPETEER_EXECUTABLE_PATH is not set. ' +
        'Set it to the path of the system Chromium binary (e.g. /run/current-system/sw/bin/chromium).'
      );
    }

    browserInstance = await pptr.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',                 // required in Docker/CI environments
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',      // prevents /dev/shm OOM in containers
        '--disable-gpu',
        '--disable-extensions',
      ],
    });
  }

  return browserInstance;
}

/**
 * Renders an HTML string to a PDF buffer via headless Chromium.
 *
 * @param html  Complete HTML document string
 * @returns     PDF as a Node Buffer
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page    = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format:           'Letter',
      printBackground:  true,
      margin: {
        top:    '0.5in',
        right:  '0.5in',
        bottom: '0.5in',
        left:   '0.5in',
      },
    });

    // Puppeteer returns Uint8Array in some versions — normalise to Buffer
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Cleanly close the shared browser. Call this on process shutdown.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance?.connected) {
    await browserInstance.close();
    browserInstance = null;
  }
}
