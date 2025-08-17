import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import test, { before, after, describe, it } from "node:test";
import { DataPartitionWriter, HEX_PREFIXES } from "../src/sorting/data_partition_writer";
import { createDataPartitionDir, deleteDataPartitionDirContents } from "./test_helpers";


describe("DataPartitionWriter", async () => {
  before(() => createDataPartitionDir("data-partitions"));

  await test("instantiation", async () => {
    after(() => deleteDataPartitionDirContents());

    const outputDir = path.resolve(import.meta.dirname, "support", "data-partitions");
    let writer = new DataPartitionWriter(outputDir);

    it("creates the sub-directories", () => {
      HEX_PREFIXES.forEach((prefix: string) => {
        fs.access(path.join(outputDir, prefix), (err) => assert(!err));
      });
    });

    it("maps hexadecimal numbers to the output write stream paths", () => {
      HEX_PREFIXES.forEach((prefix: string) => {
        const expected = path.join(outputDir, prefix, `${prefix}-00000.tsv`);
        assert(writer.writeStreams[prefix].stream.path === expected);
      })
    });

    return new Promise((resolve, _) => setTimeout(resolve, 0));
  });


  // await test("writing", async () => {
  //   after(() => deleteDataPartitionDirContents());

  //   const outputDir = path.resolve(import.meta.dirname, "support", "data-partitions");
  //   const writeStr = "9876543210\trecord";

  //   await new Promise((resolve, _) => {
  //     const writer = new DataPartitionWriter(outputDir);
  //     writer.write(writeStr);
  //     resolve("done");
  //   });

  //   it("writes data to the correct file", () => {
  //     const actual = fs.readFileSync(path.join(outputDir, "9", "9-00000.tsv"), "utf-8");
  //     assert(actual === writeStr + "\n");
  //   });

  //   return new Promise((resolve, _) => setTimeout(resolve, 100));
  // });
});
