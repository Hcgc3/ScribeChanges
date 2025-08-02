#!/usr/bin/env node
// Automated MusicXML batch validation script
// Renamed to .cjs for CommonJS compatibility

const SCHEMA = 'schema/musicxml_reduced.xsd';
const SEARCH_DIR = process.argv[2] || 'tests/unit';
const EXT = '.musicxml';

function findFiles(dir, ext) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  });
  return results;
}

function validateFile(file) {
  try {
    execSync(`xmllint --noout --schema ${SCHEMA} ${file}`, { stdio: 'pipe' });
    return { file, valid: true };
  } catch (err) {
    return { file, valid: false, error: err.message };
  }
}

const files = findFiles(SEARCH_DIR, EXT);
if (files.length === 0) {
  console.log('No MusicXML files found for validation.');
  process.exit(0);
}

console.log(`Validating ${files.length} MusicXML files in ${SEARCH_DIR}...`);
let allValid = true;
files.forEach(f => {
  const result = validateFile(f);
  if (result.valid) {
    console.log(`✔ ${f} validates.`);
  } else {
    allValid = false;
    console.log(`✖ ${f} failed validation.`);
    console.log(result.error.split('\n')[0]);
  }
});

if (allValid) {
  console.log('All files validated successfully!');
  process.exit(0);
} else {
  console.log('Some files failed validation.');
  process.exit(1);
}
