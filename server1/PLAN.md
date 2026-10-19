# Lab 5 — Frontend (server1) Plan

Scope: **server1 only** (static client, origin 1). The backend (server2, Node.js API + DB users) lives in `../server2` and is someone else's / a later task. This plan also defines the API contract the frontend expects, so both halves can be built in parallel.

---

## 1. Rules that affect the frontend

| Rule | What it means for server1 | Penalty if missed |
|---|---|---|
| Vanilla JS only | No jQuery, no frameworks, no npm packages in the client. Plain `fetch`, DOM APIs. | -4 |
| OOP (JS classes) | Every piece of logic lives in a class; `app.js` just instantiates them. | marked |
| No `var` | `const` / `let` only. | -2 |
| User strings stored separately | Every visible string (labels, buttons, messages, errors) goes in `lang/messages/en/user.js`. No string literals in HTML/JS that the user sees. | -2 |
| Different origin from server2 | Host server1 on a separate static HTTPS host (e.g. GitHub Pages / Netlify / Vercel static). | -4 |
| Working home page | At least the **Insert** button, the **textarea**, and the **Submit** button. | 2/10 |
| URLs posted correctly | https URL of index.html, hyperlinked in Learning Hub comment (press space after pasting). | -3 |

---

## 2. Folder structure

```
Lab5/
├── server1/                     ← frontend (this plan)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── lang/messages/en/
│   │   └── user.js              ← ALL user-facing strings
│   └── js/
│       ├── config.js            ← API base URL + endpoint paths (no strings shown to user)
│       ├── ApiClient.js         ← class ApiClient: sendGet(sql), sendPost(sql)
│       ├── PatientSeeder.js     ← class PatientSeeder: builds the fixed INSERT statement
│       ├── QueryClassifier.js   ← class QueryClassifier: SELECT → GET, INSERT → POST
│       ├── ResponseView.js      ← class ResponseView: renders messages / result table
│       └── App.js               ← class App: wires DOM events; instantiated on DOMContentLoaded
└── server2/                     ← backend (not in scope here)
```

Script load order in `index.html` (plain `<script>` tags, no modules needed — or `type="module"` if the host serves correct MIME types):
`user.js` → `config.js` → `ApiClient.js` → `PatientSeeder.js` → `QueryClassifier.js` → `ResponseView.js` → `App.js`

---

## 3. Page layout (index.html)

1. **Title + short description** (from `user.js`)
2. **Section A — Insert sample patients**
   - Button **"Insert sample patients"**
   - Every press sends one POST that inserts the fixed rows again (table grows each press — this is required).
   - Shows the server's response underneath (e.g. "4 rows inserted").
3. **Section B — Run a query**
   - `<textarea>` with placeholder `SELECT * FROM patient`
   - Button **"Submit"**
   - Shows the server's response: a table for SELECT results, or the error message (e.g. permission denied for DROP).
4. **Response area(s)** — use `textContent` / created `<td>` elements only, never `innerHTML` with server data (prevents XSS from data stored in the table).

---

## 4. Classes

### `ApiClient`
- `constructor(baseUrl)` — from `config.js`
- `async sendGet(sql)` → `GET {base}/api/v1/sql/{encodeURIComponent(sql)}`
- `async sendPost(sql)` → `POST {base}/api/v1/sql` with body `{ "query": sql }`
- Parses JSON; on network failure / non-JSON returns a normalized error object so the view always gets the same shape.

### `PatientSeeder`
- Holds the fixed sample rows (see §6) as data, not as a hard-coded SQL string.
- `buildInsertQuery()` → one multi-row `INSERT INTO patient (name, dateOfBirth) VALUES (...), (...);`

### `QueryClassifier`
- `getMethod(sql)` → `"GET"` if the statement starts with `SELECT`, `"POST"` if it starts with `INSERT`, otherwise `"GET"`.
  - Anything else (DROP, DELETE, UPDATE, CREATE…) is **still sent** via GET so the server's read-only DB user rejects it — this lets us demo least privilege during marking. The client is *not* the security layer.
- `isEmpty(sql)` → block empty submissions with a message from `user.js`.

### `ResponseView`
- `showLoading(target)`, `showMessage(target, text, isError)`
- `showRows(target, rows)` → builds an HTML table from the array of row objects (column headers from the first row's keys); "No rows" message when empty.

### `App`
- `constructor()` → creates the objects above, finds DOM elements, fills all labels/text from `user.js`, attaches listeners.
- `onInsertClick()` → `seeder.buildInsertQuery()` → `api.sendPost()` → view.
- `onSubmitClick()` → classify → `sendGet` / `sendPost` → view.
- Disable buttons while a request is in flight to avoid accidental double-sends (a real double-click should still insert twice — only block while waiting).

---

## 5. API contract

The full contract shared with the backend is in **`../API_CONTRACT.md`** — that file is the source of truth for endpoints, request/response JSON, status codes, CORS, the table schema and the DB users. The frontend must match it exactly:

- Insert: `POST BASE` with `{"query": "INSERT ..."}` → `{success, type:"insert", affectedRows, insertId, message}`
- Read: `GET BASE/<encodeURIComponent(sql)>` → `{success, type:"select", rowCount, rows:[...]}`
- Errors (any status): `{success:false, error, code}` → show `error` to the user

---

## 6. Data (confirmed)

- Table `patient`: `patientid INT(11) AUTO_INCREMENT PRIMARY KEY`, `name VARCHAR(100)`, `dateOfBirth DATETIME`
- Rows inserted on each press:
  - Sara Brown — 1901-01-01
  - John Smith — 1941-01-01
  - Jack Ma — 1961-01-30
  - Elon Musk — 1999-01-01

---

## 7. Build order

1. `user.js` + `config.js` (strings and API URL)
2. `index.html` + `style.css` (static page — earns the 2/10 "working home page" on its own)
3. `ApiClient`, `PatientSeeder`, `QueryClassifier`, `ResponseView`, `App`
4. Test locally against a mock: a tiny local server2 stub, or point `config.js` at the real server2 once it exists
5. Deploy to a static HTTPS host on a **different origin** from server2
6. Final checks: no `var`, no visible strings outside `user.js`, no libraries, buttons + textarea work, DROP/DELETE show the server's permission error

---

## 8. Hosting options for server1 (static, needs HTTPS)

- **GitHub Pages** — free, HTTPS, deploy from a repo folder. Simplest.
- **Netlify / Vercel** — drag-and-drop static deploy, free, HTTPS.

Server2 must be on a different host (e.g. a VPS / Render / Railway / school host with MySQL), so the origins differ automatically.

---

## 9. Submission checklist (frontend parts)

- [ ] `server1/` folder copied into `<Team#>Lab5/` alongside `server2/`, zipped as `<Team#>Lab5.zip`
- [ ] Learning Hub comment: https URL of server1 index.html (hyperlinked)
- [ ] Learning Hub comment: encoded sample GET, e.g. `https://<server2-domain>/.../api/v1/sql/select%20*%20from%20patient`
- [ ] Attribution comment in code (ChatGPT/Claude or other sources used)
- [ ] Both partners can explain every file (-2 per question you can't answer)
