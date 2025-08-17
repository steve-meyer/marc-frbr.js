import * as fs from "node:fs";
import { MarcReader } from "../marc/marc_reader";
import { Bib } from "../frbr/bib";
import { DataPartitionWriter } from "../sorting/data_partition_writer";
import { MarcRecord } from "../marc/record";


/**
 * This class will reserialze data in a MARC file for clustering.
 *
 * Given a path to a MARC file and an output directory, it will reserialize each MARC record in the
 * following form:
 *
 * `{Bib title merge key}\t{Bib JSON entry}\n`
 *
 * The title merge key will be a SHA1 hexadecimal hash, which is used to distribute each serialized
 * entry evenly across sub-directories within the supplied output directory. These sub-directories
 * are labeled as the hexadecimal digits 0-f. A MARC record with a `Bib` title merge key hash that
 * starts with 3, for example, will be written to a file within the path
 *
 * `/path/to/output/dir/0/3-{file-index}.tsv`
 *
 * The file `file-index` is a 0-padded integer. The `DataPartitionWriter` used by this class will
 * define the number of records per output file. See `MAX_RECORDS_PER_FILE` for the exact number.
 */
export class MergeKeySerializer {
  marcFilepath: string;
  outputDir: string;
  writer: DataPartitionWriter;
  recordCount: number;
  createdAt: Date;
  finish: Date | undefined;


  constructor(marcFilepath: string, outputDir: string) {
    this.marcFilepath = marcFilepath;
    this.outputDir    = outputDir;
    this.writer       = new DataPartitionWriter(this.outputDir);
    this.recordCount  = 0;
    this.createdAt    = new Date();
  }


  generateAsync() {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(this.marcFilepath);
      const marcReader = new MarcReader();

      marcReader.on("data", (record) => this.#processData(record));
      marcReader.on("end", this.#reportStats);
      marcReader.on("error", (err: Error) => reject(err));
      marcReader.on("finish", () => {
        resolve(`Work entity candidate reserialization complete for ${this.recordCount} bib records.`);
      });

      readStream.pipe(marcReader);
    });
  }


  /**
   * Called as an arrow function by this.reserialize() so the value of this in #processData()
   * is the MergeKeyReserializer.
   */
  #processData(record: MarcRecord) {
    this.recordCount++;

    const bib = new Bib(record);
    this.writer.write([ bib.titleMergeKey(), bib.toJson() ].join("\t"));

    if (this.recordCount % 100_000 == 0)
      console.log(`${this.recordCount} records processed`);
  }


  /**
   * Called as a regular function by this.reserialize() so the value of this in #reportStats()
   * is the MarcReader.
   */
  #reportStats() {
    this.finish = new Date();

    console.log("Created at:", this.createdAt);
    console.log("Finished:  ", this.finish);
    console.log("Time (seconds):", (this.finish.getTime() - this.createdAt.getTime()) / 1000);
  }
}
