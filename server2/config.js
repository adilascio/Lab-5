/**
 * ChatGPT (https://chat.openai.com/) was used to help develop this assignment.
 * Server and database settings are read from environment variables.
 */
const Config = Object.freeze({
    PORT: Number(process.env.PORT) || 8080,
    BASE_PATH: process.env.BASE_PATH || "/api/v1/sql",
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_PORT: Number(process.env.DB_PORT) || 3306,
    DB_NAME: process.env.DB_NAME || "lab5_db",
    WRITER_USER: process.env.WRITER_USER || "lab5_writer",
    WRITER_PASS: process.env.WRITER_PASS || "",
    READER_USER: process.env.READER_USER || "lab5_reader",
    READER_PASS: process.env.READER_PASS || "",
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "*",
    MAX_BODY_BYTES: 1024 * 1024
});

module.exports = Config;
