import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { describe, it } from "node:test";
import { MergeKeySerializer } from "../src/cluster/merge_key_serializer";
import { MarcRecord } from "../src/marc/record";
import { createDataPartitionDir, fileLinesAsArray } from "./test_helpers";


const marcFilepath = path.resolve(import.meta.dirname, "support", "three-records.mrc");
const outputDir    = path.resolve(import.meta.dirname, "support", "reserializer");


describe("MergeKeySerializer", () => {
  describe("reserializing a MARC file", async () => {
    createDataPartitionDir("reserializer");
    const serializer = new MergeKeySerializer(marcFilepath, outputDir);

    await serializer.generateAsync().then(async () => {
      let fileContentAfterReserializing: string[] = [];
      const generatedFiles = fs.globSync(path.resolve(outputDir, "**/*.tsv"));
      generatedFiles.forEach(filepath => {
        fileContentAfterReserializing = fileContentAfterReserializing.concat(
          fileLinesAsArray(filepath).filter(line => line.trim() !== "")
        );
      });

      await it("has a reserialized line per MARC record", () => assert(fileContentAfterReserializing.length === 3));

      await it("creates two element tab-delimited entries", () => {
        fileContentAfterReserializing.forEach(entry => {
          assert(entry.split("\t").length === 2);
        });
      });

      await it("has Bib title merge keys as the first element for each entry", () => {
        const expected = [
          "000000670195b57a802f06cebc7a0f6af8e4d4aa",
          "00000383762dae0f99b3423672a3e7fcb54f45f5",
          "28ffb9c67b8966a0891472b1ac056e4132bcab9a"
        ];
        const actual = fileContentAfterReserializing.sort().map(entry => entry.split("\t")[0]);
        assert.deepEqual(actual, expected);
      });

      await describe("each reserialized entry object", async () => {
        const entryObjects = fileContentAfterReserializing.sort().map(entry => JSON.parse(entry.split("\t")[1]));
        const bibIds = ["9980793433602122", "9910617263602122", "991022377314702122"];

        await it("is a JSON object", () => {
          entryObjects.forEach(entryObject => assert(typeof entryObject === "object"));
        });

        await it("has a type key with a value of 'Bib'", () => {
          entryObjects.forEach(entryObject => assert(entryObject.type === "Bib"));
        });

        await it("has an id", () => assert.deepEqual(entryObjects.map(e => e.id), bibIds));

        await it("has a marc key with binary MARC", () => {
          const parsedControlNums = entryObjects.map(entryObject => new MarcRecord(Buffer.from(entryObject.marc)).controlNumber);
          assert.deepEqual(parsedControlNums, bibIds);
        });

        await it("has an Array of merge IDs", () => {
          const expected = [
            ["isbn:9788178299495","isbn:8178299496","oclc:317927724"],
            ["oclc:428728238"],
            ["oclc:1119389681"]
          ];
          assert.deepEqual(entryObjects.map(e => e.merge_ids), expected);
        });
      });

      return "done";
    }).then(() => {
      fs.globSync(path.join(outputDir, "*")).forEach(directoryPath => {
        fs.rmSync(directoryPath, { recursive: true, force: true });
      });
    });
  });
});
