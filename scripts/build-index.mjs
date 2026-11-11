#!/usr/bin/env node
/* 扫 packs/ 目录，重建 index.json
   包文件自带 meta，所以不需要额外的元数据文件。
   用法：node scripts/build-index.mjs  （在仓库根目录执行） */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const PACK_DIR = 'packs';
const OUT_FILE = 'index.json';
const KINDS = new Set([
  'theme', 'chat-theme', 'story-theme',
  'character', 'lorebook', 'preset', 'regex'
]);

function fail(message) {
  console.error('[build-index] ' + message);
  process.exitCode = 1;
}

async function main() {
  let files = [];
  try {
    files = await readdir(PACK_DIR);
  } catch (err) {
    fail('找不到 ' + PACK_DIR + ' 目录');
    return;
  }

  const items = [];
  const names = files.filter((name) => name.endsWith('.json')).sort();

  for (const name of names) {
    const full = join(PACK_DIR, name);
    const text = await readFile(full, 'utf8');

    let pack;
    try {
      pack = JSON.parse(text);
    } catch (err) {
      fail(name + ' 不是合法 JSON，已跳过');
      continue;
    }

    const meta = pack && pack.meta;
    if (!meta || !meta.name || !KINDS.has(pack.kind)) {
      fail(name + ' 缺少 meta.name 或 kind 不合法，已跳过');
      continue;
    }

    items.push({
      id: name.replace(/\.json$/i, ''),
      kind: pack.kind,
      name: meta.name,
      author: meta.author || '',
      desc: meta.desc || '',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      packVersion: meta.packVersion || '1.0.0',
      url: './' + PACK_DIR + '/' + encodeURI(name),
      size: Buffer.byteLength(text, 'utf8'),
      hash: 'sha256:' + createHash('sha256').update(text, 'utf8').digest('hex')
    });
  }

  const index = {
    format: 'aiphone-market-index',
    version: 1,
    name: '公共集市',
    items
  };

  await writeFile(OUT_FILE, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log('[build-index] 已写入 ' + OUT_FILE + '，共 ' + items.length + ' 个包');
}

main().catch((err) => fail(err && err.message));
