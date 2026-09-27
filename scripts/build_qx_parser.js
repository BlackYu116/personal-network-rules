#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const vendor = fs.readFileSync(path.join(root, 'qx/vendor/js-yaml-5.4.2.min.js'), 'utf8');
const meta = JSON.parse(fs.readFileSync(path.join(root, 'qx/vendor/SOURCE.json'), 'utf8'));
if (crypto.createHash('sha256').update(vendor).digest('hex') !== meta.browser_sha256) throw Error('Vendored library hash mismatch');
const banner = '/* Personal QX resource parser. Generated; edit parser-core.js.\n * js-yaml 5.4.2 (MIT), license and pinned source in qx/vendor/.\n * No runtime dependencies or network calls. */\n';
const licenses = ['qx/LICENSE','qx/vendor/js-yaml.LICENSE'].map(p=>'/*\n'+fs.readFileSync(path.join(root,p),'utf8')+'*/\n').join('');
const result = banner + licenses + vendor.replace(/\/\/# sourceMappingURL=.*$/m, '') + '\n' + fs.readFileSync(path.join(root, 'qx/parser-core.js'), 'utf8');
const target = path.join(root, 'qx/resource-parser.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== result) throw Error('Run node scripts/build_qx_parser.js and commit the generated parser');
  console.log('Parser bundle is reproducible; vendor SHA256 verified');
} else { fs.writeFileSync(target, result); console.log('Built qx/resource-parser.js'); }
