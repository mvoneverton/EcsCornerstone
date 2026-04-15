import type { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;
let puppeteer: typeof import('puppeteer') | null = null;

/**
 * Lazily load Puppeteer — it requires Node ≥ 16 and a bundled Chromium.
 * In a production Docker container (node:20-alpine) this works out of the box.
 * On Node 14 (local dev) the import will fail; an error is thrown so callers
 * know PDF generation is unavailable in that environment.
 */
async function getPuppeteer(): Promise<typeof import('puppeteer')> {
  if (!puppeteer) {
    try {
      puppeteer = await import('puppeteer');
    } catch {
      throw new Error(
        'Puppeteer failed to load — PDF generation requires Node ≥ 16. ' +
        'Run report generation inside the Docker container.'
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
    browserInstance = await pptr.launch({
      headless: true,
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
