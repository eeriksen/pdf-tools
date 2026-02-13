import puppeteer, { Page, PaperFormat } from "puppeteer";

const parseNumber = (value: string | null, fallback: number) => {
    if (value === null) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

const logRequest = (
    url: string,
    timings: {
        browserLaunch: number;
        pageLoad: number;
        eventWait?: number;
        pdfConversion: number;
        total: number;
    },
    resultSizeKb: number,
) => {
    const lines = [
        "┌─ HTML-to-PDF ─────────────────────────────────────────",
        `│ URL: ${url}`,
        `│ ├─ Browser launch:  ${formatDuration(timings.browserLaunch)}`,
        `│ ├─ Page load:       ${formatDuration(timings.pageLoad)}`,
        ...(timings.eventWait !== undefined
            ? [`│ ├─ Event wait:      ${formatDuration(timings.eventWait)}`]
            : []),
        `│ ├─ PDF conversion:  ${formatDuration(timings.pdfConversion)}`,
        `│ └─ Total:           ${formatDuration(timings.total)}  →  ${resultSizeKb} KB`,
        "└────────────────────────────────────────────────────────",
    ];
    console.log(lines.join("\n"));
};

export const htmlToPdf = async (req: Request): Promise<Response> => {
    const query = new URL(req.url).searchParams;
    const url = query.get("url") ?? undefined;
    const format = (query.get("format") ?? "A4") as PaperFormat;
    const landscape = query.get("landscape") === "true";
    const background = query.get("background") === "true";
    const scale = parseNumber(query.get("scale"), 1);
    const event = query.get("event");
    const margin = parseNumber(query.get("margin"), 0);
    const lang = query.get("lang") ?? "en";
    const tz = query.get("tz") ?? "Europe/Oslo";
    const startTotal = performance.now();

    try {
        if (!url) {
            return new Response("Missing parameter: url", { status: 400 });
        }

        // Browser launch
        const startBrowser = performance.now();
        const browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                `--lang=${lang}`,
            ],
            env: { LANG: lang, LANGUAGE: lang },
        });
        const browserLaunchMs = performance.now() - startBrowser;

        const page = await browser.newPage();
        await page.emulateTimezone(tz);
        await page.setExtraHTTPHeaders({
            "Accept-Language": lang,
        });

        // Page load / rendering
        const startPageLoad = performance.now();
        await page.goto(url, {
            waitUntil: "networkidle2",
        });
        const pageLoadMs = performance.now() - startPageLoad;

        // Optional event wait
        let eventWaitMs: number | undefined;
        if (event) {
            const startEvent = performance.now();
            await waitForEvent(page, event, 10000);
            eventWaitMs = performance.now() - startEvent;
        }

        // PDF conversion
        const startPdf = performance.now();
        const response = await page.pdf({
            format,
            landscape,
            printBackground: background,
            scale,
            margin: {
                top: margin,
                left: margin,
                bottom: margin,
                right: margin,
            },
        });
        const pdfConversionMs = performance.now() - startPdf;

        await browser.close();

        const totalMs = performance.now() - startTotal;
        const resultSizeKb = Math.ceil(response?.length / 1024);

        logRequest(
            url,
            {
                browserLaunch: browserLaunchMs,
                pageLoad: pageLoadMs,
                ...(eventWaitMs !== undefined && { eventWait: eventWaitMs }),
                pdfConversion: pdfConversionMs,
                total: totalMs,
            },
            resultSizeKb,
        );

        return new Response(new Uint8Array(response), {
            headers: {
                "Content-Type": "application/pdf",
            },
        });
    } catch (e: unknown) {
        const totalMs = performance.now() - startTotal;
        let message = "Unknown error. Check the logs.";
        if (typeof e === "string") {
            message = e;
        } else if (e instanceof Error) {
            message = e.message;
        }
        console.error(
            `[HTML-to-PDF] FAILED after ${formatDuration(totalMs)} | URL: ${url ?? "N/A"} | ${message}`,
        );
        return new Response(message, { status: 500 });
    }
};

async function waitForEvent(page: Page, eventName: string, timeout = 5000) {
    return Promise.race([
        page.evaluate(
            (eventName) =>
                new Promise((resolve) =>
                    document.addEventListener(eventName, () => {
                        resolve(true);
                    }),
                ),
            eventName,
        ),
        new Promise((r) => setTimeout(r, timeout)),
    ]);
}
