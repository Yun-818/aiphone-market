#!/usr/bin/env node
/* Issue 投稿机器人：从 issue 正文里取出包链接 → 校验 → 写入 packs/
   由 .github/workflows/inbox.yml 调用，读完 issue 就自动上架。 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const PACK_DIR = 'packs';
const MAX_BYTES = 5 * 1024 * 1024;
const KINDS = new Set([
  'theme', 'chat-theme', 'story-theme',
  'character', 'lorebook', 'preset', 'regex'
]);

function say(message) {
  console.log('[inbox] ' + message);
}

function bye(message, code) {
  console.error('[inbox] ' + message);
  process.exit(code || 0);
}

/** 从 issue 正文里抓第一个像包文件的链接（GitHub 附件 或 直链 .json） */
function pickUrl(body) {
  const urls = String(body || '').match(/https?:\/\/[^\s)\]>"']+/g) || [];
  return urls.find((url) => /\.json($|\?)/i.test(url) || /user-attachments/i.test(url)) || '';
}

function safeName(name) {
  return String(name || 'pack').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60) || 'pack';
}

async function main() {
  const body = process.env.ISSUE_BODY || '';
  const url = pickUrl(body);
  if (!url) bye('issue 里没有找到包文件链接', 2);

  say('下载 ' + url);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) bye('下载失败：HTTP ' + res.status, 3);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) bye('包超过 5MB 上限（' + buf.length + ' 字节）', 4);

  const text = buf.toString('utf8');
  let pack;
  try {
    pack = JSON.parse(text);
  } catch (err) {
    bye('不是合法的 JSON 文件', 5);
  }

  const meta = pack && pack.meta;
  if (!pack || pack.format !== 'aiphone-pack') bye('不是集市包（format 不对）', 5);
  if (!meta || !meta.name) bye('包缺少 meta.name', 5);
  if (!KINDS.has(pack.kind)) bye('kind 不合法：' + pack.kind, 5);

  const hash = createHash('sha256').update(text, 'utf8').digest('hex');
  await mkdir(PACK_DIR, { recursive: true });

  const files = (await readdir(PACK_DIR)).filter((name) => name.endsWith('.json'));
  for (const name of files) {
    const old = await readFile(join(PACK_DIR, name), 'utf8');
    const oldHash = createHash('sha256').update(old, 'utf8').digest('hex');
    if (oldHash === hash) bye('这个包已经在库里了（' + name + '），无需重复提交', 6);
  }

  const fileName = safeName(meta.name) + '.json';
  await writeFile(join(PACK_DIR, fileName), text, 'utf8');
  say('已写入 ' + join(PACK_DIR, fileName));
  await writeFile('.inbox-result', meta.name + ' / ' + pack.kind, 'utf8');
}

main().catch((err) => bye(err && err.message, 1));
