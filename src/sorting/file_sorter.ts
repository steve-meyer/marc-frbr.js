import * as fs from "node:fs";


/**
 * Sort the lines of a plain text file.
 */
export class FileSorter {
  filepath: string;
  lines: string[];


  constructor(filepath: string) {
    this.filepath = filepath;
    this.lines = new Array();
  }


  /**
   * Synchronously sort the lines of the file given to the constructor. Lines delimited by
   * newline characters. Alters the supplied file. Blank lines will be removed.
   */
  sortSync() {
    const sortedLines = fs.readFileSync(this.filepath, "utf8").split("\n").sort();

    const fd = fs.openSync(this.filepath, "w");
    sortedLines.forEach(line => {
      if (line.trim() !== "")
        fs.writeSync(fd, line + "\n")
    });
    fs.closeSync(fd);
  }
}
