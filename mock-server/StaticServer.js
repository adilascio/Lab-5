/**
 * Author: Andre Di Lascio
 * Development-only static file server for the client on localhost:5500.
 * Written with help of Claude.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

class StaticServer {
    static PORT = 5500;
    static ROOT = path.join(__dirname, "..", "server1");
    static TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

    start() {
        http.createServer((req, res) => this.handle(req, res))
            .listen(StaticServer.PORT, () => console.log(`Client on http://localhost:${StaticServer.PORT}`));
    }

    handle(req, res) {
        const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
        const filePath = path.join(StaticServer.ROOT, urlPath === "/" ? "index.html" : urlPath);

        if (!filePath.startsWith(StaticServer.ROOT)) {
            res.writeHead(403);
            return res.end();
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                return res.end("Not found");
            }
            res.writeHead(200, { "Content-Type": StaticServer.TYPES[path.extname(filePath)] || "text/plain" });
            res.end(data);
        });
    }
}

new StaticServer().start();
