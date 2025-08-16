import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { before, describe, it } from "node:test";
import { PartitionSorter } from "../src/sorting/partition_sorter";
import {
  SORTED_FILE_1_CONTENTS,
  SORTED_FILE_2_CONTENTS,
  SORTED_FILE_3_CONTENTS,
  MERGED_FILE_1_TO_3_CONTENTS,
  createFileMockFromArray
} from "./test_helpers";


// const partitionDir    = path.resolve(import.meta.dirname, "support", "data-partitions");
// const finalMergedFile = path.resolve(partitionDir, "merge-file-2.tsv");


describe("PartitionSorter", () => {
  console.log("PartitionSorter: Node's testing framework does not seem able to resolve extension-less imports for Workers");
  // before(() => {
  //   const partitionDir0 = path.resolve(partitionDir, "0");
  //   if (!fs.existsSync(partitionDir0))
  //     fs.mkdirSync(partitionDir0);
  // });

  // describe("merging two sorted files", async () => {
  //   // Create files with sorted lines
  //   await new Promise((resolve, _) => {
  //     createFileMockFromArray(SORTED_FILE_1_CONTENTS, "file-1.tsv", ["data-partitions", "0"]);
  //     createFileMockFromArray(SORTED_FILE_2_CONTENTS, "file-2.tsv", ["data-partitions", "0"]);
  //     createFileMockFromArray(SORTED_FILE_3_CONTENTS, "file-3.tsv", ["data-partitions", "0"]);
  //     resolve("done");
  //   })
  //   // Sort the entire partition directory
  //   .then(async () => {
  //     await new PartitionSorter(partitionDir).sortPartitionsAsync();
  //   })
  //   // Run the tests
  //   .then(() => {
  //     const fileContentAfterMerging: string[] = [];
  //     fs.readFileSync(finalMergedFile, {encoding: "utf-8"})
  //       .trim()
  //       .split("\n")
  //       .forEach(line => fileContentAfterMerging.push(line));

  //     it("has all entries from the input files (including duplicates)", () => {
  //       assert(fileContentAfterMerging.length === 12);
  //     });

  //     it("has entries in sorted order", () => {
  //       assert.deepEqual(fileContentAfterMerging, MERGED_FILE_1_TO_3_CONTENTS);
  //     });

  //     it("deletes the input files", () => {
  //       assert(!fs.existsSync(path.resolve(partitionDir, "file-1.tsv")));
  //       assert(!fs.existsSync(path.resolve(partitionDir, "file-2.tsv")));
  //       assert(!fs.existsSync(path.resolve(partitionDir, "file-3.tsv")));
  //     });
  //   })
  //   // Delete the merge file
  //   .then(() => {
  //   });
  // });
});
