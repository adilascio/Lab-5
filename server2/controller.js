/**
 * ChatGPT (https://chat.openai.com/) was used to help develop this assignment.
 * Parses API requests, delegates database work, and formats JSON responses.
 */
const Database = require("./database");
const Config = require("./config");
const Messages = require("./lang/en");

class SqlController {
    constructor(database = new Database()) {
        this.db = database;
    }

    sendJson(res, statusCode, data) {
        res.writeHead(statusCode, {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": Config.ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end(JSON.stringify(data));
    }

    sendError(res, statusCode, code, message) {
        this.sendJson(res, statusCode, { success: false, error: message, code });
    }

    handleOptions(res) {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": Config.ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
    }

    async handleGet(res, encodedSql) {
        let sql;
        try {
            sql = decodeURIComponent(encodedSql).trim();
        } catch (error) {
            return this.sendError(res, 400, "BAD_REQUEST", Messages.ERR_BAD_REQUEST);
        }
        if (sql.startsWith("\"") && sql.endsWith("\"") && sql.length >= 2) {
            sql = sql.slice(1, -1).trim();
        }
        if (!sql) {
            return this.sendError(res, 400, "BAD_REQUEST", Messages.ERR_BAD_REQUEST);
        }

        try {
            const rows = await this.db.select(sql);
            this.sendJson(res, 200, { success: true, type: "select", rowCount: rows.length, rows });
        } catch (error) {
            this.sendDatabaseError(res, error);
        }
    }

    async handlePost(req, res) {
        let body;
        try {
            body = await this.readBody(req);
        } catch (error) {
            const status = error.code === "BODY_TOO_LARGE" ? 413 : 400;
            return this.sendError(res, status, status === 413 ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
                status === 413 ? Messages.ERR_BODY_TOO_LARGE : Messages.ERR_INVALID_JSON);
        }

        let query;
        try {
            const parsed = JSON.parse(body);
            query = typeof parsed.query === "string" ? parsed.query.trim() : "";
        } catch (error) {
            return this.sendError(res, 400, "BAD_REQUEST", Messages.ERR_INVALID_JSON);
        }
        if (!query) {
            return this.sendError(res, 400, "BAD_REQUEST", Messages.ERR_BAD_REQUEST);
        }
        if (!/^INSERT\b/i.test(query)) {
            return this.sendError(res, 400, "BAD_REQUEST", Messages.ERR_INSERT_ONLY);
        }

        try {
            const result = await this.db.insert(query);
            this.sendJson(res, 200, {
                success: true,
                type: "insert",
                affectedRows: result.affectedRows,
                insertId: result.insertId,
                message: Messages.SUCCESS_INSERT(result.affectedRows)
            });
        } catch (error) {
            this.sendDatabaseError(res, error);
        }
    }

    async readBody(req) {
        let body = "";
        let size = 0;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > Config.MAX_BODY_BYTES) {
                const error = new Error(Messages.ERR_BODY_TOO_LARGE);
                error.code = "BODY_TOO_LARGE";
                throw error;
            }
            body += chunk.toString("utf8");
        }
        return body;
    }

    sendDatabaseError(res, error) {
        const privilegeErrors = [1044, 1142, 1143, 1227];
        const connectionErrors = [1045, 2002, 2003, 2005];
        if (connectionErrors.includes(error.errno) || String(error.code || "").startsWith("ECONN")) {
            return this.sendError(res, 500, "SERVER_ERROR", Messages.ERR_SERVER);
        }
        const status = privilegeErrors.includes(error.errno) ? 403 : 400;
        this.sendError(res, status, error.code || "DB_ERROR", error.sqlMessage || error.message || Messages.ERR_SERVER);
    }
}

module.exports = SqlController;
