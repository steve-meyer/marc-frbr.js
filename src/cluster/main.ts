import { MergeKeySerializer } from "./merge_key_serializer";
import { PartitionSorter } from "../sorting/partition_sorter";
import { WorkSetsGenerator } from "./work_sets_generator";


const marcFilepath = process.argv[2];
const outputDir    = process.argv[3];
const serializer   = new MergeKeySerializer(marcFilepath, outputDir);
const sorter       = new PartitionSorter(outputDir);
const generator    = new WorkSetsGenerator(outputDir);


serializer.generateAsync()
  .then(() => sorter.sortPartitionFilesAsync())
  .then(() => sorter.sortPartitionsAsync())
  .then(() => generator.clusterAsync())
  .then(() => generator.cleanUpSync())
  .catch((err: Error) => console.error(err));
