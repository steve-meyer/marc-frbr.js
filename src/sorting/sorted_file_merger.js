import * as fs from "node:fs";
import LineByLine from "n-readlines";
const BufferedLineReader = LineByLine;


const TARGET_COMES_AFTER  = -1,
      TARGET_COMES_BEFORE = 1,
      TARGET_IS_EQUAL     = 0;


export class SortedFileMerger {
  inputFilepath1;
  inputFilepath2;
  outputFilepath;


  constructor(inputFilepath1, inputFilepath2, outputFilepath) {
    this.inputFilepath1 = inputFilepath1;
    this.inputFilepath2 = inputFilepath2;
    this.outputFilepath = outputFilepath;
  }


  merge() {
    console.log(`Starting data merge for \n  ${this.inputFilepath1} \n  ${this.inputFilepath2} \n to \n  ${this.outputFilepath}`);
    const reader1 = new BufferedLineReader(this.inputFilepath1, {readChunk: 256 * 1024});
    const reader2 = new BufferedLineReader(this.inputFilepath2, {readChunk: 256 * 1024});
    const fd      = fs.openSync(this.outputFilepath, "w");

    let line1 = reader1.next();
    let line2 = reader2.next();

    while (line1 && line2) {
      switch(line1.slice(0, 40).compare(line2.slice(0, 40))) {

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
    if (reader1.fd) {
      console.log("Closing reader1");
      reader1.close();
    }
    if (reader2.fd) {
      console.log("Closing reader2");
      reader2.close();
    }
    fs.unlinkSync(this.inputFilepath1);
    fs.unlinkSync(this.inputFilepath2);
  }
}
