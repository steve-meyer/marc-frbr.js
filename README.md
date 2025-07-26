# MARC FRBR

This code base provides a lightweight MARC FRBRization implementation.

## Functional Requirements for Bibliographic Records (FRBR)

FRBR is a grouping data model for library bibliographic description. This library is loosely based on FRBR Group 1, the WEMI model, which describes a data model hierarchy for creative works:

```
Work has many
  Expressions have many
    Manifestations have many
      Items
```

A Work is an abstract entity that serves to coordinate related works. For the purpose of this library, a work is a cluster of multiple bibliographic entities.

An Expression is an ill-defined concept that does not align with historical cataloging practices. There is very little data in library bibliographic description that allows an implementor to identify expressions. As such it is ignored by this library.

A Manifestation is a specific edition of a work and from the perspective of this library corresponds to a single MARC bibliographic record.

An Item is a particular copy, in part or whole, of a given manifestation.

## About the Codebase

This codebase is a command line Node.js project. It utilizes the extremely fast/optimized V8 JavaScript runtime engine by making extensive use of the Node streaming libraries and parallel processing Node `Worker` threading model.

### Input and Output Data

At present time, this codebase will create work clusters of MARC bibliographic records. It takes as input a binary MARC record file and generates the work clusters as a JSON lines file. The JSON lines objects are JSON Arrays, one per line in the file, that contain 1 or more JSON objects. The JSON objects use the following structure:

```json
{
  "type": "Bib",
  "marc": "<BINARY-MARC-AS-JSON-STRING>",
  "id": "<MARC-001-CONTROL-NUMBER>",
  "merge_ids": [
    "<[ISBN | ISSN | OCLC]-ID>",
    ...
  ]
}
```

The benefit of this output format is that it creates (nearly) the smallest possible unit of data representing a single work. As a JSON lines file, the resulting data, like the MARC binary input data, can be easily streamed through for efficient, low memory data processing.

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

#### Merge Sorting

This library implements a file system based merge sort. As such it uses a data streaming model with low memory usage and high disk usage. It will need approximately double the disk space relative to the MARC input file. In order to run as fast is possible, certain portions of the process utilize parallel processing in multiple threads.

The merge sorting relies upon intermediate temporary data files that index the data using hashed merge keys. These merge keys use the simple SHA-1 algorithm, not for cryptographic security purposes, but for their efficient sorting and the even distribution properties over large enough datasets.
