// One patient row: name + date of birth (YYYY-MM-DD).

class Patient {
    constructor(name, dateOfBirth) {
        this.name = name;
        this.dateOfBirth = dateOfBirth;
    }

    // Formats this patient as a SQL VALUES tuple, escaping single quotes
    toSqlValues() {
        return `('${Patient.escape(this.name)}', '${Patient.escape(this.dateOfBirth)}')`;
    }

    static escape(value) {
        return String(value).replace(/'/g, "''");
    }
}
