import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert";
import { describe, it } from "node:test";
import { getBufferedLineReaderAndContentsWith } from "./test_helpers";
import { BufferedLineReader } from "../src/util/buffered_line_reader";


describe("BufferedLineReader", () => {
  describe("reading a file", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("one-two-three.txt");

    it("has the correct number of lines", () => assert(lines.length === 3));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, ["one", "two", "three"]));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("reading a file with a single line", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("one.txt");

    it("has the correct number of lines", () => assert(lines.length === 1));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, ["one"]));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("reading a file with no newline at the end of the last line", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("one-two-three-no-end-newline.txt");

    it("has the correct number of lines", () => assert(lines.length === 3));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, ["one", "two", "three"]));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("reading a file with a single line and no newline at the end of the last line", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("one-no-newline.txt");

    it("has the correct number of lines", () => assert(lines.length === 1));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, ["one"]));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("reading a file with blank lines", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("one-two-three-with-blank-lines.txt");

    it("has the correct number of lines", () => assert(lines.length === 6));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, ["one", "", "two", "", "three", ""]));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("reading a blank, 0 byte file", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("blank.txt");

    it("has the correct number of lines", () => assert(lines.length === 0));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, []));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("reading files with lines larger than the read chunk size", () => {
    const [reader, lines] = getBufferedLineReaderAndContentsWith("large-line-three-times.txt");
    const filepath = path.resolve(import.meta.dirname, "support", "large-line.txt");
    const expected = fs.readFileSync(filepath, "utf8").trim();

    it("has the correct number of lines", () => assert(lines.length === 3));
    it("returns all lines without new line characters", () => assert.deepEqual(lines, [expected, expected, expected]));
    it("sets the file descriptor to null when done", () => assert(reader.fd === null));
  });


  describe("mannually closing the file", () => {
    const filepath = path.resolve(import.meta.dirname, "support", "one-two-three.txt");
    const reader = new BufferedLineReader(filepath);

    let line = reader.next();
    assert(line === "one");
    reader.close();
    line = reader.next();
    assert(line === undefined);
  });
});
