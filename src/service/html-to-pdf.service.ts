import { Request, Response, NextFunction } from "express";
import puppeteer, { Page, PaperFormat } from "puppeteer";

const { ACCESS_KEY } = process.env;

export const htmlToPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const {
        url,
        format = "A4",
        landscape = false,
        background = false,
        scale = 1,
        event = null,
        margin = 0,
        access_key = null,
    } = req.query as unknown as {
        url?: string;
        format: PaperFormat;
        landscape: string;
        background: string;
        scale: number;
        event: string | null;
        margin: number;
        access_key: string | null;
    };

    // Validate access key
    console.log("ACCESS KEY", ACCESS_KEY);
    if (ACCESS_KEY && ACCESS_KEY !== access_key) {
        return next(new Error("Invalid access key."));
    }

    // Check URL
    if (!url) {
        return next(new Error("Missing parameter: url"));
    } else {
        console.log("Converting URL to PDF: " + url);
    }

    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    event &&
        (await waitForEvent(page, event, 10000).then((result) => {
            if (result) {
                console.log("- Received ready event.");
            }
        }));

    const response = await page.pdf({
        format,
        landscape: landscape === "true",
        printBackground: background === "true",
        scale,
        margin: {
            top: margin,
            left: margin,
            bottom: margin,
            right: margin,
        },
    });

    console.log(`- Done. ${Math.ceil(response?.length / 1024)} Kb`);

    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.send(response);
};

async function waitForEvent(page: Page, eventName: string, timeout = 5000) {
    return Promise.race([
        page.evaluate(
            (eventName) =>
                new Promise((resolve) =>
                    document.addEventListener(eventName, () => {
                        resolve(true);
                    })
                ),
            eventName
        ),
        new Promise((r) => setTimeout(r, timeout)),
    ]);
}
