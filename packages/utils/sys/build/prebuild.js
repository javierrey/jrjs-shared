// _@ts-check // prebuild.js

import { copyDir, symlinkDir } from '../../../lib/sys/sys.js';

const argv = process.argv.slice(2);

const base = './packages';
const method = argv[0] === 'symlink' ? symlinkDir : copyDir; // copy, symlink

method(base + '/lib/core', base + '/sys/lib/core');
method(base + '/lib/sys', base + '/sys/lib/sys');
method(base + '/lib/core', base + '/view/lib/core');
method(base + '/lib/view', base + '/view/lib/view');
