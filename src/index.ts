import * as dotenv from "dotenv";
import cluster from "cluster";
import { cpus } from "os";
import process from "process";
import { createServer } from "./app";
dotenv.config();

const { PORT, APP_WORKER_COUNTER } = process.env;

const startWorker = () => {
    const port = PORT ? Number(PORT) : 3000;
    const reusePort = numberOfWorkers > 1;
    const server = createServer(port, reusePort);
    console.log(`Listening to port ${port} (pid ${process.pid})`);

    const signalTraps: Array<string> = ["SIGTERM", "SIGINT", "SIGUSR2"];
    signalTraps.forEach((type) => {
        process.once(type, () => {
            server.stop();
            console.log("HTTP Server closed");
        });
    });
};

const numberOfWorkers = APP_WORKER_COUNTER
    ? Math.min(parseInt(APP_WORKER_COUNTER, 10), cpus().length)
    : 1;

if (cluster.isPrimary) {
    console.log(`CLUSTER: Primary ${process.pid} is running`);

    for (let i = 0; i < numberOfWorkers; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        console.log(`CLUSTER: Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    startWorker();
    console.log(`CLUSTER: Worker ${process.pid} started`);
}
