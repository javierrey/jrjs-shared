// lib/.../sys.js, NodeJS
// _@ts-check

/**
@typedef {import('../core/core.js').PlainObject} PlainObject;
@typedef {typeof globalThis & NodeJS.Global} SysContext;
*/

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { spawn } from 'node:child_process';

import {
  log,
} from '../core/core.js';

export * as fs from 'node:fs';
export const fsP = fs.promises;
export * from '../core/core.js';

/** System primary config. */
export const sysConfig = /** @type {PlainObject} */ ({});

/** Process Arguments functionality: */

export const hasNamedArgument = (name) => !!process.argv.slice(2).find((a) => new RegExp(`^-{0,2}${name}$`).test(a));

export const getNamedArgumentValue = (name) => {
  const arg = process.argv.slice(2).find((a) => new RegExp(`^-{0,2}${name}=`).test(a) && !name.includes('='));
  return arg ? arg.slice(arg.indexOf('=') + 1).replace(/^"|"$/g, '') : undefined;
};

/** Test functionality: */

export const assertError = (a, b) => {
  try { assert.deepStrictEqual(a, b); } catch (error) { return error; }
  return null;
};

export const testStatus = { tests: 0, errors: 0 };

export const resetTests = () => { testStatus.tests = 0; testStatus.errors = 0; };

export const test = (desc, a, b) => {
  const error = assertError(a, b); testStatus.tests++; error && testStatus.errors++;
  const logArgs = [`TEST ${testStatus.tests} ${error ? 'KO' : 'OK'} `, desc];
  error ? log.error(...logArgs, error.message || error) : log.info(...logArgs);
  return !error;
};

/* * */

/**
Returns a file `stat` properties synchronously, or null if the file pathname does not exist.
`stat` methods: `isFile, isDirectory, isBlockDevice, isCharacterDevice, isFIFO, isSocket`.
*/
export const fileStat = (filename) => fs.existsSync(filename) ? fs.statSync(filename) : null;

/** Returns 1 if a file pathname is a file, -1 if it is a directory or other type, 0 if does not exist. */
export const fileExists = (filename) => !fs.existsSync(filename) ? 0 : fs.statSync(filename).isFile() ? 1 : -1;

/**
Returns the file size if a file pathname is a file (size >= 0),
-1 if it is a directory, -2 for other types and NaN if does not exist.
*/
export const fileSize = (filename) => {
  if (!fs.existsSync(filename)) { return NaN; }
  const stat = fs.statSync(filename);
  return stat.isFile() ? stat.size : stat.isDirectory() ? -1 : -2;
};

/** Returns the core path of a given path string. */
export const getPathCore = (path) => '/' + path.replace(/\\/g, '/').replace(/^(\.*\/)+/, '').replace(/\/$/, '') + '/';

/** Copy file asynchronously. */
export const copyFile = (file, orig, dest) => {
  file = file.replace(/\\/g, '/');
  const target = file.replace(getPathCore(orig), getPathCore(dest));
  fs.mkdirSync(target.slice(0, target.lastIndexOf('/') + 1), { recursive: true });
  fsP.copyFile(file, target);
};

/**
Iterable generator of all file paths in a folder recursively.
Usage: `for await (const file of getAllFiles('./folder')) { ... }`
*/
export const getAllFiles = async function* (folder) {
  folder = (folder.replace(/\\/g, '/') + '/').replace(/\/\/+/g, '/');
  const items = await fsP.readdir(folder, { withFileTypes: true });
  for (const item of items) {
    const path = (folder + item.name).replace(/\/\/+/g, '/');
    if (item.isDirectory()) {
      yield* getAllFiles(path);
    } else if (item.isSymbolicLink()) {
      const stat = fs.statSync(path);
      if (stat.isDirectory()) { yield* getAllFiles(path);
      } else if (stat.isFile()) { yield path; }
    } else if (item.isFile()) { yield path; }
  }
};

/** Removes a directory. */
export const removeDir = (dir) => fs.rmSync(dir, { recursive: true, force: true });

