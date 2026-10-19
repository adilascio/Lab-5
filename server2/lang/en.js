/**
 * ChatGPT (https://chat.openai.com/) was used to help develop this assignment.
 * User-facing messages for Server 2.
 */
const Messages = Object.freeze({
    SUCCESS_INSERT: (count) => `${count} row(s) inserted.`,
    ERR_BAD_REQUEST: "No query provided.",
    ERR_INVALID_JSON: "Invalid JSON body.",
    ERR_INSERT_ONLY: "Only INSERT statements are accepted via POST.",
    ERR_BODY_TOO_LARGE: "Request body is too large.",
    ERR_NOT_FOUND: "Unknown path.",
    ERR_METHOD_NOT_ALLOWED: "Method not allowed.",
    ERR_SERVER: "An internal server error occurred."
});

module.exports = Messages;
