## Flatten Folder

Extract files with specified type from a file tree into a flat folder.

File names in flat folder will be kept intact with its original name.

## Usage

`node index.js --from path --to path --suffix [img|av|suffix|any] --cleanUp --overwrite`

#### Options:
- `--from DIR` path of source folder (required)
- `-to DIR` path of target folder (will be created if missing)
- `--suffix [img|av|suffix|any]`  Specify the file type
    + `--suffix img`: all image files
    + `--suffix av`: all audio/video files
    + `--suffix json`: all json files
    + `--suffix any`: all files (By default)
- `--cleanUp`  Remove source folder afterwards
- `--overwrite`  Overwrite file with the same name if it exists in target folder

## Example

Let's say we have a `test/fixture` folder with the following structure:

```
$ tree test/fixture
test/fixtures
├── f1
│   ├── 1.json
│   ├── 7.jpg
│   └── f21
│       ├── 5.png
│       └── 6.jpg
└── f2
    ├── f31
    │   ├── 1.png
    │   └── f311
    │       ├── 2.json
    │       ├── 2.png
    │       └── 3.png
    └── f32
        └── 4.png
```

#### Round1
Run: `node index.js --from ./test/fixtures --to ./test/result --suffix json --overwrite`

Then you will get a flat structure of folder with all json files from source folder:

```
$ tree test/result
test/result
├── 1.json
└── 2.json
```

#### Round2
Run: `node index.js --from ./test/fixtures --to ./test/result --suffix img --overwrite`

Then you will get a flat structure of folder with all image files from source folder:

```
$ tree test/result
test/result
├── 1.json
├── 1.png
├── 2.json
├── 2.png
├── 3.png
├── 4.png
├── 5.png
├── 6.jpg
└── 7.jpg
```

#### Round3
Run: `node index.js --from ./test/fixtures --to ./test/result --suffix img --overwrite`

With `--overwrite` option, you will get only one copy for each image file:

```
$ tree test/result
test/result
├── 1.json
├── 1.png
├── 2.json
├── 2.png
├── 3.png
├── 4.png
├── 5.png
├── 6.jpg
└── 7.jpg
```

## License

[MIT](LICENSE)
