import * as fs from "node:fs";
import assert from "node:assert";
import { describe, it } from "node:test";
import { SortedFileMerger } from "../src/sorting/sorted_file_merger";
import {
  SORTED_FILE_1_CONTENTS,
  SORTED_FILE_2_CONTENTS,
  MERGED_FILE_1_AND_2_CONTENTS,
  inputFile1,
  inputFile2,
  mergeFile1and2,
  createFileMockFromArray,
  fileLinesAsArray
} from "./test_helpers";


describe("SortedFileMerger", () => {
  describe("merging two sorted files", async () => {
    // Create files with sorted lines
    await new Promise((resolve, _) => {
      createFileMockFromArray(SORTED_FILE_1_CONTENTS, "file-1.txt");
      createFileMockFromArray(SORTED_FILE_2_CONTENTS, "file-2.txt");
      resolve("done");
    })
    // Merge the files
    .then(() => {
      new SortedFileMerger(inputFile1, inputFile2, mergeFile1and2).mergeSync();
    })
    // Run the tests
    .then(() => {
      const fileContentAfterMerging = fileLinesAsArray(mergeFile1and2);

      it("has all entries from the input files (including duplicates)", () => {
        assert(fileContentAfterMerging.length === 8);
      });

      it("has entries in sorted order", () => {
        assert.deepEqual(fileContentAfterMerging, MERGED_FILE_1_AND_2_CONTENTS);
      });

      it("deletes the input files", () => {
        assert(!fs.existsSync(inputFile1));
        assert(!fs.existsSync(inputFile2));
      });
    })
    // Delete the merge file
    .then(() => {
      fs.rmSync(mergeFile1and2);
    });
  });
});
