/**
 * Author: Andre Di Lascio
 * A single patient row (name and date of birth) and its SQL VALUES formatting.
 * Written with help of Claude.
 */

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
