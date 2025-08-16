import * as fs from "node:fs";
import * as path from "node:path";
import { workerData, parentPort } from "node:worker_threads";
import { SortedFileMerger } from "./sorted_file_merger";


const mergeableFilepaths  = fs.globSync(path.join(workerData.directory, "*.tsv")).sort();

let mergeCount = 0;
while (mergeableFilepaths.length > 1) {
  mergeCount++;

  const outputFilepath = path.join(workerData.directory, `merge-file-${mergeCount}.tsv`);
  const file1 = mergeableFilepaths.shift();
  const file2 = mergeableFilepaths.shift();
  if (file1 && file2)
    new SortedFileMerger(file1, file2, outputFilepath).mergeSync();

  mergeableFilepaths.push(outputFilepath);
}

parentPort!.postMessage(`${workerData.directory} used ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
