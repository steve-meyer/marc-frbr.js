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
          new FileSorter(filepath).sortSync();
          resolve("finished");
        } catch (error) {
          console.log(error);
          reject(`Encountered problem sorting file ${filepath}`);
        }
      })
    }));
  }


  sortPartitionsAsync() {
    const partitionDirectories = HEX_PREFIXES.reduce((accum: string[], prefix: string) => {
      if (fs.existsSync(path.resolve(this.partitionsDirectory, prefix)))
        accum.push(path.resolve(this.partitionsDirectory, prefix));
      return accum;
    }, []);

    return Promise.all(partitionDirectories.map((directory) => {
      return new Promise((workerResolve, workerReject) => {
        console.log(`Spawning worker for ${directory}`);

        const workerScriptPath = path.resolve(import.meta.dirname, "sort_partition");
        const workerOptions    = { workerData: { directory: directory } };
        const worker           = new Worker(workerScriptPath, workerOptions);

        worker.on("message", result => console.log(result));
        worker.on("error", msg => workerReject(msg));
        worker.on('exit', (code) => {
          if (code !== 0)
            workerReject(`Stopped the Worker Thread with the exit code: ${code}`);
          else
            workerResolve(directory + " done")
        });
      });
    }));
  }
}
