export class FairDetailsFromDB {
    fairCode: string;
    fiscalYear: string;
    vmsProjectNo: string;
    vmsProjectYear: string;
    eoaFairId: string;
    fairShortName: string;
    seminarYear: string;

    constructor() {
        this.fairCode = "";
        this.fiscalYear = "";
        this.vmsProjectNo = "";
        this.vmsProjectYear = "";
        this.eoaFairId = "";
        this.fairShortName = "";
        this.seminarYear = "";
    }
}

export class FairDetailsWithTypeFromDB extends FairDetailsFromDB {
    type: "CURRENT" | "PAST";
}
