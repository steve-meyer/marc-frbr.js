import { MergeKeySerializer } from "./merge_key_serializer.js";
import { PartitionSorter } from "../sorting/partition_sorter.js";
import { WorkSetsGenerator } from "./work_sets_generator.js";


const marcFilepath = process.argv[2];
const outputDir    = process.argv[3];
const serializer   = new MergeKeySerializer(marcFilepath, outputDir);
const sorter       = new PartitionSorter(outputDir);
const generator    = new WorkSetsGenerator(outputDir);


serializer.generateAsync()
  .then(() => sorter.sortPartitionFilesAsync())
  .then(() => sorter.sortPartitionsAsync())
  .then(() => generator.clusterAsync())
  .catch((err) => console.error(err));
