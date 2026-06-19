# MARC FRBR

This code base provides a lightweight MARC FRBRization implementation.

## Project Status & Overview

This project should currently be considered a work in progress (pun intended).

The goal of this project is to provide a testing ground for experimentation in clustering bibliographic records. It uses a hybrid clustering model based on a simple merge key *and* bibliographic description identifiers. The project is motivated by library data management tasks:

* Resource discovery: creating combined records suitable for search interfaces
* Collection management: deduplication of records corresponding to different formats for the purpose of stacks management, weeding or collection analysis/development

This project strives to be a self-contained codebase. It is written in [TypeScript](https://www.typescriptlang.org/) and transpiles to executable JavaScript code for the [Node.js](https://nodejs.org/) runtime environment. As a self-contained codebase, at the present time it only contains *development* dependencies for TypeScript and the [esbuild](https://esbuild.github.io/) bundler. Therefore this codebase includes its own MARC record parser, which is **not** feature complete, and uses only the standard Node.js modules for data streams and parallel threading.

See below for further notes on the technical details.

## Installation

To use this project you will need to:

1. Download the codebase
2. Install the development dependencies
3. Build/transpile the Typescript to runnable JavaScript

```bash
$ git clone git@github.com:steve-meyer/marc-frbr.js.git
$ cd marc-frbr.js/
$ npm install
$ npm run build
```

This will create a `dist` directory in the project root where you can run the code...

### Usage

Run the main script:

```bash
$ node dist/main.js /path/to/input/marc/file.mrc /path/to/output/data/directory
```

The output data will be generated in the path supplied. The output data directory will contain JSON Lines files using the data structure described below.

## Functional Requirements for Bibliographic Records (FRBR)

[FRBR](https://www.loc.gov/catdir/cpso/frbreng.pdf) is a grouping data model for library bibliographic description. This library is loosely based on FRBR Group 1, the WEMI model, which describes a data model hierarchy for creative works:

```
Work has many
  Expressions have many
    Manifestations have many
      Items
```

A Work is an abstract entity that serves to collocate related titles. For the purpose of this library, a work is a cluster of multiple bibliographic records.

An Expression is an ill-defined concept that does not align with historical cataloging practices. There is very little data in library bibliographic description that allows an implementor to identify expressions. As such it is ignored by this library.

A Manifestation is a specific edition of a work and from the perspective of this library corresponds to a single MARC bibliographic record.

An Item is a particular copy, in part or whole, of a given manifestation. This library does not currently have functionality for item-level data. However, the data structure for this library (see below) utilizes a wrapper object that is capable of containing any arbitrary data so that item information (or other information like electronic holding details) could be included.

## About the Codebase

As noted above, this codebase is a command line Node.js project. It utilizes the extremely fast/optimized V8 JavaScript runtime engine by making extensive use of the [Node streaming libraries](https://nodejs.org/docs/latest/api/stream.html) and parallel processing [Node `Worker` threading model](https://nodejs.org/docs/latest/api/worker_threads.html).

### Input and Output Data

At present time, this codebase will create work clusters of MARC bibliographic records (manifestations). It takes as input a binary MARC record file and generates the work clusters as a JSON lines file. The JSON lines objects are JSON Arrays, one per line in the file, that contain 1 or more JSON objects. The JSON objects use the following structure:

```json
{
  "type": "Bib",
  "marc": "<BINARY-MARC-AS-JSON-STRING>",
  "id": "<MARC-001-CONTROL-NUMBER>",
  "merge_ids": [
    "<ISBN | ISSN | OCLC]-ID>",
    ...
  ]
}
```

The benefit of this output format is that it creates (nearly) the smallest possible unit of data representing a single work. As a JSON lines file, the resulting data, like the MARC binary input data, can be easily streamed through for efficient, low memory data processing.

Note that the MARC record reader implementation is not a "forgiving" reader and this library can only be used with structurally valid binary MARC data that is also valid UTF-8.

### Merging Algorithm

#### Clustering Requirements

For records to merge, they must meet the following requirements. They must have the same data in the following fields:

* Title 245 $a, $k ($k is used for unpublished titles in archival collections)
* Number of part/section of a work 245 $n
* Name of part/section of a work 245 $p
* Date 1 008[07-10]

Additionally, clustering records must exhibit a minimal level of identifier overlap in the form of ISBNs, ISSNs or OCLC numbers sourced from the following fields:

* OCLC number 035 $a, 776 $w
* ISBN 020 $a, 776 $z
* ISSN 022 $a or $e, 776 $x

Note that works that contain more than two manifestations do not require identical identifier overlap. For example, if a cluster contains records A, B and C, there may be identifier overlap between A and B and also between B and C even though records A and C share no overlap. In this case, the network through record B will still create a 3 record cluster.

#### Merge Sorting

This library implements a file system based merge sort. As such it uses a data streaming model with low memory usage and high disk usage. It will need approximately double the disk space relative to the MARC input file. In order to run as fast is possible, certain portions of the process utilize parallel processing in multiple threads.

The merge sorting relies upon intermediate temporary data files that index the data using hashed merge keys. These merge keys use the simple SHA-1 algorithm, not for cryptographic security purposes, but for their efficient sorting and the even distribution properties over large enough datasets.
