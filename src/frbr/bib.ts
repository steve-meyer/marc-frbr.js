import { createHash } from "node:crypto";
import { MarcRecord } from "../marc/record";


export class Bib {
  marcRecord;


  constructor(marcRecord: MarcRecord) {
    this.marcRecord = marcRecord;
  }


  get id() {
    return this.marcRecord.controlNumber;
  }


  toJson() {
    return JSON.stringify({
      type: "Bib",
      marc: this.marcRecord.raw.toString("utf8"),
      id: this.id,
      merge_ids: this.getMergeIds()
    });
  }


  pubDate() {
    if (this.marcRecord.controlFields["008"] && this.marcRecord.controlFields["008"][0]!.length > 11)
      return this.marcRecord.controlFields["008"][0]!.slice(7, 11);
    else
      return "";
  }


  /**
   * Generate a title merge key for the given bib record.
   *
   * A title merge key is used as one component of the bib clustering algorithm. It is composed by
   * generating a sha1 hash of the bib record's publication date (008 date 1) and select title data.
   * The title data comes from the 245 field's a, k, n and p subfields when they exist. Title data
   * is converted to a lowercase string.
   */
  titleMergeKey() {
    let prehashedKey = "";

    prehashedKey += this.pubDate() + " ";
    prehashedKey += prehashedKey === " " ? "---- " : "";

    const titleStmt = this.marcRecord.dataFields["245"]![0]!;
    prehashedKey += Bib.removeTrailingPunctuation(
      // this.marcRecord.dataFields["245"]
      titleStmt.subfields.reduce((mergeKeyTitle, subfield) => {
        if (subfield.code === "a" || subfield.code === "k" || subfield.code === "n" || subfield.code === "p")
          mergeKeyTitle += subfield.value;

        return mergeKeyTitle;
      }, "")
    ).toLowerCase().normalize("NFC");

    return createHash("sha1").update(prehashedKey).digest("hex");
  }


  getMergeIds() {
    return [...new Set([
      [...this.getPrimaryIssns(), ...this.getLinkingIssns(), ...this.getRelatedIssns()].map(n => "issn:" + n),
      [...this.getPrimaryIsbns(), ...this.getInvalidIsbns(), ...this.getRelatedIsbns()].map(n => "isbn:" + n),
      [
        ...this.getPrimaryOclcNumbers(), ...this.getInvalidOclcNumbers(), ...this.getRelatedOclcNumbers()
      ].map(n => "oclc:" + n)
    ].flat())];
  }


  getPrimaryIssns() {
    return this.getValuesBySubfieldCodes("022", ["a", "e"]);
  }


  getLinkingIssns() {
    return this.getValuesBySubfieldCodes("022", ["l"]);
  }


  getRelatedIssns() {
    return this.getValuesBySubfieldCodes("776", ["x"]);
  }


  getPrimaryIsbns() {
    return this.getIsbn("020", ["a"]);
  }


  getInvalidIsbns() {
    return this.getIsbn("020", ["z"]);
  }


  getRelatedIsbns() {
    return this.getIsbn("776", ["z"]);
  }


  getIsbn(field: string, subfieldCodes: string[]) {
    return this.getValuesBySubfieldCodes(field, subfieldCodes).map(val => val.replace(/[^0-9X]/g, ""));
  }


  getPrimaryOclcNumbers() {
    return this.getOclcNumbers("035", ["a"]);
  }


  getInvalidOclcNumbers() {
    return this.getOclcNumbers("035", ["z"]);
  }


  getRelatedOclcNumbers() {
    return this.getOclcNumbers("776", ["w"]);
  }


  getOclcNumbers(field: string, subfieldCodes: string[]) {
    return [
      // Spread back to a regular Array
      // Convert to a Set to unique the values
      ...new Set(this.getValuesBySubfieldCodes(field, subfieldCodes)
        // Filter the control numbers by the OCLC number prefixes '(OCoLC)', 'ocm', 'ocn', 'on'
        .filter(controlNumber => controlNumber.startsWith("(OCoLC)") || controlNumber.match(/^oc*[mn].*/))
        // Remove leading 0s by converting to an integer, then convert back to a string.
        .map(controlNumber => "" + parseInt(controlNumber.replace(/\D/g, ""))))
    ];
  }


  getValuesBySubfieldCodes(field: string, subfieldCodes: string[]) {
    if (!this.marcRecord.dataFields[field]) return [];

    return this.marcRecord.dataFields[field].flatMap(field => {
      return field.subfields.filter(sf => subfieldCodes.includes(sf.code)).map(sf => {
        return Bib.removeTrailingPunctuation(sf.value);
      });
    });
  }


  static removeTrailingPunctuation(str: string) {
    if (str && str.length > 1 &&
      (str.endsWith(":") || str.endsWith(",") || str.endsWith(".") ||
       str.endsWith("/") || str.endsWith("=") || str.endsWith(";")))
      return str.substring(0, str.length - 1).trim();
    else
      return str;
  }
}
