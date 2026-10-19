// Decides how a typed query is sent. INSERT goes via POST; everything else goes via GET.
// This is NOT a security check: harmful statements (DROP, DELETE, UPDATE...) are still sent
// via GET so the server's SELECT-only database user rejects them.

class QueryClassifier {
    static INSERT_KEYWORD = "INSERT";

    isEmpty(sql) {
        return sql.trim().length === 0;
    }

    getFirstKeyword(sql) {
        const match = sql.trim().match(/^[A-Za-z]+/);
        return match ? match[0].toUpperCase() : "";
    }

    getMethod(sql) {
        return this.getFirstKeyword(sql) === QueryClassifier.INSERT_KEYWORD
            ? ApiClient.METHOD_POST
            : ApiClient.METHOD_GET;
    }
}
