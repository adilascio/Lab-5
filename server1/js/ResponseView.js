/**
 * Author: Andre Di Lascio
 * Renders server responses as messages or a results table.
 * Written with help of Claude.
 */

// Uses textContent only (never innerHTML) so data stored in the table can't inject HTML.
class ResponseView {
    static CLASS_MESSAGE = "message";
    static CLASS_ERROR = "message error";
    static CLASS_SUCCESS = "message success";
    static CLASS_TABLE_WRAPPER = "table-wrapper";

    constructor(outputElement) {
        this.output = outputElement;
    }

    clear() {
        this.output.replaceChildren();
    }

    showLoading() {
        this.showMessage(UserStrings.LOADING, ResponseView.CLASS_MESSAGE);
    }

    showMessage(text, className) {
        const paragraph = document.createElement("p");
        paragraph.className = className;
        paragraph.textContent = text;
        this.output.replaceChildren(paragraph);
    }

    showError(text) {
        this.showMessage(text, ResponseView.CLASS_ERROR);
    }

    showSuccess(text) {
        this.showMessage(text, ResponseView.CLASS_SUCCESS);
    }

    // Shows any ApiResult: a table for SELECT results, a message otherwise
    showResult(result) {
        if (!result.success) {
            this.showError(this.describeError(result));
        } else if (result.isSelect()) {
            this.showRows(result.data.rows);
        } else {
            const count = result.data.affectedRows ?? 0;
            this.showSuccess(UserStrings.format(UserStrings.INSERT_SUCCESS, { count }));
        }
    }

    showRows(rows) {
        if (rows.length === 0) {
            this.showMessage(UserStrings.NO_ROWS, ResponseView.CLASS_MESSAGE);
            return;
        }

        const summary = document.createElement("p");
        summary.className = ResponseView.CLASS_SUCCESS;
        summary.textContent = UserStrings.format(UserStrings.ROW_COUNT, { count: rows.length });

        const wrapper = document.createElement("div");
        wrapper.className = ResponseView.CLASS_TABLE_WRAPPER;
        wrapper.appendChild(this.buildTable(rows));

        this.output.replaceChildren(summary, wrapper);
    }

    buildTable(rows) {
        const columns = Object.keys(rows[0]);
        const table = document.createElement("table");

        const headerRow = table.createTHead().insertRow();
        for (const column of columns) {
            const th = document.createElement("th");
            th.textContent = column;
            headerRow.appendChild(th);
        }

        const body = table.createTBody();
        for (const row of rows) {
            const tableRow = body.insertRow();
            for (const column of columns) {
                tableRow.insertCell().textContent = row[column] ?? "";
            }
        }

        return table;
    }

    describeError(result) {
        switch (result.errorCode) {
            case ApiResult.ERROR_NETWORK:
                return UserStrings.NETWORK_ERROR;
            case ApiResult.ERROR_TIMEOUT:
                return UserStrings.TIMEOUT_ERROR;
            case ApiResult.ERROR_INVALID_RESPONSE:
                return UserStrings.INVALID_RESPONSE;
            default: {
                const prefix = UserStrings.format(UserStrings.SERVER_ERROR_PREFIX, { status: result.status });
                return prefix + (result.errorMessage || UserStrings.UNKNOWN_ERROR);
            }
        }
    }
}
