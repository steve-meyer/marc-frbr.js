import * as fs from "node:fs";
import * as path from "node:path";
import { Worker } from "node:worker_threads";
import { HEX_PREFIXES } from "../sorting/data_partition_writer.js";


export class WorkSetsGenerator {
  partitionsDirectory;


  constructor(partitionsDirectory) {
    this.partitionsDirectory = partitionsDirectory;
  }


  clusterAsync() {
    return Promise.all(HEX_PREFIXES.map(prefix => {
      return new Promise((resolve, reject) => {
        const workCandidatesFilepath = fs.globSync(path.join(this.partitionsDirectory, prefix, "merge*.tsv"))[0];
        const workEntitiesFilepath   = path.join(this.partitionsDirectory, `${prefix}-work-entities.jsonl`);

        const worker = new Worker(
          path.resolve(import.meta.dirname, "process_work_candidates.js"),
          { workerData: { workCandidatesFilepath: workCandidatesFilepath, workEntitiesFilepath: workEntitiesFilepath } }
        );

        worker.on("message", result => console.log(result));
        worker.on("error", error => reject(error));
        worker.on("exit", (code) => {
          if (code !== 0)
            reject(`Stopped the Worker Thread with the exit code: ${code}`);
          else
            resolve(prefix + " done")
        });
      });
    }));
  }
}
