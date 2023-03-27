import express, {
    Application,
    Express,
    Request,
    Response,
    NextFunction,
} from "express";
import { htmlToPdf } from "./service/html-to-pdf.service";
import cluster from "cluster";

const createServer = (): Application => {
    const app: Express = express();
    app.use(express.json());

    app.get("/html-to-pdf", htmlToPdf);

    // Error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).send(`Error: ${err.message}`);
    });

    return app;
};

export { createServer };
