import fs from 'node:fs';
import path from 'node:path';
import { parseSync, visitorKeys } from 'oxc-parser';

let failures = 0;
let count = 0;

function check(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      check(file);
      continue;
    }

    if (!/\.tsx?$/.test(file)) {
      continue;
    }

    const text = fs.readFileSync(file, 'utf8');
    const parsed = parseSync(file, text);

    if (parsed.errors.length) {
      throw new Error(`Cannot parse ${file}`);
    }

    const visit = (node) => {
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        count++;
        const lines = text.slice(node.start, node.end).split('\n').length;

        if (lines > 200) {
          console.error(
            `${file}: ${node.id?.name ?? '(anonymous)'} has ${lines} lines (maximum: 200)`,
          );
          failures++;
        }
      }

      for (const key of visitorKeys[node.type] ?? []) {
        const value = node[key];

        if (Array.isArray(value)) {
          value.filter(Boolean).forEach(visit);
        } else if (value) {
          visit(value);
        }
      }
    };
    visit(parsed.program);
  }
}

check('src');
check('tests');
console.log(`Checked ${count} classes; maximum 200 lines per class.`);
process.exitCode = failures ? 1 : 0;
