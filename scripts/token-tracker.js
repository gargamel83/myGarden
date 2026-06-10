#!/usr/bin/env node
import { encoding_for_model } from 'tiktoken';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, '..', '.token-usage.json');

const enc = encoding_for_model('gpt-4');

const args = process.argv.slice(2);
const mode = args[0];

function countTokens(text) {
  return enc.encode(text).length;
}

if (mode === 'log') {
  const label = args[1] || 'unnamed';
  const input = readFileSync('/dev/stdin', 'utf-8');
  const tokens = countTokens(input);

  let data = { entries: [], total: 0 };
  if (existsSync(LOG_FILE)) {
    data = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
  }

  data.entries.push({ label, tokens, timestamp: new Date().toISOString() });
  data.total = data.entries.reduce((s, e) => s + e.tokens, 0);
  writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));

  console.log(`[tokens] ${label}: ${tokens} tokens | total: ${data.total}`);
} else if (mode === 'total') {
  if (existsSync(LOG_FILE)) {
    const data = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    console.log(`Total tokens: ${data.total}`);
    console.log(`Entries: ${data.entries.length}`);
    data.entries.forEach(e => console.log(`  - ${e.label}: ${e.tokens}`));
  } else {
    console.log('No token data yet');
  }
} else if (mode === 'report') {
  if (existsSync(LOG_FILE)) {
    const data = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    const markdown = `# Token Usage Report\n\n**Total tokens:** ${data.total}\n**Entries:** ${data.entries.length}\n\n| Label | Tokens | Timestamp |\n|-------|--------|-----------|\n${data.entries.map(e => `| ${e.label} | ${e.tokens} | ${e.timestamp} |`).join('\n')}\n`;
    console.log(markdown);
  } else {
    console.log('No token data yet');
  }
} else {
  console.log('Usage: token-tracker.js [log|total|report] [label]');
}

enc.free();
