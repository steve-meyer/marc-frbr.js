import * as fs from "node:fs";
import * as path from "node:path";
import { workerData, parentPort } from "node:worker_threads";
import { SortedFileMerger } from "./sorted_file_merger.js";


const partitionsDirectory = path.resolve(workerData.partitionsDirectory, workerData.prefix);
const mergeableFilepaths  = fs.globSync(path.join(partitionsDirectory, "*.tsv")).sort();

let mergeCount = 0;
while (mergeableFilepaths.length > 1) {
  mergeCount++;

  const outputFilepath = path.join(partitionsDirectory, `merge-file-${mergeCount}.tsv`);
  new SortedFileMerger(
    mergeableFilepaths.shift(),
    mergeableFilepaths.shift(),
    outputFilepath
  ).merge();

  mergeableFilepaths.push(outputFilepath);
}

parentPort.postMessage(`${workerData.prefix} used ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
