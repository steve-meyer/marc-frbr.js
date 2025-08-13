import { workerData, parentPort } from "node:worker_threads";
import { WorkGenerator } from "./work_generator";

await new WorkGenerator(
  workerData.workCandidatesFilepath,
  workerData.workEntitiesFilepath
).clusterAsync();

parentPort!.postMessage(`${workerData.workEntitiesFilepath} complete`);
