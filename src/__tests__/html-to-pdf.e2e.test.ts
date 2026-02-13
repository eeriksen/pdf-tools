import { describe, expect, it, beforeAll, afterAll } from "bun:test";

// E2E tests launch real browsers - allow 15s per test
const E2E_TIMEOUT = 15000;
import { createServer } from "../app";

let BASE_URL: string;

// Simple HTML page for basic PDF conversion
const SIMPLE_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><h1>Hello PDF</h1></body></html>`;

// HTML page that fires a custom event when loaded (for event-wait tests)
const EVENT_HTML = `<!DOCTYPE html>
<html><head><title>Event Test</title></head>
<body><h1>Event Test</h1>
<script>
  document.dispatchEvent(new Event('pdf-ready'));
</script>
</body></html>`;

// HTML page that never fires the event (for timeout tests)
const NO_EVENT_HTML = `<!DOCTYPE html>
<html><head><title>No Event</title></head>
<body><h1>No Event</h1></body></html>`;

function dataUrl(html: string): string {
    return `data:text/html;base64,${Buffer.from(html).toString("base64")}`;
}

describe("HTML-to-PDF E2E", () => {
    let server: ReturnType<typeof createServer>;

    beforeAll(() => {
        server = createServer(0); // 0 = random available port
        BASE_URL = `http://localhost:${server.port}`;
    });

    afterAll(() => {
        server?.stop();
    });

    it("returns 400 when url parameter is missing", async () => {
        const res = await fetch(`${BASE_URL}/html-to-pdf`);
        expect(res.status).toBe(400);
        expect(await res.text()).toContain("Missing parameter");
    });

    it(
        "converts HTML to PDF",
        async () => {
        const url = encodeURIComponent(dataUrl(SIMPLE_HTML));
        const res = await fetch(`${BASE_URL}/html-to-pdf?url=${url}`);

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe("application/pdf");

        const buffer = await res.arrayBuffer();
        expect(buffer.byteLength).toBeGreaterThan(100);

        // PDF magic bytes
        const bytes = new Uint8Array(buffer);
        expect(bytes[0]).toBe(0x25); // %
        expect(bytes[1]).toBe(0x50); // P
        expect(bytes[2]).toBe(0x44); // D
        expect(bytes[3]).toBe(0x46); // F
        },
        E2E_TIMEOUT,
    );

    it(
        "waits for custom event and receives it",
        async () => {
        const url = encodeURIComponent(dataUrl(EVENT_HTML));
        const res = await fetch(
            `${BASE_URL}/html-to-pdf?url=${url}&event=pdf-ready`,
        );

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe("application/pdf");

        const buffer = await res.arrayBuffer();
        expect(buffer.byteLength).toBeGreaterThan(100);
        },
        E2E_TIMEOUT,
    );

    it(
        "times out when event is never fired",
        async () => {
        const url = encodeURIComponent(dataUrl(NO_EVENT_HTML));
        const res = await fetch(
            `${BASE_URL}/html-to-pdf?url=${url}&event=pdf-ready&eventTimeout=1500`,
        );

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe("application/pdf");
        },
        E2E_TIMEOUT,
    );
});
