# Server 2

Server 2 is the MySQL-backed API for the Server 1 client. It uses Node's native
`http` module and `mysql2`; it does not use Express or a routing framework.
The API contract is in `../API_CONTRACT.md`.

## Database setup

Create the database and two database accounts. Use strong passwords of your own
and configure the same values in the environment where Node runs.

```sql
CREATE DATABASE IF NOT EXISTS lab5_db;

CREATE USER IF NOT EXISTS 'lab5_writer'@'localhost' IDENTIFIED BY '<writer-password>';
GRANT CREATE, INSERT ON lab5_db.* TO 'lab5_writer'@'localhost';

CREATE USER IF NOT EXISTS 'lab5_reader'@'localhost' IDENTIFIED BY '<reader-password>';
GRANT SELECT ON lab5_db.* TO 'lab5_reader'@'localhost';

FLUSH PRIVILEGES;
```

The writer account is used only for table creation and inserts. The reader
account is used only for GET queries. Neither account should be granted DROP,
DELETE, UPDATE, ALTER, or GRANT OPTION. If MySQL is hosted on another machine,
replace `localhost` with the host value required by that provider.

## Run locally

From this directory, install the dependency and set credentials in the shell:

```powershell
npm install
$env:WRITER_PASS = "<writer-password>"
$env:READER_PASS = "<reader-password>"
npm start
```

Optional settings are `PORT`, `BASE_PATH`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_SSL`, `DB_CA`,
`WRITER_USER`, `WRITER_PASS`, `READER_USER`, `READER_PASS`, and
`ALLOWED_ORIGIN`. The default API base is `http://localhost:8080/api/v1/sql`;
set `ALLOWED_ORIGIN` to the deployed Server 1 origin when hosting. The deployed
Server 2 base URL must use HTTPS and a different origin from Server 1.

The table `patient` is created before each INSERT request. GET requests run
through the SELECT-only connection, so database privileges—not SQL string
filters—block destructive statements.
