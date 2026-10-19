/**
 * ChatGPT (https://chat.openai.com/) was used to help develop this assignment.
 * Separate least-privilege pools for inserts/table creation and reads.
 */
const mysql = require("mysql2/promise");
const Config = require("./config");

class Database {
    constructor() {
        const sharedOptions = {
            host: Config.DB_HOST,
            port: Config.DB_PORT,
            database: Config.DB_NAME,
            dateStrings: true,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            multipleStatements: false
        };

        if (Config.DB_SSL) {
            // Verify the server with the provider's CA when given; otherwise still encrypt the connection
            sharedOptions.ssl = Config.DB_CA
                ? { ca: Config.DB_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true }
                : { rejectUnauthorized: false };
        }

        this.writerPool = mysql.createPool({
            ...sharedOptions,
            user: Config.WRITER_USER,
            password: Config.WRITER_PASS
        });
        this.readerPool = mysql.createPool({
            ...sharedOptions,
            user: Config.READER_USER,
            password: Config.READER_PASS
        });
    }

    async ensurePatientTable() {
        const sql = `CREATE TABLE IF NOT EXISTS patient (
            patientid INT(11) NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            dateOfBirth DATETIME NOT NULL,
            PRIMARY KEY (patientid)
        ) ENGINE=InnoDB`;
        await this.writerPool.query(sql);
    }

    async insert(sql) {
        await this.ensurePatientTable();
        const [result] = await this.writerPool.query(sql);
        return { affectedRows: result.affectedRows, insertId: result.insertId };
    }

    async select(sql) {
        const [rows] = await this.readerPool.query(sql);
        return rows;
    }

    async close() {
        await Promise.all([this.writerPool.end(), this.readerPool.end()]);
    }
}

module.exports = Database;
