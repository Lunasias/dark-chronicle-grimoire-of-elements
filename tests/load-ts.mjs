import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire = createRequire(import.meta.url);
export function loadTS(filename, globals = {}, cache = new Map()) {
  const full = path.resolve(filename);
  if (cache.has(full)) return cache.get(full).exports;
  const mod = { exports: {} };
  cache.set(full, mod);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = (id) => {
    if (!id.startsWith('.')) return nativeRequire(id);
    let target = path.resolve(path.dirname(full), id);
    if (!path.extname(target)) target += '.ts';
    return loadTS(target, globals, cache);
  };
  vm.runInNewContext(code, { exports: mod.exports, module: mod, require, console, setTimeout, clearTimeout, setInterval, clearInterval, structuredClone, ...globals }, { filename: full });
  return mod.exports;
}
