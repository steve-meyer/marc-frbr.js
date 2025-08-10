import { Transform } from "node:stream";
import { MarcRecord, END_OF_RECORD } from "./record";


export class MarcReader extends Transform {
  encoding;
  buffer;
  createdAt;


  constructor(options: any = {}) {
    options.objectMode = true;
    super(options);

    this.encoding  = "binary";
    this.buffer    = "";
    this.createdAt = new Date();
  }


  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    // Add new data to the buffer
    this.buffer += chunk.toString(encoding);

    // Split on the MARC end of record control character, 0x1D
    const binaryRecords = this.buffer.split(END_OF_RECORD);

    // Last record might be incomplete, save for next chunk
    const buffer = binaryRecords.pop();
    if (buffer !== undefined)
      this.buffer = buffer;

    // Process binary records
    for (const binaryRecord of binaryRecords) {
      // Skip blank data
      if (binaryRecord.trim() === "") continue;

      // Push the parsed record to the consumer.
      this.push(new MarcRecord(Buffer.from(binaryRecord)));
    }

    callback();
  }


  _flush(callback: Function) {
    // Process any remaining data
    if (this.buffer.trim() !== "")
      this.push(new MarcRecord(Buffer.from(this.buffer)));

    callback();
  }
}
