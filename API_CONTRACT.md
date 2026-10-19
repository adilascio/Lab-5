# Lab 5 — API Contract (server1 ⇄ server2)

**For the backend (server2) developer.** The frontend (server1) is being built first, against this contract. If server2 follows it exactly, the two will work together with no changes. If anything here needs to change, update this file and tell the frontend side **before** changing code.

Rules from the lab that apply to server2 too: Node.js `http` module only (**no Express or any routing module**; a DB driver like `mysql2` is allowed), JS classes / OOP, no `var`, user-facing strings stored separately (e.g. `lang/en.js`), hosted on a **different origin** from server1, HTTPS.

---

## 0. Read this first — the 3 things most likely to cost marks

1. **Two DB users with limited privileges (§6.2).** A SELECT-only user for GET and an INSERT/CREATE-only user for POST. Blocking DROP/DELETE with a string check in code does **not** count — the DB user itself must lack the permission. Missing this = **-3**.
2. **CORS + OPTIONS preflight (§5).** The frontend is on a different origin and sends JSON, so the browser sends an `OPTIONS` request before every POST. If server2 doesn't answer it with the CORS headers, the Insert button fails in the browser **even though it works in Postman/curl**.
3. **Send back the final https BASE URL (§9).** The frontend has one config line waiting for it. Any path prefix is fine (e.g. `/lab5/api/v1/sql`).

### Frontend status (so you know what you're integrating with)

- server1 is **built and tested** against a mock server that follows this contract exactly: Insert (×2 → 8 rows), SELECT table display, DROP/DELETE showing the 403 "command denied" message, empty-query check, typed INSERT with an apostrophe (`O''Brien`).
- It currently points at `http://localhost:8080/api/v1/sql` — so if you run server2 locally on port 8080 with that path, the frontend works against it with **no changes**.
- Request timeout on the frontend is 10 seconds.
- **Reference implementation:** `mock-server/MockApiServer.js` (ask for it) shows the exact URL parsing, JSON shapes and CORS headers using only Node's `http` module. It has **no real database** (in-memory array, fake privilege errors) — copy the request/response handling, not the data part.

---

## 1. Base URL and endpoints

```
BASE = https://<server2-domain>/<optional-prefix>/api/v1/sql
```

The frontend keeps `BASE` in one config value, so any prefix (e.g. `/comp4537/lab5`) is fine — just tell the frontend what it is.

| # | Method | Path | Purpose |
|---|---|---|---|
| 1 | `POST` | `BASE` | Run an **INSERT** (Insert button, or INSERT typed in the textarea) |
| 2 | `GET` | `BASE/<url-encoded SQL>` | Run a **SELECT** (or anything else typed in the textarea — must be rejected by DB privileges) |
| 3 | `OPTIONS` | `BASE` and `BASE/*` | CORS preflight — reply `204` with the CORS headers |

Anything else → `404` (unknown path) or `405` (known path, wrong method), JSON error body (§4).

---

## 2. Requests the frontend will send

### 2.1 POST (insert)

```
POST BASE
Content-Type: application/json

{"query": "INSERT INTO patient (name, dateOfBirth) VALUES ('Sara Brown', '1901-01-01'), ('John Smith', '1941-01-01'), ('Jack Ma', '1961-01-30'), ('Elon Musk', '1999-01-01');"}
```

- Body is always JSON with a single `query` string.
- The **Insert button sends exactly the statement above on every press** — the table must grow by 4 rows each time (duplicates are expected and correct).
- The user may also type their own INSERT in the textarea; it arrives the same way.
- `Content-Type: application/json` means the browser sends an **OPTIONS preflight first** — server2 must answer it (§5).

### 2.2 GET (select)

```
GET BASE/SELECT%20*%20FROM%20patient
```

- The whole SQL statement is the **last path segment**, encoded with JS `encodeURIComponent()`. Decode with `decodeURIComponent()`.
- **Strip one pair of surrounding double quotes if present** — the lab's sample URL format is `.../api/v1/sql/"select * from patient"`, which arrives as `%22select%20*%20from%20patient%22`.
- Trim whitespace. An optional trailing `;` should be allowed.

---

## 3. Success responses

Always `Content-Type: application/json; charset=utf-8`.

### 3.1 POST success — `200`

```json
{
  "success": true,
  "type": "insert",
  "affectedRows": 4,
  "insertId": 13,
  "message": "4 row(s) inserted."
}
```

### 3.2 GET success — `200`

```json
{
  "success": true,
  "type": "select",
  "rowCount": 4,
  "rows": [
    { "patientid": 1, "name": "Sara Brown", "dateOfBirth": "1901-01-01 00:00:00" },
    { "patientid": 2, "name": "John Smith", "dateOfBirth": "1941-01-01 00:00:00" }
  ]
}
```

