import { FairDetailsFromDB, FairDetailsWithTypeFromDB } from "./dto/GetFairSettingFromDB.dto";

export const removeItemByIndexs = (arr: Record<string, any>[], indexToBeRemoved: number[]) => {
  indexToBeRemoved.forEach(indexToBeRemoved => {
    delete arr[indexToBeRemoved];
  })
  return arr.filter(value => value !== null);
}

// check if the fair is current or past
export const checkCurrentOrPastFairs = (fairs: FairDetailsFromDB[], fairSetting: any): any => {
  const { data } = fairSetting;
  if (data) {
    return fairs.flatMap((fair: FairDetailsFromDB) => {
      let modifiedOpenFairs = new FairDetailsWithTypeFromDB();
      if (fair.fairCode == data.fair_code && fair.fiscalYear == data.fiscal_year) {
        modifiedOpenFairs = {...fair, type: "CURRENT"}
      } else {
        modifiedOpenFairs = {...fair, type: "PAST"}
      }
      return modifiedOpenFairs;
     })
  }
}