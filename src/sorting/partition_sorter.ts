import * as fs from "node:fs";
import * as path from "node:path";
import { Worker } from "node:worker_threads";
import { HEX_PREFIXES } from "./data_partition_writer";
import { FileSorter } from "./file_sorter";


export class PartitionSorter {
  partitionsDirectory: string;


  constructor(partitionsDirectory: string) {
    this.partitionsDirectory = partitionsDirectory;
  }


  sortPartitionFilesAsync() {
    return Promise.all(fs.globSync(path.join(this.partitionsDirectory, "**/*.tsv")).map(filepath => {
      return new Promise((resolve, reject) => {
        try {
          new FileSorter(filepath).sort();
          resolve("finished");
        } catch (error) {
          console.log(error);
          reject(`Encountered problem sorting file ${filepath}`);
        }
      })
    }));
  }


  sortPartitionsAsync() {
    return Promise.all(HEX_PREFIXES.map((prefix, i) => {
      return new Promise((workerResolve, workerReject) => {
        console.log(`Spawning worker for ${prefix}`);

        const worker = new Worker(
          path.resolve(import.meta.dirname, "sort_partition"),
          { workerData: { partitionsDirectory: this.partitionsDirectory, prefix: prefix, index: i } }
        );

        worker.on("message", result => {
          console.log(result);
        });

        worker.on("error", msg => {
          workerReject(msg);
        });

        worker.on('exit', (code) => {
          if (code !== 0)
            workerReject(`Stopped the Worker Thread with the exit code: ${code}`);
          else
            workerResolve(prefix + " done")
        });
      });
    }));
  }
}
