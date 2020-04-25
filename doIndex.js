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

const index = async dir => {
  trace(`indexing ${dir}`);

  const builder = new lunr.Builder();

  builder.pipeline.add(
    lunr.trimmer,
    lunr.stopWordFilter,
    lunr.stemmer
  );

  builder.searchPipeline.add(
    lunr.stemmer
  );

  builder.ref('path');
  builder.field('text');

  const jobs = [];
  let numFilesIndexed = 0;

  for (const path of allFilesUnderPath(dir)) {
    if (!shouldIndex(path)) { continue; }

    numFilesIndexed++;

    const job = readFileAsync(path)
      .then(text => {
        builder.add({path, text});
      });

    jobs.push(job);
  }

  await Promise.all(jobs);

  const lunrIndex = builder.build();

  trace('indexing finished');

  return lunrIndex;
};

index('C:\\woz\\10000-markdown-files\\1000 files');
