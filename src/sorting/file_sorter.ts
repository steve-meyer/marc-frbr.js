import * as fs from "node:fs";


export class FileSorter {
  filepath: string;
  lines: string[];


  constructor(filepath: string) {
    this.filepath = filepath;
    this.lines = new Array();
  }


  sort() {
    console.log(`FileSorter: ${this.filepath}`);

    const sortedLines = fs.readFileSync(this.filepath, "utf8").split("\n").sort();

    const fd = fs.openSync(this.filepath, "w");
    sortedLines.forEach(line => {
      if (line.trim() !== "")
        fs.writeSync(fd, line + "\n")
    });
    fs.closeSync(fd);
  }
}
