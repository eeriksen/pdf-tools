import express, { Application, Express, Request, Response } from "express";
import { htmlToPdf } from "./service/html-to-pdf.service";

const createServer = (): Application => {
    const app: Express = express();
    app.use(express.json());

    app.get("/html-to-pdf", htmlToPdf);
    app.get("/favicon.ico", (_, res: Response) => res.status(204).end());
    app.get("/ping", (_, res: Response) => res.send("pong"));

    // Error handler
    app.use((err: Error, req: Request, res: Response) => {
        console.error(err.stack);
        res.status(500).send(`Error: ${err.message}`);
    });

    return app;
};

export { createServer };
