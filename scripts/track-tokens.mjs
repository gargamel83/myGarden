#!/usr/bin/env node
import { encoding_for_model } from 'tiktoken';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, '..', '.token-usage.json');

const enc = encoding_for_model('gpt-4');

function count(text) {
  return enc.encode(text).length;
}

const mode = process.argv[2];

if (mode === 'add') {
  const label = process.argv[3] || 'unknown';
  const input = readFileSync('/dev/stdin', 'utf-8').trim();
  const tokens = count(input);
  let data = { entries: [], total: 0 };
  if (existsSync(LOG_FILE)) {
    data = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
  }
  data.entries.push({ label, tokens, timestamp: new Date().toISOString() });
  data.total = data.entries.reduce((s, e) => s + e.tokens, 0);
  writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
  console.log(`[tokens] ${label}: ${tokens} | total: ${data.total}`);
} else if (mode === 'summary') {
  if (existsSync(LOG_FILE)) {
    const data = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    for (const e of data.entries) {
      console.log(`  ${e.label}: ${e.tokens} tokens (${e.timestamp})`);
    }
    console.log(`\nTotal: ${data.total} tokens`);
  } else {
    console.log('No data yet');
  }
} else if (mode === 'md') {
  if (existsSync(LOG_FILE)) {
    const data = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    let md = `# Token Usage — Session ${new Date().toISOString().slice(0, 10)}\n\n`;
    md += `| # | Étape | Tokens | Horaire |\n|--:|-------|-------:|--------:|\n`;
    data.entries.forEach((e, i) => {
      md += `| ${i + 1} | ${e.label} | ${e.tokens} | ${e.timestamp} |\n`;
    });
    md += `| | **Total** | **${data.total}** | |\n`;
    console.log(md);
  }
}

enc.free();