- `rows` is an **array of plain objects**, keys = column names. The frontend builds the table headers from the keys of the first row, so any SELECT (e.g. `SELECT name FROM patient`) works.
- Empty result → `"rows": []`, `"rowCount": 0` (still `200`).
- **Dates:** create the DB connection with `dateStrings: true` (mysql2 option) so DATETIME comes back as `"1901-01-01 00:00:00"`. Without it, mysql2 returns JS `Date` objects that serialize as UTC ISO strings and can shift the day because of time zones.

---

## 4. Error responses

Same shape for **every** error, so the frontend can just show `error`:

```json
{
  "success": false,
  "error": "DROP command denied to user 'lab5_reader'@'localhost' for table 'patient'",
  "code": "ER_TABLEACCESS_DENIED_ERROR"
}
```

| Situation | Status | `code` |
|---|---|---|
| Missing / empty `query`, invalid JSON body, empty GET path | `400` | `BAD_REQUEST` |
| POST statement is not an INSERT (optional extra check — see §6) | `400` | `BAD_REQUEST` |
| DB refuses because of privileges (DROP, DELETE, UPDATE, CREATE… via GET) | `403` | the DB error code, e.g. `ER_TABLEACCESS_DENIED_ERROR`, `ER_DBACCESS_DENIED_ERROR` |
| SQL syntax error / unknown column / other DB error | `400` | the DB error code, e.g. `ER_PARSE_ERROR` |
| Unknown path | `404` | `NOT_FOUND` |
| Wrong method | `405` | `METHOD_NOT_ALLOWED` |
| Anything unexpected | `500` | `SERVER_ERROR` |

- Pass the **DB's error message through** in `error` for privilege errors — during marking we want the page to visibly show "DROP command denied…".
- Never send stack traces or DB passwords in responses.

---

## 5. CORS (required — server1 is a different origin)

On **every** response, including errors and the preflight:

```
Access-Control-Allow-Origin: https://<server1-domain>      (or * during development)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

`OPTIONS` request → `204 No Content` with those headers and no body. If this is missing, the Insert button fails in the browser with a CORS error even though the server works in Postman/curl.

---

## 6. Database

### 6.1 Table — create if it doesn't exist **before every INSERT**

```sql
CREATE TABLE IF NOT EXISTS patient (
    patientid   INT(11)      NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    dateOfBirth DATETIME     NOT NULL,
    PRIMARY KEY (patientid)
) ENGINE=InnoDB;
```

- Run this on every POST, before the INSERT (lab requirement: "every time the user presses the insert button… first check if the table exists, otherwise recreate it").
- Column names must match exactly (`patientid`, `name`, `dateOfBirth`) — the frontend's INSERT uses them. Table name is lowercase `patient` (case matters on Linux MySQL).

### 6.2 DB users — two, least privilege (this is the "how many DB users?" answer)

```sql
-- Used ONLY by the POST route
CREATE USER 'lab5_writer'@'localhost' IDENTIFIED BY '<strong password>';
GRANT CREATE, INSERT ON <db_name>.* TO 'lab5_writer'@'localhost';

-- Used ONLY by the GET route
CREATE USER 'lab5_reader'@'localhost' IDENTIFIED BY '<strong password>';
GRANT SELECT ON <db_name>.* TO 'lab5_reader'@'localhost';