/** Copy directory asynchronously. */
export const copyDir = async (orig, dest) => {
  log.info(`copyDir: "${orig}" > "${dest}"`);
  removeDir(dest);
  for await (const file of getAllFiles(orig)) {
    copyFile(file, orig, dest);
  }
};

/**
Reads a file content asynchronously.
Returns a file object with `url`, `content` and `error` properties.
*/
export const readFile = async (url, encoding = null) => {
  /** @type {Record<string, unknown>} */ const file = { url, content: null, error: null };
  if (fileExists(url) === 1) {
    await fsP.readFile(url, { encoding })
      .then((content) => { file.content = content; })
      .catch((error) => { file.error = error; });
  } else { file.error = { message: `not a file "${url}"` }; }
  return file;
};

/** Creates a file object with a readable stream. */
export const readStream = async (url, encoding) => {
  /** @type {Record<string, unknown>} */ const file = {
    url, type: '', size: fileSize(url), content: null, error: null,
  };
  if (file.size > 0) {
    const readable = fs.createReadStream(url, { encoding }), chunks = [];
    await new Promise((resolve) => {
      readable.on('error', (error) => { file.error = error; resolve(file); });
      readable.on('data', (chunk) => { chunks.push(chunk); });
      readable.on('end', () => { file.content = Buffer.concat(chunks); resolve(file); }); // @hide for streaming
    });
  } else if (Object.is(file.size, 0)) { file.content = Buffer.alloc(0);
  } else { file.error = { message: `not a content file "${url}"` }; }
  return file;
};

/** Create a readable and writable stream for copying a file. */
export const copyFileStream = (filePath, uploadPath) => {
  const readable = fs.createReadStream(filePath);
  const writable = fs.createWriteStream(uploadPath);
  return readable.pipe(writable);
};

/** Create a symbolic link to a directory. */
export const symlinkDir = (source, target) => {
  source = path.resolve(source); target = path.resolve(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.rmSync(target, { recursive: true, force: true });
  fs.symlink(source, target, 'dir', (err) => err && log.error('symlink error', err));
};

/* * */

/**
Splits command line arguments, including the leading command.
Usage: `const [cmd, ...args] = splitCommandArguments('ping 8.8.8.8')`
*/
// export const splitCommandArguments = (input) => {
//   const args = [], re = /"[^"]*"|'[^']*'|\S+/g; let match;
//   while (match = re.exec(input)) { args.push(match[1] ?? match[2] ?? match[3]); }
//   return args;
// };
export const splitCommandArguments = (input) => 
  input.split(/["']?\s+["']?/).map((a) => a.replace(/^["']|["']$/g, '')).filter((a) => a.trim());

/**
Promised wrap of `child_process.spawn`.
Example: `const { stdout } = await spawnProm('ping', ['8.8.8.8'])`
*/
export const spawnProm = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    let stdout = '', stderr = '', error = null;
    const progress = opts.progress; delete opts.progress;
    const cp = spawn(cmd, args, opts);
    cp.stdout.on('data', (data) => {
      data = data.toString(); stdout += data; progress?.(data, null);
    });
    cp.stderr.on('data', (data) => {
      data = data.toString(); stderr += data; progress?.(null, data);
    });
    cp.on('error', (err) => { error = err; });
    cp.on('close', (code) => { resolve({ stdout, stderr, error, code }); });
  });

/**
Calls `spawnProm` from a full `exec` command line.
Example: `const { stdout } = await execProm('ping 8.8.8.8')`
*/
export const execProm = async (cmdLine, opts) => {
  const statements = cmdLine.split(/ [&|]+ /); let ret;
  for (const statement of statements) {
    const [cmd, ...args] = splitCommandArguments(statement); // console.log(` execProm ${cmd}`, args); // eslint-disable-line
    ret = await spawnProm(cmd, args, opts);
  }
  return ret;
};

/* * */
// var { stdout } = await spawnProm('ping', ['8.8.8.8']);
// var { stdout } = await execProm('ping 8.8.8.8', { progress: (out, err) => console.log(`progress:`, out, err) });
// console.log(` !!!!!!!!!`, stdout); // eslint-disable-line
