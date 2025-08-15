import * as path from "node:path";
import * as fs from "node:fs";
import assert from "node:assert";
import { describe, it } from "node:test";
import { SortedClusterReader } from "../src/util/sorted_cluster_reader";


type cluster = {
  identifier: string;
  records: string[];
}


describe("SortedClusterReader", async () => {
  describe("reading a sorted cluster file", async () => {
    await new Promise((resolve, reject) => {

      const parsedRecords: cluster[] = [];
      const filepath   = path.resolve(import.meta.dirname, "support", "cluster-file.tsv");
      const readStream = fs.createReadStream(filepath);
      const dataStream = new SortedClusterReader();

      dataStream.on("data", ([clusterId, records]) => parsedRecords.push({identifier: clusterId, records: records}));
      dataStream.on("end", () => resolve(parsedRecords));

      readStream.pipe(dataStream);

    }).then((parsedRecords: any) => {

      it("has the correct number of clusters", () => assert(parsedRecords.length === 2));

      it("has the correct cluster identifiers", () => {
        assert(parsedRecords[0].identifier === "00001e98ea6fef6fa70efbe41aa65535429a7da7");
        assert(parsedRecords[1].identifier === "00002ae282cd415b24e493648383f78a8c17b6ee");
      });

      it("has the correct number of records per cluster", () => {
        assert(parsedRecords[0].records.length === 2);
        assert(parsedRecords[1].records.length === 1);
      });

      it("returns the clustered records as strings (client is responsible for parsing)", () => {
        parsedRecords.flatMap((cluster: cluster) => cluster.records).forEach(record => assert(typeof record === "string"));
      });

      it("has the correct cluster records", () => {
        assert.deepEqual(parsedRecords[0].records[0], '{"cluster": 1, "record": 1}');
        assert.deepEqual(parsedRecords[0].records[1], '{"cluster": 1, "record": 2}');
        assert.deepEqual(parsedRecords[1].records[0], '{"cluster": 2, "record": 1}');
      });

    });
  });
});
