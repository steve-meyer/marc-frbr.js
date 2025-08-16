import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { describe, it } from "node:test";
import { FileSorter } from "../src/sorting/file_sorter";


const UNSORTED_CONTENTS = [
  "0001e492a9b613c231a5d37e6750b2b3aa39b5ec",
  "",
  "00011428085a3b1bf158be13f46d9defb586b5c9",
  "000128804ca27511bfe555100d379f684f4e6ae8",
  "00001e98ea6fef6fa70efbe41aa65535429a7da7",
  "",
  "",
];

const SORTED_CONTENTS = [
  "00001e98ea6fef6fa70efbe41aa65535429a7da7",
  "00011428085a3b1bf158be13f46d9defb586b5c9",
  "000128804ca27511bfe555100d379f684f4e6ae8",
  "0001e492a9b613c231a5d37e6750b2b3aa39b5ec",
];


describe("FileSorter", () => {
  describe("sorting a file", async () => {
    // Create a file with unsorted lines
    await new Promise((resolve, _) => {
      const tmpFilepath = path.resolve(import.meta.dirname, "support", "file-to-sort.txt");
      const fd          = fs.openSync(tmpFilepath, "w");
      fs.writeSync(fd, UNSORTED_CONTENTS.join("\n"));
      resolve(tmpFilepath);
    })
    // Sort the file
    .then((tmpFilepath) => {
      new FileSorter(tmpFilepath as string).sortSync();
      return tmpFilepath;
    })
    // Run the tests
    .then(async (tmpFilepath) => {
      const fileContentAfterSorting: string[] = [];
      fs.readFileSync(tmpFilepath as string, {encoding: "utf-8"})
        .trim()
        .split("\n")
        .forEach(line => fileContentAfterSorting.push(line));

      await it("ignores blank lines", () => assert(fileContentAfterSorting.length === 4));
      await it("sorts the contents of the file", () => assert.deepEqual(fileContentAfterSorting, SORTED_CONTENTS));

      return tmpFilepath;
    })
    // Delete the file
    .then((tmpFilepath) => {
      fs.rmSync(tmpFilepath as string);
    });
  });
});
