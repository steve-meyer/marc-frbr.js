import * as fs from "node:fs";
import * as path from "node:path";
import { Record } from "../src/marc/record.js";
import { MarcReader } from "../src/marc/marc_reader.js";


export const getRawMarc = (id) => {
  const filepath = path.resolve(import.meta.dirname, "support", `${id}.mrc`);
  // Return a buffer so the binary MARC offsets are not shifted by mulit-byte chars.
  return fs.readFileSync(filepath);
}


export const getMarcRecord = (id) => {
  const rawMarc = getRawMarc(id);
  return new Record(rawMarc);
}


export const readMarcFromStream = async (filename) => {
  const filepath   = path.resolve(import.meta.dirname, "support", filename);
  const stream     = fs.createReadStream(filepath);
  const marcReader = new MarcReader();

  return new Promise((resolve, reject) => {
    const records = [];

    marcReader.on("data", (record) => records.push(record));
    marcReader.on("end", () => resolve(records));
    marcReader.on("error", error => reject(error));

    stream.pipe(marcReader);
  });
}
