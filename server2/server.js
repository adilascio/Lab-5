/**
 * ChatGPT (https://chat.openai.com/) was used to help develop this assignment.
 * Native Node.js HTTP server and route dispatcher for Server 2.
 */
const http = require("http");
const SqlController = require("./controller");
const Config = require("./config");
const Messages = require("./lang/en");

class HttpServer {
    constructor(controller = new SqlController()) {
        this.controller = controller;
        this.basePath = Config.BASE_PATH.replace(/\/$/, "");
        this.server = http.createServer((req, res) => this.routeRequest(req, res));
    }

    async routeRequest(req, res) {
        let pathname;
        try {
            pathname = new URL(req.url, "http://localhost").pathname;
        } catch (error) {
            return this.controller.sendError(res, 400, "BAD_REQUEST", Messages.ERR_BAD_REQUEST);
        }

        const isBase = pathname === this.basePath;
        const isSqlPath = pathname.startsWith(`${this.basePath}/`);
        if (!isBase && !isSqlPath) {
            return this.controller.sendError(res, 404, "NOT_FOUND", Messages.ERR_NOT_FOUND);
        }
        if (req.method === "OPTIONS") {
            return this.controller.handleOptions(res);
        }
        if (req.method === "POST") {
            if (!isBase) {
                return this.controller.sendError(res, 405, "METHOD_NOT_ALLOWED", Messages.ERR_METHOD_NOT_ALLOWED);
            }
            return this.controller.handlePost(req, res);
        }
        if (req.method === "GET") {
            if (isBase) {
                return this.controller.sendError(res, 400, "BAD_REQUEST", Messages.ERR_BAD_REQUEST);
            }
            return this.controller.handleGet(res, pathname.slice(this.basePath.length + 1));
        }
        return this.controller.sendError(res, 405, "METHOD_NOT_ALLOWED", Messages.ERR_METHOD_NOT_ALLOWED);
    }

    start() {
        this.server.listen(Config.PORT, () => {
            console.log(`Server 2 listening on port ${Config.PORT}`);
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.server.close((error) => error ? reject(error) : resolve());
        });
    }
}

if (require.main === module) {
    new HttpServer().start();
}

module.exports = HttpServer;
