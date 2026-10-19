// DEVELOPMENT ONLY - not part of the submission.
// Fake server2 that follows ../API_CONTRACT.md with an in-memory "patient" table,
// so the frontend can be tested before the real backend exists.
// Run: node MockApiServer.js   (API on http://localhost:8080/api/v1/sql)

const http = require("http");

class MockPatientTable {
    constructor() {
        this.rows = [];
        this.nextId = 1;
    }

    insertFromSql(sql) {
        const tuples = [...sql.matchAll(/\(\s*'((?:[^']|'')*)'\s*,\s*'([^']*)'\s*\)/g)];
        for (const tuple of tuples) {
            this.rows.push({
                patientid: this.nextId++,
                name: tuple[1].replace(/''/g, "'"),
                dateOfBirth: `${tuple[2]} 00:00:00`
            });
        }
        return { affectedRows: tuples.length, insertId: this.nextId - tuples.length };
    }
}

class MockApiServer {
    static PORT = 8080;
    static BASE_PATH = "/api/v1/sql";

    constructor() {
        this.table = new MockPatientTable();
        this.server = http.createServer((req, res) => this.handle(req, res));
    }

    start() {
        this.server.listen(MockApiServer.PORT, () =>
            console.log(`Mock API on http://localhost:${MockApiServer.PORT}${MockApiServer.BASE_PATH}`));
    }

    send(res, status, body) {
        res.writeHead(status, {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end(body === null ? "" : JSON.stringify(body));
    }

    error(res, status, code, message) {
        this.send(res, status, { success: false, error: message, code });
    }

    handle(req, res) {
        const path = new URL(req.url, "http://localhost").pathname;

        if (!path.startsWith(MockApiServer.BASE_PATH)) {
            return this.error(res, 404, "NOT_FOUND", "Unknown path.");
        }
        if (req.method === "OPTIONS") {
            return this.send(res, 204, null);
        }
        if (req.method === "GET") {
            return this.handleGet(res, path.slice(MockApiServer.BASE_PATH.length + 1));
        }
        if (req.method === "POST") {
            return this.handlePost(req, res);
        }
        return this.error(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    }

    handleGet(res, encodedSql) {
        let sql = decodeURIComponent(encodedSql).trim().replace(/^"(.*)"$/s, "$1").trim();
        if (sql.length === 0) {
            return this.error(res, 400, "BAD_REQUEST", "No query provided.");
        }

        const keyword = sql.split(/\s+/)[0].toUpperCase();
        if (keyword !== "SELECT") {
            // Simulates the SELECT-only DB user rejecting the statement
            return this.error(res, 403, "ER_TABLEACCESS_DENIED_ERROR",
                `${keyword} command denied to user 'lab5_reader'@'localhost' for table 'patient'`);
        }
        if (!/^select\s+\*\s+from\s+patient\s*;?$/i.test(sql)) {
            return this.error(res, 400, "ER_PARSE_ERROR", "Mock server only supports SELECT * FROM patient.");
        }

        this.send(res, 200, { success: true, type: "select", rowCount: this.table.rows.length, rows: this.table.rows });
    }

    handlePost(req, res) {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
            let query;
            try {
                query = String(JSON.parse(body).query || "").trim();
            } catch (e) {
                return this.error(res, 400, "BAD_REQUEST", "Invalid JSON body.");
            }
            if (!/^insert\s/i.test(query)) {
                return this.error(res, 400, "BAD_REQUEST", "Only INSERT statements are accepted via POST.");
            }

            const result = this.table.insertFromSql(query);
            this.send(res, 200, {
                success: true,
                type: "insert",
                affectedRows: result.affectedRows,
                insertId: result.insertId,
                message: `${result.affectedRows} row(s) inserted.`
            });
        });
    }
}

new MockApiServer().start();
