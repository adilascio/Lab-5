/**
 * Author: Andre Di Lascio
 * All user-facing strings for the client, kept separate from the code.
 * Written with help of Claude.
 */

class UserStrings {
    static PAGE_TITLE = "Lab 5 - Patient Database";
    static HEADING = "Patient Database";
    static INTRO = "Insert sample patients into the database, or run your own SQL query on the patient table.";

    static INSERT_HEADING = "Insert sample patients";
    static INSERT_DESCRIPTION = "Each press inserts the four sample patients again, so the table grows every time.";
    static INSERT_BUTTON = "Insert sample patients";

    static QUERY_HEADING = "Run a SQL query";
    static QUERY_DESCRIPTION = "Enter a SELECT statement to read from the patient table. INSERT statements are also accepted.";
    static QUERY_LABEL = "SQL query";
    static QUERY_PLACEHOLDER = "SELECT * FROM patient";
    static QUERY_BUTTON = "Submit";

    static LOADING = "Sending request...";
    static EMPTY_QUERY = "Please enter a SQL query before submitting.";
    static NO_ROWS = "The query ran successfully but returned no rows.";
    static ROW_COUNT = "{count} row(s) returned.";
    static INSERT_SUCCESS = "{count} row(s) inserted.";
    static SERVER_ERROR_PREFIX = "Server error ({status}): ";
    static NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";
    static TIMEOUT_ERROR = "The server took too long to respond. Please try again.";
    static INVALID_RESPONSE = "The server sent a response that could not be read.";
    static UNKNOWN_ERROR = "Something went wrong. Please try again.";

    // Replaces {placeholders} in a message with values, e.g. format(ROW_COUNT, { count: 4 })
    static format(message, values) {
        let result = message;
        for (const [key, value] of Object.entries(values)) {
            result = result.replace(`{${key}}`, String(value));
        }
        return result;
    }
}
