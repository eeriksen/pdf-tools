import { serve } from "bun";
import { htmlToPdf } from "./service/html-to-pdf.service";

const createServer = (
    port: number,
    reusePort = false,
): ReturnType<typeof serve> => {
    const server = serve({
        port,
        reusePort,
        idleTimeout: 300, // Allow long-running PDF conversions (default: 10s)
        async fetch(req: Request): Promise<Response> {
            try {
                const url = new URL(req.url);
                if (url.pathname === "/html-to-pdf") {
                    return await htmlToPdf(req);
                }
                if (url.pathname === "/favicon.ico") {
                    return new Response(null, { status: 204 });
                }
                if (url.pathname === "/ping") {
                    return new Response("pong");
                }
                return new Response("Not found", { status: 404 });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Unknown error";
                console.error(error);
                return new Response(`Error: ${message}`, { status: 500 });
            }
        },
    });

    return server;
};

export { createServer };
