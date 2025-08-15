import { Transform } from "node:stream";


/**
 * A Node.js `Transform` streaming reader for clustered records in the following format:
 *
 * ```
 * {identifier-1}\t{string}\n
 * {identifier-1}\t{string}\n
 * {identifier-2}\t{string}\n
 * ```
 *
 * In this example, there are two clusters, one for `identifier-1` with two records and a second
 * single record cluster for `identifier-2`.
 *
 * * Each line in the input file is a tab delimited pair containing an identifier and a record.
 * * All adjacent lines with the same identifier form a cluster.
 * * Lines in the file must be sorted by the identifier.
 *
 * When a read stream is piped to a `SortedClusterReader`, the data will be passed as a two element
 * `Array`. The first element will be the clustering identifier. The second element will be an Array
 * of records that cluster under the identifier.
 */
export class SortedClusterReader extends Transform {
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
