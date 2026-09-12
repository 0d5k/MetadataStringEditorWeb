# MetaData String Editor (Web)

A simple browser-based editor for the string-literal section of Unity IL2CPP `global-metadata.dat` files. Files are processed locally in the browser.

## Features

- Opens real IL2CPP metadata files using the `0xFAB11BAF` metadata header.
- Reads the string-literal table and string-literal-data section.
- Search and virtualized display for large string tables.
- Edit, revert, and export strings.
- Preserves the original file when no edits were made.
- Safely relocates the string-literal-data section when edited data no longer fits its original location.
- Validates offsets and lengths before reading.
- Re-parses the generated file before export and verifies every edited string.
- Refuses files larger than 512 MB in the browser.

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Important format note

Unity IL2CPP metadata files contain many metadata sections. This editor only changes the string-literal table and string-literal-data section; all other bytes are retained unless the string-literal-data section has to be moved because it grew beyond its original space.

The first header fields used here are:

- `0x00`: sanity/magic `0xFAB11BAF`
- `0x04`: metadata version
- `0x08`: string-literal table offset
- `0x0C`: string-literal table byte length
- `0x10`: string-literal data offset
- `0x14`: string-literal data byte length

Each string-literal table entry is 8 bytes: a byte length followed by a byte offset relative to the string-literal-data section.

Compatibility with heavily modified, encrypted, or obfuscated metadata files is not guaranteed. The file must still expose a valid IL2CPP string-literal section.
