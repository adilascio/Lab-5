// Sends SQL to server2 following API_CONTRACT.md:
//   GET  {base}/{encodeURIComponent(sql)}   for reads
//   POST {base}  body {"query": sql}         for inserts

class ApiClient {
    static METHOD_GET = "GET";
    static METHOD_POST = "POST";

    constructor(baseUrl, timeoutMs) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.timeoutMs = timeoutMs;
    }

    async sendGet(sql) {
        const url = `${this.baseUrl}/${encodeURIComponent(sql)}`;
        return this.send(url, { method: ApiClient.METHOD_GET });
    }

    async sendPost(sql) {
        return this.send(this.baseUrl, {
            method: ApiClient.METHOD_POST,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: sql })
        });
    }

    async send(url, options) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            const data = await this.readJson(response);

            if (data === null) {
                return ApiResult.fromFailure(ApiResult.ERROR_INVALID_RESPONSE);
            }
            return ApiResult.fromResponse(response.status, data);
        } catch (error) {
            const code = error.name === "AbortError" ? ApiResult.ERROR_TIMEOUT : ApiResult.ERROR_NETWORK;
            return ApiResult.fromFailure(code);
        } finally {
            clearTimeout(timer);
        }
    }

    async readJson(response) {
        try {
            return await response.json();
        } catch (error) {
            return null;
        }
    }
}
