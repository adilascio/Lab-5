// Holds the fixed sample patients and builds the INSERT sent by the Insert button.

class PatientSeeder {
    static TABLE_NAME = "patient";
    static COLUMNS = "name, dateOfBirth";

    constructor() {
        this.patients = [
            new Patient("Sara Brown", "1901-01-01"),
            new Patient("John Smith", "1941-01-01"),
            new Patient("Jack Ma", "1961-01-30"),
            new Patient("Elon Musk", "1999-01-01")
        ];
    }

    buildInsertQuery() {
        const values = this.patients.map((patient) => patient.toSqlValues()).join(", ");
        return `INSERT INTO ${PatientSeeder.TABLE_NAME} (${PatientSeeder.COLUMNS}) VALUES ${values};`;
    }
}
