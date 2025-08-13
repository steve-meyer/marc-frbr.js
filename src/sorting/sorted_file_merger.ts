import * as fs from "node:fs";
import { BufferedLineReader } from "./buffered_line_reader";


const TARGET_COMES_AFTER  = -1,
      TARGET_COMES_BEFORE = 1,
      TARGET_IS_EQUAL     = 0;


export class SortedFileMerger {
  inputFilepath1: string;
  inputFilepath2: string;
  outputFilepath: string;


  constructor(inputFilepath1: string, inputFilepath2: string, outputFilepath: string) {
    this.inputFilepath1 = inputFilepath1;
    this.inputFilepath2 = inputFilepath2;
    this.outputFilepath = outputFilepath;
  }


  merge() {
    console.log(`Starting data merge for \n  ${this.inputFilepath1} \n  ${this.inputFilepath2} \n to \n  ${this.outputFilepath}`);
    const reader1 = new BufferedLineReader(this.inputFilepath1);
    const reader2 = new BufferedLineReader(this.inputFilepath2);
    const fd      = fs.openSync(this.outputFilepath, "w");

    let line1 = reader1.next();
    let line2 = reader2.next();

    while (line1 && line2) {
      switch(line1.slice(0, 40).localeCompare(line2.slice(0, 40))) {

        case TARGET_COMES_AFTER:
          fs.writeSync(fd, line1 + "\n");
          line1 = reader1.next();
          break;
        case TARGET_COMES_BEFORE:
          fs.writeSync(fd, line2 + "\n");
          line2 = reader2.next();
          break;
        case TARGET_IS_EQUAL:
          fs.writeSync(fd, line1 + "\n");
          fs.writeSync(fd, line2 + "\n");
          line1 = reader1.next();
          line2 = reader2.next();
          break;
      }
    }

    // One stream probably finished before the other, write the remaining entries for whichever
    // stream still has contents.

    while (line1) {
      fs.writeSync(fd, line1 + "\n");
      line1 = reader1.next();
    }

    while (line2) {
      fs.writeSync(fd, line2 + "\n");
      line2 = reader2.next();
    }

    fs.closeSync(fd);
    fs.unlinkSync(this.inputFilepath1);
    fs.unlinkSync(this.inputFilepath2);
  }
}