FLUSH PRIVILEGES;
```

- Neither user gets `DROP`, `DELETE`, `UPDATE`, `ALTER` or `GRANT OPTION`. This is what protects against the -3 deduction — **the server must not rely on string checks to block DROP/DELETE**; the DB user simply lacks the permission.
- `lab5_writer` needs `CREATE` only so it can create the table when missing.
- Use `'%'` instead of `'localhost'` if the DB is on a different machine from the Node app (shared hosts often require this — use whatever host the provider shows).
- Keep `multipleStatements: false` (mysql2 default) on both connections.
- Store credentials in environment variables or a git-ignored config file, not in committed code.
- Optional extra (not a replacement for privileges): the POST route can reject statements that don't start with `INSERT` with a `400`.

---

## 7. Test cases the frontend will run — please make these pass

| # | Action | Expected |
|---|---|---|
| 1 | Press Insert on an empty DB (table doesn't exist) | `200`, table created, `affectedRows: 4` |
| 2 | Press Insert again | `200`, `affectedRows: 4`, table now has 8 rows |
| 3 | GET `SELECT * FROM patient` | `200`, all rows, dates as `YYYY-MM-DD HH:MM:SS` |
| 4 | GET `select name from patient where patientid = 1` | `200`, rows with only `name` |
| 5 | GET `DROP TABLE patient` | `403`, DB "command denied" message, table still exists |
| 6 | GET `DELETE FROM patient` | `403`, nothing deleted |
| 7 | GET `UPDATE patient SET name='x'` | `403`, nothing changed |
| 8 | GET `SELEC * FROM patient` (typo) | `400`, `ER_PARSE_ERROR` message |
| 9 | POST with empty `query` | `400`, `BAD_REQUEST` |
| 10 | Browser address bar: `BASE/%22select%20*%20from%20patient%22` | JSON with all rows (this is the URL posted on Learning Hub) |
| 11 | Insert button from the hosted server1 page | Works with no CORS error in the browser console |

---

## 8. Learning Hub sample URL (server2 part of the submission)

Fully encoded, with https, e.g.:

```
https://<server2-domain>/<prefix>/api/v1/sql/%22select%20*%20from%20patient%22
```

Paste it, then press space so Learning Hub turns it into a link (-3 if not hyperlinked).

---

## 9. What server2 needs to send back to the frontend side

- [ ] Final `BASE` URL (https), including any path prefix
- [ ] Confirmation of the response shapes above (or any changes — agree first)
- [ ] The allowed origin you configured for CORS (we'll send you the server1 https URL once it's deployed; `*` is fine until then)

---

## 10. Implementation tips (Node + mysql2, no Express)

**Routing with plain `http`:**

```js
const url = new URL(req.url, `http://${req.headers.host}`);
const path = url.pathname;               // e.g. /lab5/api/v1/sql/SELECT%20*%20FROM%20patient
// GET: everything after "<BASE_PATH>/" is the encoded SQL
const encodedSql = path.slice(BASE_PATH.length + 1);
let sql = decodeURIComponent(encodedSql).trim();
if (sql.startsWith('"') && sql.endsWith('"')) sql = sql.slice(1, -1).trim();
```

- Use `url.pathname`, not `req.url`, so a `?` in a query doesn't break things — but note `pathname` keeps the SQL **encoded**; decode it yourself as above.
- POST body arrives in chunks: collect with `req.on("data")` / `req.on("end")`, then `JSON.parse` inside `try/catch` → `400 BAD_REQUEST` if it fails.

**Two connection pools, one per DB user:**

```js
const readerPool = mysql.createPool({ host, user: READER_USER, password: READER_PASS, database, dateStrings: true });
const writerPool = mysql.createPool({ host, user: WRITER_USER, password: WRITER_PASS, database, dateStrings: true });
// GET  → readerPool.query(sql)
// POST → writerPool.query(CREATE_TABLE_SQL) then writerPool.query(sql)
```

- `dateStrings: true` → dates come back as `"1901-01-01 00:00:00"` (see §3.2).
- Leave `multipleStatements` off (default) so `SELECT 1; DROP TABLE patient` can't run as two statements.
- Use `mysql2/promise` for `async/await`.

**Mapping DB errors to HTTP status:**

```js
const PRIVILEGE_ERRORS = [1142, 1143, 1044, 1227];   // table/column/db access denied, missing privilege
const status = PRIVILEGE_ERRORS.includes(err.errno) ? 403 : 400;
send(res, status, { success: false, error: err.sqlMessage || err.message, code: err.code });
```

- `err.sqlMessage` is the text the marker wants to see ("DROP command denied to user…").
- Connection failures (wrong password, DB down: `ECONNREFUSED`, `ER_ACCESS_DENIED_ERROR` 1045) → `500 SERVER_ERROR` with a generic message; don't leak credentials.

**Response helper** — set CORS on every response, including errors:

```js
res.writeHead(status, {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
});
```

**OOP structure that fits the lab rules (suggestion):**

| Class | Job |
|---|---|
| `Database` | owns the two pools; `select(sql)`, `insert(sql)`, `ensurePatientTable()` |
| `SqlController` | handles GET/POST/OPTIONS, parses the URL/body, calls `Database`, builds JSON responses |
| `HttpServer` | creates the `http` server, matches the BASE path, routes to the controller, 404/405 |
| `lang/en.js` | all user-facing strings (error messages, success message) — **-2 if inline** |
| `config` / `.env` | DB host/name/users/passwords, port, base path, allowed origin — **don't commit passwords** |

---

## 11. Hosting checklist for server2

- [ ] Host supports **Node.js + MySQL/MariaDB** and lets you **create DB users and choose their privileges** (cPanel "MySQL Databases" → add user → tick only the privileges in §6.2; or SQL `GRANT` on a VPS).
- [ ] Served over **https**.
- [ ] Different domain/host from server1 (same host = **-4**).
- [ ] The Learning Hub sample URL (§8) opens in a browser and returns JSON rows.
- [ ] Re-run the §7 test cases against the **hosted** server, not just locally.

---

## 12. Submission reminders (both sides)

- Folder layout: `<Team#>Lab5/server1/` + `<Team#>Lab5/server2/` → zip as `<Team#>Lab5.zip`. Don't include `node_modules`, `.env`, or the mock server.
- Attribution comment for ChatGPT/Claude or any other source used.
- Both partners must be present for marking and be able to explain **both** halves (-2 per question you can't answer, -4 if a partner is absent).
