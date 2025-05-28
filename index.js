#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import path from 'path';
const __dirname = import.meta.dirname

const execAsync = promisify(exec);
//install dependencies
try{
  const isYarn = await fs.access('yarn.lock').then(() => true).catch(() => false);
  const isPnpm = await fs.access('pnpm-lock.yaml').then(() => true).catch(() => false);
  const installCmd = isPnpm
  ? 'pnpm add -D typescript ts-node @types/node fast-glob esbuild'
  : isYarn
    ? 'yarn add -D typescript ts-node @types/node fast-glob esbuild'
    : 'npm install -D typescript ts-node @types/node fast-glob esbuild';

  const { stdout, stderr } = await execAsync(installCmd);
  console.log('Dependencies installed successfully:', stdout);
  if(stderr){
    console.error('Error during installation:', stderr);
  };
} catch (error) {
  console.error('❌ Failed to install dependencies:', error);
  process.exit(1);
};


// Check if package.json exists
const pkgpath = path.join(process.cwd(), 'package.json')
try {
  await fs.access(pkgpath);
  console.log('package.json exists, proceeding with script execution.');
  // Read and parse package.json
  const content = await fs.readFile(pkgpath, 'utf8');
  const pkg = JSON.parse(content);
  pkg.type = 'module';
  pkg.scripts = {
    ...pkg.scripts,
    build: "node build.js",
    start: "node dist/index.js"
  }

  // Add or update the package.json properties
  await fs.writeFile(pkgpath, JSON.stringify(pkg, null, 2));
  console.log('✅ package.json updated.');
}
catch (error) {     
  console.error('❌ package.json not found:', error);
  process.exit(1);
};

// Copy the template files
try{
  const templatePath = path.join(__dirname, 'template');

  await fs.copyFile(path.join(templatePath, 'build.js'), path.join(process.cwd(), 'build.js'));
  await fs.copyFile(path.join(templatePath, 'tsconfig.json'), path.join(process.cwd(), 'tsconfig.json'));
  console.log('Files "build.js" and "tsconfig.json" copied successfully');
} catch (error) {
  console.error('❌ Failed to copy files:', error);
  process.exit(1);
};

// Create the src directory if it does not exist
try {
  const srcPath = path.join(process.cwd(), 'src');
  // Check if the src directory exists
  await fs.access(srcPath);
  console.log('✅ src directory exists.');
}catch{
  // Create the src directory if it does not exist
  console.log('The src directory does not exist, Creating it now...');
  await fs.mkdir(path.join(process.cwd(), 'src'), { recursive: true });
  console.log('✅ src directory created successfully. You can now add your source files.');
};

console.log('✅ All operations completed successfully!');
process.exit(0);