// Wires the page together: fills in text from UserStrings and handles button clicks.

class App {
    constructor() {
        this.api = new ApiClient(AppConfig.API_BASE_URL, AppConfig.REQUEST_TIMEOUT_MS);
        this.seeder = new PatientSeeder();
        this.classifier = new QueryClassifier();

        this.insertButton = document.getElementById("insertButton");
        this.queryInput = document.getElementById("queryInput");
        this.queryButton = document.getElementById("queryButton");
        this.insertView = new ResponseView(document.getElementById("insertOutput"));
        this.queryView = new ResponseView(document.getElementById("queryOutput"));
    }

    start() {
        this.renderText();
        this.insertButton.addEventListener("click", () => this.onInsertClick());
        this.queryButton.addEventListener("click", () => this.onQueryClick());
    }

    renderText() {
        document.title = UserStrings.PAGE_TITLE;
        const textById = {
            heading: UserStrings.HEADING,
            intro: UserStrings.INTRO,
            insertHeading: UserStrings.INSERT_HEADING,
            insertDescription: UserStrings.INSERT_DESCRIPTION,
            insertButton: UserStrings.INSERT_BUTTON,
            queryHeading: UserStrings.QUERY_HEADING,
            queryDescription: UserStrings.QUERY_DESCRIPTION,
            queryLabel: UserStrings.QUERY_LABEL,
            queryButton: UserStrings.QUERY_BUTTON
        };

        for (const [id, text] of Object.entries(textById)) {
            document.getElementById(id).textContent = text;
        }
        this.queryInput.placeholder = UserStrings.QUERY_PLACEHOLDER;
    }

    async onInsertClick() {
        await this.runRequest(this.insertButton, this.insertView, () =>
            this.api.sendPost(this.seeder.buildInsertQuery())
        );
    }

    async onQueryClick() {
        const sql = this.queryInput.value.trim();

        if (this.classifier.isEmpty(sql)) {
            this.queryView.showError(UserStrings.EMPTY_QUERY);
            return;
        }

        await this.runRequest(this.queryButton, this.queryView, () =>
            this.classifier.getMethod(sql) === ApiClient.METHOD_POST
                ? this.api.sendPost(sql)
                : this.api.sendGet(sql)
        );
    }

    // Disables the button while waiting so one click sends exactly one request
    async runRequest(button, view, request) {
        button.disabled = true;
        view.showLoading();

        try {
            const result = await request();
            view.showResult(result);
        } finally {
            button.disabled = false;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => new App().start());
