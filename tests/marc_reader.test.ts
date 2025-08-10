import assert from "node:assert";
import { describe, it } from "node:test";
import { MarcRecord } from "../src/marc/record";
import { readMarcFromStream } from "./test_helpers";


describe("MarcReader", () => {
  describe("streaming through a file", async () => {
    const records = await readMarcFromStream("three-records.mrc");

    it("reads all records in the file", () => assert(records.length === 3));

    it("returns marc.js Record objects", () => {
      records.forEach(record => assert(record instanceof MarcRecord));
    });

    it("encounters the records in order", () => {
      assert.deepEqual(
        records.map(record => record.controlNumber),
        ["9980793433602122", "9910617263602122", "991022377314702122"]
      );
    });
  });
});


