import { Transform } from "node:stream";


export class DataStreamReader extends Transform {
  encoding = "utf8";
  buffer: string;
  createdAt: Date;
  clusters: Record<string, string[]>;


  constructor() {
    super({objectMode: true});

    this.buffer    = "";
    this.createdAt = new Date();
    this.clusters = {};
  }


  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    // Add new data to the buffer
    this.buffer += chunk.toString(encoding);

    // Split on the MARC end of record control character, 0x1D
    const lines = this.buffer.split("\n");

    // Last record might be incomplete, save for next chunk
    const line = lines.pop();
    if (line !== undefined)
      this.buffer = line;

    // Process binary records
    for (const line of lines) {
      // Skip blank data
      if (line.trim() === "") continue;

      // For any complete lines, split the key and record, then append to the
      // internal clusters object.
      const [key, data] = line.split("\t");
      if (!Object.hasOwn(this.clusters, key))
        this.clusters[key] = [data];
      else
        this.clusters[key].push(data);

      // Once there are two keys, pop off the one with the key that is ordered first
      // and push the key, records array to the consumer.
      if (Object.keys(this.clusters).length === 2) {
        const nextKey = Object.keys(this.clusters).sort()[0];
        const records = this.clusters[nextKey];
        delete this.clusters[nextKey];

        this.push([nextKey, records]);
      }
    }

    callback();
  }


  _flush(callback: Function) {
    // Process any remaining data
    if (Object.keys(this.clusters).length > 0) {
      const nextKey = Object.keys(this.clusters).sort()[0];
      const records = this.clusters[nextKey];
      delete this.clusters[nextKey];

      this.push([nextKey, records]);
    }

    callback();
  }
}
