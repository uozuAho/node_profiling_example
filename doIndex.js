const fs = require('fs');
const _path = require('path');
const lunr = require('lunr');

const _start = Date.now();

const trace = msg => {
  const timestamp = (Date.now() - _start) / 1000;

  console.log(`${timestamp}: ${msg}`);
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = _path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ?
      walkDir(dirPath, callback) : callback(_path.join(dir, f));
  });
};

const allFilesUnderPath = path => {
  const paths = [];
  walkDir(path, p => paths.push(p));
  return paths;
};

const shouldIndex = path => {
  for (const ext of ['md', 'txt', 'log']) {
    if (path.endsWith(ext)) {
      return true;
    }
  }
  return false;
};

const readFileAsync = path => {
  return fs.promises.readFile(path)
    .then(contents => new String(contents).toString());
};

/**
 * Returns [{
 *  file {string}:     file path
 *  contents {string}: file contents
 * }]
 * 
 * @param {string} path to get files from
 */
const readAllFilesUnderPath = async path => {
  const files = [];
  const jobs = [];

  for (const file of allFilesUnderPath(path)) {
    if (!shouldIndex(file)) { continue; }

    const job = readFileAsync(file)
      .then(contents => {
        files.push({file, contents});
      });

    jobs.push(job);
  }

  await Promise.all(jobs);

  return files;
}

const index = async dir => {
  trace(`indexing ${dir}`);

  const files = await readAllFilesUnderPath(dir);

  const lunrIndex = lunr(builder => {
    builder.ref('file');
    builder.field('contents');

    for (const file of files) {
      builder.add(file);
    }
  });

  trace('indexing finished');

  return lunrIndex;
};

index('C:\\woz\\10000-markdown-files\\1000 files')
  // just to ensure indexing actually worked
  .then(idx => console.log(idx.search('gravely')[0]));
