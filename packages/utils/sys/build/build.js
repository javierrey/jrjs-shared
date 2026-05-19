// _@ts-check // build.js

import { copyDir } from '../../../lib/sys/sys.js';
import { configMinify, runMinify } from './minify-copy.js';

const argv = process.argv.slice(2);

const base = './';
const dest = argv[0] ?? 'view'; // view, sys
const method = argv[1] === 'minify' ? runMinify : copyDir; // copy, minify

method === runMinify && configMinify(argv[2]);

method(base + 'packages/' + dest, base + 'dist/' + dest);
