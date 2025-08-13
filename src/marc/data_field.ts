import { SUBFIELD_INDICATOR } from "./record";
import { Subfield } from "./subfield";


export class DataField {
  i1;
  i2;
  subfields;


  constructor(i1: string, i2: string, subfields: Subfield[]) {
    this.i1 = i1;
    this.i2 = i2;
    this.subfields = subfields;
  }


  static from(rawDataField: Buffer) {
    const [i1, i2] = rawDataField.toString("utf8").split(SUBFIELD_INDICATOR)[0]!.split("");

    const subfields = rawDataField.toString("utf8").split(SUBFIELD_INDICATOR).slice(1).map(sfData => {
      return new Subfield(sfData[0]!, sfData.slice(1));
    });

    return new DataField(i1!, i2!, subfields);
  }
}
