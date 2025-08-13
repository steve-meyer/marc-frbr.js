import * as fs from "node:fs";
import { DataStreamReader } from "../util/data_stream_reader";


export class WorkGenerator {
  workCandidatesFilepath: string;
  workEntitiesFilepath: string;


  constructor(workCandidatesFilepath: string, workEntitiesFilepath: string) {
    console.log(workCandidatesFilepath, workEntitiesFilepath)
    this.workCandidatesFilepath = workCandidatesFilepath;
    this.workEntitiesFilepath   = workEntitiesFilepath;
  }


  clusterAsync() {
    return new Promise((resolve, reject) => {
      const readStream  = fs.createReadStream(this.workCandidatesFilepath);
      const dataStream  = new DataStreamReader();
      const writeStream = fs.createWriteStream(this.workEntitiesFilepath);

      dataStream.on("data", ([_, rawRecords]) => this.writeBibClusters(rawRecords, writeStream));
      dataStream.on("end", () => console.log("Stats placeholder"));
      dataStream.on("finish", () => resolve(`Work clustering complete for ${this.workEntitiesFilepath}.`));
      dataStream.on("error", (error) => reject(error));

      readStream.pipe(dataStream);
    });
  }


  writeBibClusters(rawRecords: string[], writeStream: fs.WriteStream) {
    const clusterCandidates = rawRecords.map(r => JSON.parse(r));

    const candidatesByBibId = clusterCandidates.reduce((candidatesByBibId, record) => {
      candidatesByBibId[record.id] = record;
      return candidatesByBibId;
    }, {});

    const bibIdClusters = this.clusterBibIds(clusterCandidates);

    return bibIdClusters.forEach(bibIdCluster => {
      const work = new Array();
      bibIdCluster.forEach((bibId: string) => work.push(candidatesByBibId[bibId]));
      writeStream.write( JSON.stringify(work) + "\n" );
    });
  }


  clusterBibIds(clusterCandidates: any) {
    // works is an Array of Sets, grouped clusters of bib ID Strings
    const works = new Array();

    clusterCandidates.forEach((candidate: any) => {
      // Before processing each candidate, identify the already merged IDs. The current
      // candidate could have already been added to a cluster while the loop was processing
      // a candidate that shares its merge IDs
      const alreadyMergedIds = new Set();
      for (const work of works)
        for (const bibId of work)
          alreadyMergedIds.add(bibId);

      // If not already merged...
      if (!alreadyMergedIds.has(candidate.id)) {
        // Create a new work cluster for the current bib, then...
        const work = new Set();
        work.add(candidate.id);

        // For all bibs related by merge ID, add it to the current work set.
        const mergeIds = this.gatherMergeIds(clusterCandidates, candidate, new Set());
        clusterCandidates.forEach((c: any) => {
          if (mergeIds.intersection(new Set(c.merge_ids)).size > 0)
            work.add(c.id);
        });
        works.push(work);
      }
    });

    return works;
  }


  gatherMergeIds(candidates: any, currentCandidate: any, mergeIds: Set<string>) {
    currentCandidate.merge_ids.filter((id: string) => !mergeIds.has(id)).forEach((id: string) => {
      // Add the current candidate merge IDs to the Set
      mergeIds.add(id);

      // For any other candidates that have overlapping merge IDs...
      const overlapCandidates = candidates.filter((bib: any) => bib.merge_ids.includes(id));

      // recursively gather their merge IDs.
      overlapCandidates.forEach((overlapCandidate: any) => this.gatherMergeIds(candidates, overlapCandidate, mergeIds));
    });

    return mergeIds;
  }
}
