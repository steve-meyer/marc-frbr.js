import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { describe, it } from "node:test";
import { WorkGenerator } from "../src/cluster/work_generator";
import { fileLinesAsArray } from "./test_helpers";


const workCandidatesFilepath = path.resolve(
  import.meta.dirname, "support", "clustering", "three-way-merge", "0-00000.tsv");
const workEntitiesFilepath   = path.resolve(
  import.meta.dirname, "support", "clustering", "three-way-merge", "work-entities.jsonl");


describe("WorkGenerator", () => {
  describe("when three records should merge", async () => {
    await new WorkGenerator(workCandidatesFilepath, workEntitiesFilepath).clusterAsync().then(() => {
      const workEntityLines = fileLinesAsArray(workEntitiesFilepath);

      it("merges all records into a single work", () => {
        assert(workEntityLines.length === 1);
      });

      describe("the generated work object", () => {
        const work = JSON.parse(workEntityLines[0]);

        it("is represented as a JSON Array", () => {
          assert(typeof work === "object");
          assert(work.constructor === Array);
        });

        it("contains all three source records", () => {
          const expected = ["9994631293602122", "9969396263602122", "9913310673402121"];
          assert.deepEqual(work.map(b => b.id), expected);
        });

        it("has Bib objects as members", () => {
          work.forEach(bib => assert(bib.type === "Bib"));
        });
      });
    }).then(() => {
      fs.rmSync(workEntitiesFilepath);
    });
  });
});
