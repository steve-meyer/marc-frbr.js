import * as fs from "node:fs";
import { MarcReader } from "../marc/marc_reader";
import { Bib } from "../frbr/bib";
import { DataPartitionWriter } from "../sorting/data_partition_writer";
import { MarcRecord } from "../marc/record";


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
