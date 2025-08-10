import * as fs from "node:fs";
import * as path from "node:path";
import { MarcRecord } from "../src/marc/record";
import { MarcReader } from "../src/marc/marc_reader";


export const getRawMarc = (id: string) => {
  const filepath = path.resolve(import.meta.dirname, "support", `${id}.mrc`);
  // Return a buffer so the binary MARC offsets are not shifted by mulit-byte chars.
  return fs.readFileSync(filepath);
}


export const getMarcRecord = (id: string) => {
  const rawMarc = getRawMarc(id);
  return new MarcRecord(rawMarc);
}


export const readMarcFromStream = async (filename: string): Promise<MarcRecord[]> => {
  const filepath   = path.resolve(import.meta.dirname, "support", filename);
  const stream     = fs.createReadStream(filepath);
  const marcReader = new MarcReader();

  return new Promise((resolve, reject) => {
    const records: MarcRecord[] = [];

    marcReader.on("data", (record: MarcRecord) => records.push(record));
    marcReader.on("end", () => resolve(records));
    marcReader.on("error", error => reject(error));

    stream.pipe(marcReader);
  });
}
