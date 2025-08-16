import * as fs from "node:fs";
import * as path from "node:path";
import { MarcRecord } from "../src/marc/record";
import { MarcReader } from "../src/marc/marc_reader";
import { BufferedLineReader } from "../src/util/buffered_line_reader";
import { HEX_PREFIXES } from "../src/sorting/data_partition_writer";


export const SORTED_FILE_1_CONTENTS       = ["012", "013", "015", "022"];
export const SORTED_FILE_2_CONTENTS       = ["000", "001", "013", "020"];
export const SORTED_FILE_3_CONTENTS       = ["000", "002", "011", "022"];
export const MERGED_FILE_1_AND_2_CONTENTS = ["000", "001", "012", "013", "013", "015", "020", "022"];
export const MERGED_FILE_1_TO_3_CONTENTS  = [
  "000", "000", "001", "002", "011", "012", "013", "013", "015", "020", "022", "022"
];

export const inputFile1     = path.resolve(import.meta.dirname, "support", "file-1.txt");
export const inputFile2     = path.resolve(import.meta.dirname, "support", "file-2.txt");
export const mergeFile1and2 = path.resolve(import.meta.dirname, "support", "merged-file-1-and-2.txt");


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


export const getBufferedLineReaderAndContentsWith = (filename: string): [BufferedLineReader, string[]] => {
  const filepath = path.resolve(import.meta.dirname, "support", filename);
  const reader = new BufferedLineReader(filepath);
  const lines: string[] = [];
  let line: (string|undefined);
  while ((line = reader.next()) !== undefined) { lines.push(line); }

  return [reader, lines];
}


export const createDataPartitionDir = () => {
  const outputDir = path.resolve(import.meta.dirname, "support", "data-partitions");
  if (!fs.existsSync(outputDir))
    fs.mkdirSync(outputDir);
}


export const deleteDataPartitionDirContents = () => {
  const outputDir = path.resolve(import.meta.dirname, "support", "data-partitions");
  HEX_PREFIXES.forEach((prefix: string) => {
    if (fs.existsSync(path.join(outputDir, prefix)))
      fs.rmSync(path.join(outputDir, prefix), { recursive: true, force: true });
  });
}


export const createFileMockFromArray = (arr: string[], filename: string, subDirectories?: string[]) => {
  return new Promise((resolve, _) => {
    const tmpFilepath = subDirectories ?
                        path.resolve(import.meta.dirname, "support", ...subDirectories, filename) :
                        path.resolve(import.meta.dirname, "support", filename);
    const fd          = fs.openSync(tmpFilepath, "w");
    fs.writeSync(fd, arr.join("\n"));
    resolve(tmpFilepath);
  });
}
