import { DataField } from "./data_field.js";


const LEADER_LENGTH          = 24;
const DIRECTORY_ENTRY_LENGTH = 12;
const TAG_LENGTH             = 3;
const FIELD_LENGTH           = 4;
const ADDRESS_LENGTH         = 5;

export const SUBFIELD_INDICATOR = "\x1F";
export const END_OF_FIELD       = "\x1E";
export const END_OF_RECORD      = "\x1D";


export class Record {
  leader;
  controlFields = {};
  dataFields = {};


  constructor(raw) {
    this.raw = raw;
    this.#parse();
  }


  get controlNumber() {
    return this.controlFields["001"][0];
  }


  toString() {
    let str = `LEADER ${this.leader}\n`;

    for (let field of Object.keys(this.controlFields))
      for (let data of this.controlFields[field])
        str += `${field} ${data}\n`;

    Object.keys(this.dataFields).sort().forEach(field => {
      this.dataFields[field].forEach(dataField => {
        str += `${field} ${dataField.i1}${dataField.i2}`;
        dataField.subfields.forEach(subfield => str += ` $${subfield.code} ${subfield.value}`);
        str += "\n";
      });
    });

    return str;
  }


  #parse() {
    this.leader = this.raw.slice(0, 24).toString();

    const baseDataAddress = parseInt(this.leader.slice(12, 17));
    const directory       = this.raw.slice(LEADER_LENGTH, baseDataAddress);

    for (let i = 0; i < directory.length - 1; i += DIRECTORY_ENTRY_LENGTH) {
      const fieldTag    = directory.slice(i, i + TAG_LENGTH).toString();
      const fieldLength = parseInt(directory.slice(i + TAG_LENGTH, i + TAG_LENGTH + FIELD_LENGTH));
      const address     = parseInt(directory.slice(
        i + TAG_LENGTH + FIELD_LENGTH,
        i + TAG_LENGTH + FIELD_LENGTH + ADDRESS_LENGTH
      ));

      if (fieldTag < "010") {
        if (this.controlFields[fieldTag] === undefined) this.controlFields[fieldTag] = new Array();

        this.controlFields[fieldTag].push(
          this.raw.slice(
            baseDataAddress + address,
            baseDataAddress + address + fieldLength - 1
          ).toString()
        );
      } else {
        if (this.dataFields[fieldTag] === undefined) this.dataFields[fieldTag] = new Array();

        this.dataFields[fieldTag].push(
          DataField.from(
            this.raw.slice(
              baseDataAddress + address,
              baseDataAddress + address + fieldLength - 1
            )
        ));
      }
    }
  }
}
