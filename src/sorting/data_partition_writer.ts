import * as fs from "node:fs";
import * as path from "node:path";


export const MAX_RECORDS_PER_FILE = 20_000;

export const HEX_PREFIXES = [...Array(10).keys()]
                            .map(i => "" + i)
                            .concat([...Array(6).keys()].map(n => String.fromCharCode('a'.charCodeAt(0) + n)));


type WriteStreamEntry = {
  prefix: string,
  fileCount: number,
  recordCount: number,
  stream: fs.WriteStream
}


/**
 * A writer that will spread data across hexadecimal indexed sub-directories. This class presumes that the
 * strings it writes out begin with hexadecimal hash keys that evenly distribute data by hex numbering. It
 * is designed for use in a file system based merge sorting algorithm for files.
 *
 * Instantiate with an output directory as a `string` file system path. It will then create sub-directories
 * at that location for the sixteen single digit hexadecimal numbers 0-9, a-f.
 *
 * The writer's `write()` method should be given a string that begins with a hexidecimal number. It will
 * write the supplied string value into a file within the corresponding sub-directory that matches the
 * hex number.
 */
export class DataPartitionWriter {
  outputDir;
  writeStreams: Record<string, WriteStreamEntry>;


  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.#createSubDirectories();

    this.writeStreams = HEX_PREFIXES.reduce((writeStreams: Record<string, WriteStreamEntry>, prefix) => {
      writeStreams[prefix] = {
        prefix: prefix,
        fileCount: 0,
        recordCount: 0,
        stream: fs.createWriteStream(path.join(this.outputDir, prefix, `${prefix}-00000.tsv`))
      };
      return writeStreams;
    }, {});
  }


  write(str: string) {
    if (this.writeStreams[str[0]].recordCount === MAX_RECORDS_PER_FILE) {
      const prefix = str[0];
      this.writeStreams[prefix].stream.close();
      this.writeStreams[prefix].fileCount++;
      this.writeStreams[prefix].stream = fs.createWriteStream(path.join(
        this.outputDir,
        prefix,
        `${prefix}-${this.writeStreams[prefix].fileCount.toString().padStart(5, "0")}.tsv`
      ));
      this.writeStreams[prefix].recordCount = 0;
    }

    this.writeStreams[str[0]].stream.write(str + "\n");
    this.writeStreams[str[0]].recordCount++;
  }


  #createSubDirectories() {
    HEX_PREFIXES.forEach(prefix => {
      if (!fs.existsSync(path.join(this.outputDir, prefix)))
        fs.mkdirSync(path.join(this.outputDir, prefix));
    });
  }
}
