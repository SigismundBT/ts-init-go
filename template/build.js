import { build } from 'esbuild';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

const rl = readline.createInterface({ input, output });

// get the files and folders in src folder
const srcPath = path.join(import.meta.dirname, 'src');

// Check if the src directory exists
try{
  await fs.access(srcPath);
} catch {
  // Create the src directory if it does not exist
  console.log('The src directory does not exist, Creating it now...');
  await fs.mkdir(srcPath, { recursive: true });
  console.log('✅ src directory created successfully. You can now add your source files.');
  process.exit(0);
};

const srcFiles = await fg('src/**/*', { onlyFiles: true });
const srcFolders = await fg('src/**/', { onlyDirectories: true });

if (srcFiles.length === 0 && srcFolders.length === 0) {
  console.log('⚠️ No files found in the src directory.')
  const answer = await rl.question('Do you want to remove all files in dist? (y/N): ');
  if (answer.toLowerCase() === 'y') {
    console.log('Removing all files in dist directory...');
    // Check if the dist directory exists
    const distFiles = await fg('dist/**/*', { onlyFiles: true });
    await Promise.all(
      distFiles.map(file => fs.rm(file, { force: true }))
    );
    console.log('✅ All files in dist directory removed.');
    rl.close();
    process.exit(0);
  } else {
    console.log('❌ Operation canceled.');
    rl.close();
    process.exit(0);
  }  
};

// generate lists of files and folders from src to dist folder
// src -> dist 
const validDistFiles = srcFiles.flatMap((f) => {
  const distBase = f.replace(/^src/, 'dist').replace(/\.ts$/, '');
  return [`${distBase}.js`, `${distBase}.js.map`];
});
const validDistFolders = srcFolders.map(f => f.replace(/^src/, 'dist'));

// delete the files which were deleted in src from dist folder
const distFiles = await fg('dist/**/*', { onlyFiles: true });

for (const file of distFiles) {
  if (!validDistFiles.includes(file)) {
    await fs.rm(file, { force: true });
    console.log(`🗑️  Removed obsolete file: ${file}`);
  }
};

// delete the folders which were deleted in src from dist folder
const distFolders = await fg('dist/**/', { onlyDirectories: true });
for (const folder of distFolders) {
  if (!validDistFolders.includes(folder)) {
    await fs.rm(folder, { recursive: true, force: true });
    console.log(`🗑️  Removed obsolete folder: ${folder}`);
  }
};

// build ts files
const entryPoints = await fg('src/**/*.ts');

const buildts = await build({
  entryPoints,
  outdir: 'dist',
  bundle: false,
  platform: 'node',
  target: ['ESNext'],
  format: 'esm',
  logLevel: 'info',
  metafile: true,
});

for (const file in buildts.metafile.outputs) {
  console.log(`📦 Built file: ${file}`);
};

// add empty folders from src to dist folder
for (const folder of srcFolders) {
  const distFolder = folder.replace(/^src/, 'dist');

  try{
    await fs.access(distFolder);
  }catch{
    // Create the directory in dist if it does not exist
    await fs.mkdir(distFolder, { recursive: true });
    console.log(`📁 Created folder: ${distFolder}`);
  };
};

console.log('✅ Build script completed.');
process.exit(0);