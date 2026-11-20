// gta6-clipper-01 entry program (Node 22, standard library only).
//
// The entry itself is a public YouTube video: an AI agent cut a GTA 6
// moment into a vertical clip that pitches make.fun, and this repository
// hands in the video's address. The house reads VIDEO.json from /output,
// so this program's one job is to put it there - after checking that the
// file really does hold a YouTube video address of the shape the gate
// accepts, so a malformed entry fails loudly here instead of silently
// scoring zero at the house.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's video_file check caps VIDEO.json at 16384 bytes; a bigger
// file is invalid at the house however good its URL is, so refuse it here.
const MAX_VIDEO_JSON_BYTES = 16384;

const VIDEO_ID = '[A-Za-z0-9_-]{11}';
const YOUTUBE_URL = new RegExp(
  `^https://(?:www\\.|m\\.)?(?:youtube\\.com/(?:shorts/|watch\\?v=)|youtu\\.be/)(${VIDEO_ID})(?:[?#].*)?$`,
);

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const source = join(BOT_DIR, 'VIDEO.json');
let raw: Buffer;
try {
  raw = readFileSync(source);
} catch (err) {
  fail(`VIDEO.json could not be read: ${(err as Error).message}`);
}
if (raw.byteLength > MAX_VIDEO_JSON_BYTES) {
  fail(
    `VIDEO.json is ${raw.byteLength} bytes; the gate accepts at most ` +
      `${MAX_VIDEO_JSON_BYTES}`,
  );
}
let parsed: unknown;
try {
  parsed = JSON.parse(raw.toString('utf8'));
} catch (err) {
  fail(`VIDEO.json could not be parsed: ${(err as Error).message}`);
}

const url = (parsed as { url?: unknown })?.url;
if (typeof url !== 'string' || !YOUTUBE_URL.test(url)) {
  fail(
    'VIDEO.json must hold {"url": "https://www.youtube.com/shorts/<id>"} ' +
      'with an 11-character video id',
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
// Write the bytes exactly as read, via a scratch name renamed into place,
// so a reader of /output never catches a half-written VIDEO.json.
const target = join(OUTPUT_DIR, 'VIDEO.json');
writeFileSync(`${target}.tmp`, raw);
renameSync(`${target}.tmp`, target);
console.log(
  `VIDEO.json copied to ${OUTPUT_DIR} (video id ${YOUTUBE_URL.exec(url)![1]})`,
);
