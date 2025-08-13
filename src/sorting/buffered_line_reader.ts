import * as fs from "node:fs";


export class BufferedLineReader {
  fd: (number | null);
  eofReached = false;
  linesCache: Buffer[] = new Array<Buffer>();
  fdPosition = 0;
  readChunk = 256 * 1024;
  newLineCharacter = 0x0a;


  constructor(filepath: string) {
    this.fd = fs.openSync(filepath, "r");
  }


  reset() {
    this.eofReached = false;
    this.linesCache = new Array<Buffer>();
    this.fdPosition = 0;
  }


  close() {
    if (this.fd !== null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }


  next() {
    if (!this.fd || (this.eofReached && this.linesCache.length === 0)) return;

    if (this.linesCache.length === 0) this._readChunk();

    let line = this.linesCache.shift();
    if (line !== undefined) {
      // Last line of the file may not contain a newline character.
      if (line[line.length - 1] !== this.newLineCharacter) {
        const bytesRead = this._readChunk(line);
        if (bytesRead) line = this.linesCache.shift();
      }
    }

    if (this.eofReached && this.linesCache.length === 0) this.close();

    if (line && line[line.length - 1] === this.newLineCharacter)
      return line.subarray(0, line.length - 1).toString();
    else if (line)
      return line.toString();
  }


  /**
   * Read the next chunk of the file into the internal line cache.
   *
   * @param lineLeftovers a Buffer chunk from the previous read, the remaining bytes after the last new line
   * @returns (number) the number of bytes read
   */
  _readChunk(lineLeftovers?: Buffer) {
    let totalBytesRead = 0;

    let bytesRead;
    const buffers = new Array<Buffer>();
    do {
      if (this.fd !== null) {
        const readBuffer = Buffer.alloc(this.readChunk);
        bytesRead = fs.readSync(this.fd, readBuffer, 0, this.readChunk, this.fdPosition);
        totalBytesRead = totalBytesRead + bytesRead;
        this.fdPosition = this.fdPosition + bytesRead;
        buffers.push(readBuffer);
      }
    } while (bytesRead && this._newLineIndex(buffers[buffers.length - 1]) === -1);
    let bufferData = Buffer.concat(buffers);

    if (bytesRead === undefined || bytesRead < this.readChunk) {
      this.eofReached = true;
      bufferData = bufferData.subarray(0, totalBytesRead);
    }

    if (totalBytesRead > 0) {
      this.linesCache = this._extractLines(bufferData);

      if (lineLeftovers)
        this.linesCache[0] = Buffer.concat([lineLeftovers, this.linesCache[0]]);
    }

    return totalBytesRead;
  }


  _newLineIndex(buffer: Buffer) {
    return buffer.reduce((pos, elem, i) => elem === this.newLineCharacter ? i : pos, -1);
  }


  /**
   * Split a Buffer on new line characters. Note the last element of the returned array may not be
   * a complete line.
   *
   * @param buffer a Buffer representing one or more lines of text
   * @returns an array of Buffers where each Buffer corresponds to one line in original Buffer
   */
  _extractLines(buffer: Buffer) {
    const lines = new Array<Buffer>();

    let bufferPosition            = 0;
    let lastNewLineBufferPosition = 0;

    while (true) {
      let bufferPositionValue = buffer[bufferPosition++];

      if (bufferPositionValue === this.newLineCharacter) {
        lines.push( buffer.subarray(lastNewLineBufferPosition, bufferPosition) );
        lastNewLineBufferPosition = bufferPosition;
      } else if (bufferPositionValue === undefined) {
        break;
      }
    }

    let leftovers = buffer.subarray(lastNewLineBufferPosition, bufferPosition);
    if (leftovers.length) lines.push(leftovers);

    return lines;
  }
}
