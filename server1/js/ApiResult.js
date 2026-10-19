// A normalized result for every request, so the UI always handles the same shape
// whether the server succeeded, returned an error, or could not be reached.

class ApiResult {
    static ERROR_NETWORK = "NETWORK_ERROR";
    static ERROR_TIMEOUT = "TIMEOUT";
    static ERROR_INVALID_RESPONSE = "INVALID_RESPONSE";

    constructor(success, status, data, errorCode, errorMessage) {
        this.success = success;
        this.status = status;
        this.data = data;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }

    static fromResponse(status, data) {
        if (data !== null && data.success === true) {
            return new ApiResult(true, status, data, null, null);
        }

        const code = data !== null ? data.code : null;
        const message = data !== null ? data.error : null;
        return new ApiResult(false, status, data, code, message);
    }

    static fromFailure(errorCode) {
        return new ApiResult(false, 0, null, errorCode, null);
    }

    isSelect() {
        return this.success && Array.isArray(this.data.rows);
    }
}
