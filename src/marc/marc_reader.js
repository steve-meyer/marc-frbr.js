import { Transform } from "node:stream";
import { Record, END_OF_RECORD } from "./record.js";


export class MarcReader extends Transform {
  constructor(options = {}) {
    options.objectMode = true;
    super(options);

    this.encoding  = "binary";
    this.buffer    = "";
    this.createdAt = new Date();
  }


  _transform(chunk, encoding, callback) {
    // Add new data to the buffer
    this.buffer += chunk.toString(encoding);

    // Split on the MARC end of record control character, 0x1D
    const binaryRecords = this.buffer.split(END_OF_RECORD);

    // Last record might be incomplete, save for next chunk
    this.buffer = binaryRecords.pop();

    // Process binary records
    for (const binaryRecord of binaryRecords) {
      // Skip blank data
      if (binaryRecord.trim() === "") continue;

      // Push the parsed record to the consumer.
      this.push(new Record(Buffer.from(binaryRecord)));
    }

    callback();
  }


  _flush(callback) {
    // Process any remaining data
    if (this.buffer.trim() !== "")
      this.push(new Record(Buffer.from(this.buffer)));

    callback();
  }
}
