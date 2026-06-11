// prebuild.js
// @ts-check

import {
  getNamedArgumentValue, hasNamedArgument, copyDir, symlinkDir,
} from '../../../lib/sys/sys.js';

const origBase = './node_modules/jrjs-shared/packages';
const destBase = './packages';

const method = hasNamedArgument('symlink') ? symlinkDir : copyDir; // copy, symlink

const importsCore = getNamedArgumentValue('imports-core')?.split(',').filter(Boolean) ?? [];
const importsView = getNamedArgumentValue('imports-view')?.split(',').filter(Boolean) ?? [];

method(origBase + '/lib/core', destBase + '/view/lib/core');
method(origBase + '/lib/view', destBase + '/view/lib/view');
method(origBase + '/utils/core', destBase + '/view/utils/core');
method(origBase + '/utils/view', destBase + '/view/utils/view');

importsCore.forEach((folder) => {
  method(origBase + '/imports/core/' + folder, destBase + '/view/imports/core/' + folder);
});

importsView.forEach((folder) => {
  method(origBase + '/imports/view/' + folder, destBase + '/view/imports/view/' + folder);
});
