import assert from "node:assert";
import { describe, it } from "node:test";
import { getMarcRecord } from "./test_helpers.js";
import { Bib } from "../src/frbr/bib.js";


describe("Bib", () => {
  describe("when loaded from a Record", () => {
    const bib = new Bib(getMarcRecord("991023163396102122"));

    it("has an ID", assert(bib.id === "991023163396102122"));

    it("has a pub date", assert(bib.pubDate() === "2021"));

    it("has a merge key", assert(bib.titleMergeKey() === "e1a757d416ec1d8750206ca154661167c13df861"));
  });


  describe("merge ID parsing", () => {
    const nature = new Bib(getMarcRecord("991561113602122"));
    const sas    = new Bib(getMarcRecord("991023163396102122"));
    const cac    = new Bib(getMarcRecord("991022058485302122"));
    const top    = new Bib(getMarcRecord("9910627963602121"));
    const rdActv = new Bib(getMarcRecord("9987710473602122"));
    const cac2   = new Bib(getMarcRecord("9970515113602122"));

    // console.log(cac2.marcRecord.toString())

    it("finds primary ISSNs", () => assert.deepEqual(nature.getPrimaryIssns(), ["0028-0836"]));
    it("finds linking ISSNs", () => assert.deepEqual(nature.getPrimaryIssns(), ["0028-0836"]));
    it("finds related ISSNs", () => assert.deepEqual(nature.getRelatedIssns(), ["1476-4687"]));

    it("finds primary ISBNs", () => assert.deepEqual(sas.getPrimaryIsbns(), ["1913029956", "9781913029951"]));
    it("finds invalid ISBNs", () => assert.deepEqual(cac.getInvalidIsbns(), ["0801882818", "9780801882814"]));
    it("finds related ISBNs", () => assert.deepEqual(top.getRelatedIsbns(), ["9780813124261", "0813124263"]));
    it("allows an 'X' in an ISBN", () => assert(cac2.getPrimaryIsbns().includes("080188876X")));
    it("strips non-numeric chars from an ISBN", () => {
      assert.deepEqual(rdActv.getPrimaryIsbns(), ["9780061351327", "0061351326", "9780062226051"]);
    });

    it("finds primary OCLC numbers", () => assert.deepEqual(nature.getPrimaryOclcNumbers(), ["1586310"]));
    it("finds related OCLC numbers", () => assert.deepEqual(nature.getRelatedOclcNumbers(), ["47076528"]));
    it("finds invalid OCLC numbers", () => {
      const expected = [
        "4206804", "4363186", "2448976", "12332495", "185058221", "243782229", "247515038",
        "496009298", "818653484", "849892913", "866119452", "960174499"
      ];
      assert.deepEqual(nature.getInvalidOclcNumbers(), expected);
    });

    it("prefixes merge IDs with their namespaces (ISSN, OCLC)", () => {
      const expected = [
        "issn:0028-0836", "issn:1476-4687", "oclc:1586310", "oclc:4206804", "oclc:4363186", "oclc:2448976",
        "oclc:12332495", "oclc:185058221", "oclc:243782229", "oclc:247515038", "oclc:496009298",
        "oclc:818653484", "oclc:849892913", "oclc:866119452", "oclc:960174499", "oclc:47076528"
      ];
      assert.deepEqual(nature.getMergeIds(), expected);
    });

    it("prefixes merge IDs with their namespaces (ISBN, OCLC)", () => {
      const expected = [
        "isbn:1913029956", "isbn:9781913029951", "oclc:1192493942"
      ];
      assert.deepEqual(sas.getMergeIds(), expected);
    });
  });


  describe("its static helper methods", () => {
    describe("removing trailing punctuation used in MARC cataloging", () => {
      it("removes a slash", () => {
        const title = "Structure and synthesis : the anatomy of practice /";
        const expected = "Structure and synthesis : the anatomy of practice";
        assert(Bib.removeTrailingPunctuation(title) === expected);
      });

      it("removes a colon", () => {
        const title = "Structure and synthesis :";
        const expected = "Structure and synthesis";
        assert(Bib.removeTrailingPunctuation(title) === expected);
      });

      it("removes a comma", () => {
        const title = "Structure and synthesis ,";
        const expected = "Structure and synthesis";
        assert(Bib.removeTrailingPunctuation(title) === expected);
      });

      it("removes a period", () => {
        const title = "Structure and synthesis .";
        const expected = "Structure and synthesis";
        assert(Bib.removeTrailingPunctuation(title) === expected);
      });

      it("removes a semicolon", () => {
        const title = "Structure and synthesis ;";
        const expected = "Structure and synthesis";
        assert(Bib.removeTrailingPunctuation(title) === expected);
      });

      it("removes an equal sign", () => {
        const title    = "Transliterated title =";
        const expected = "Transliterated title";
        assert(Bib.removeTrailingPunctuation(title) === expected);
      });
    });
  });
});
