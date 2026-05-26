import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const outputDir = 'public';
const files = [
  ['index.html', 'index.html'],
  ['styles.css', 'styles.css'],
  ['PRIVACY-ENGINEERING.png', 'PRIVACY-ENGINEERING.png'],
  ['dist/src/lab-runtime.js', 'dist/src/lab-runtime.js']
] as const;

rmSync(outputDir, { recursive: true, force: true });

for (const [source, target] of files) {
  const destination = join(outputDir, target);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}
