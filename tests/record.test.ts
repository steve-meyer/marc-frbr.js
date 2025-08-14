import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { describe, it } from "node:test";
import { MarcRecord } from "../src/marc/record";
import { getMarcRecord } from "./test_helpers";


describe("Record", () => {
  describe("loading a MARC record", () => {
    const record = getMarcRecord("991023163396102122");

    it("is a MarcRecord", () => assert(record instanceof MarcRecord));

    it("has a leader", () => assert(record.leader === "03023cam a2200481Ii 4500"));

    it("has a control number", () => assert(record.controlNumber === "991023163396102122"));

    it("returns strings for fixed length data fields", () => {
      assert(record.controlFields["005"][0] === "20220627023615.0");
      assert(record.controlFields["008"][0] === "200904s2021    enka          000 0 eng d");
    });

    it("returns undefined for a control field that is not present", () => {
      assert(record.controlFields["007"] === undefined);
    });

    it("returns an object for variable data fields", () => {
      const title = record.dataFields["245"][0];

      assert(title.i1 === "1");
      assert(title.i2 === "0");
      assert(title.subfields.find(sf => sf.code == "a")!.value === "Structure and synthesis :");
      assert(title.subfields.find(sf => sf.code == "b")!.value === "the anatomy of practice /");
      assert(title.subfields.find(sf => sf.code == "c")!.value === "Mark Fell ; edited by Robin Mackay ; design by Joe Gilmore.");
    });

    it("allows multiple instances of the same tag", () => {
      assert(record.controlFields["005"].length === 1);
      assert(record.dataFields["035"].length === 5);
    });

    it("prints in MARC record view", () => {
      const filepath = path.resolve(import.meta.dirname, "support", `991023163396102122.txt`);
      const expected = fs.readFileSync(filepath, "utf8");
      assert(record.toString() === expected);
    });
  });
});
