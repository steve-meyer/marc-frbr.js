import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { describe, it } from "node:test";
import { SortedFileMerger } from "../src/sorting/sorted_file_merger";
import { createFileMockFromArray } from "./test_helpers";


const SORTED_FILE_1_CONTENTS = ["012", "013", "111", "a01"];
const SORTED_FILE_2_CONTENTS = ["000", "001", "013", "b00"];
const MERGED_FILE_CONTENTS   = ["000", "001", "012", "013", "013", "111", "a01", "b00"];

const inputFile1 = path.resolve(import.meta.dirname, "support", "file-1.txt");
const inputFile2 = path.resolve(import.meta.dirname, "support", "file-2.txt");
const mergeFile  = path.resolve(import.meta.dirname, "support", "merged-file.txt");


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
      new SortedFileMerger(inputFile1, inputFile2, mergeFile).mergeSync();
    })
    // Run the tests
    .then(() => {
      const fileContentAfterMerging: string[] = [];
      fs.readFileSync(mergeFile as string, {encoding: "utf-8"})
        .trim()
        .split("\n")
        .forEach(line => fileContentAfterMerging.push(line));

      it("has all entries from the input files (including duplicates)", () => {
        assert(fileContentAfterMerging.length === 8);
      });

      it("has entries in sorted order", () => assert.deepEqual(fileContentAfterMerging, MERGED_FILE_CONTENTS));

      it("deletes the input files", () => {
        assert(!fs.existsSync(inputFile1));
        assert(!fs.existsSync(inputFile2));
      });
    })
    // Delete the merge file
    .then(() => {
      fs.rmSync(mergeFile);
    });
  });
});
