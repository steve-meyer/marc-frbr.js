import * as fs from "node:fs";
import { DataStreamReader } from "../sorting/data_stream_reader.js";


export class WorkGenerator {
  workCandidatesFilepath;
  workEntitiesFilepath;


  constructor(workCandidatesFilepath, workEntitiesFilepath) {
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


  writeBibClusters(rawRecords, writeStream) {
    const clusterCandidates = rawRecords.map(r => JSON.parse(r));

    const candidatesByBibId = clusterCandidates.reduce((candidatesByBibId, record) => {
      candidatesByBibId[record.id] = record;
      return candidatesByBibId;
    }, {});

    const bibIdClusters = this.clusterBibIds(clusterCandidates);

    return bibIdClusters.forEach(bibIdCluster => {
      const work = new Array();
      bibIdCluster.forEach(bibId => work.push(candidatesByBibId[bibId]));
      writeStream.write( JSON.stringify(work) + "\n" );
    });
  }


  clusterBibIds(clusterCandidates) {
    // works is an Array of Sets, grouped clusters of bib ID Strings
    const works = new Array();

    clusterCandidates.forEach(candidate => {
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
        clusterCandidates.forEach(c => {
          if (mergeIds.intersection(new Set(c.merge_ids)).size > 0)
            work.add(c.id);
        });
        works.push(work);
      }
    });

    return works;
  }


  gatherMergeIds(candidates, currentCandidate, mergeIds) {
    currentCandidate.merge_ids.filter(id => !mergeIds.has(id)).forEach(id => {
      // Add the current candidate merge IDs to the Set
      mergeIds.add(id);

      // For any other candidates that have overlapping merge IDs...
      const overlapCandidates = candidates.filter(bib => bib.merge_ids.includes(id));

      // recursively gather their merge IDs.
      overlapCandidates.forEach(overlapCandidate => this.gatherMergeIds(candidates, overlapCandidate, mergeIds));
    });

    return mergeIds;
  }
}
