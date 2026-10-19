/**
 * Author: Andre Di Lascio
 * Decides whether a typed query is sent via POST (INSERT) or GET (everything else).
 * Written with help of Claude.
 */

class QueryClassifier {
    static INSERT_KEYWORD = "INSERT";

    isEmpty(sql) {
        return sql.trim().length === 0;
    }

    getFirstKeyword(sql) {
        const match = sql.trim().match(/^[A-Za-z]+/);
        return match ? match[0].toUpperCase() : "";
    }

    // Not a security check: DROP, DELETE, UPDATE etc. are still sent via GET so the
    // server's SELECT-only database user rejects them.
    getMethod(sql) {
        return this.getFirstKeyword(sql) === QueryClassifier.INSERT_KEYWORD
            ? ApiClient.METHOD_POST
            : ApiClient.METHOD_GET;
    }
}
