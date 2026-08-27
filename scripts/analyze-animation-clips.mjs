import fs from 'node:fs';
import crypto from 'node:crypto';

const file = process.argv[2];
if (!file) throw new Error('usage: node scripts/analyze-animation-clips.mjs FILE.glb');
const data = fs.readFileSync(file);
let offset = 12, json, binary;
while (offset < data.length) {
  const length = data.readUInt32LE(offset), type = data.toString('ascii', offset + 4, offset + 8);
  if (type === 'JSON') json = JSON.parse(data.subarray(offset + 8, offset + 8 + length).toString('utf8').replace(/\0+$/, ''));
  if (type === 'BIN\0') binary = data.subarray(offset + 8, offset + 8 + length);
  offset += 8 + length;
}
if (!json) throw new Error('JSON chunkがありません');
const accessors = json.accessors ?? [], nodes = json.nodes ?? [];
const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const typeComponents = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
function accessorBytes(index) {
  const accessor = accessors[index], view = json.bufferViews?.[accessor?.bufferView];
  if (!accessor || !view || !binary) return Buffer.alloc(0);
  const length = accessor.count * componentBytes[accessor.componentType] * typeComponents[accessor.type];
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return binary.subarray(start, start + length);
}
function readFloatAccessor(index) {
  const accessor = accessors[index], view = json.bufferViews?.[accessor?.bufferView];
  if (!accessor || !view || !binary || accessor.componentType !== 5126) return [];
  const components = typeComponents[accessor.type];
  const stride = view.byteStride ?? components * 4;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count }, (_, item) =>
    Array.from({ length: components }, (_, component) => binary.readFloatLE(start + item * stride + component * 4)),
  );
}
const clips = (json.animations ?? []).map((animation) => {
  const inputs = (animation.samplers ?? []).map((sampler) => accessors[sampler.input]).filter(Boolean);
  const duration = Math.max(0, ...inputs.map((input) => input.max?.[0] ?? 0));
  const inputIndices = [...new Set((animation.samplers ?? []).map((sampler) => sampler.input))];
  const timeSignatures = inputIndices.map((index) => ({ count: accessors[index]?.count ?? 0, hash: crypto.createHash('sha1').update(accessorBytes(index)).digest('hex').slice(0, 12) }));
  const motionHash = crypto.createHash('sha1');
  for (const sampler of animation.samplers ?? []) motionHash.update(accessorBytes(sampler.output));
  const tracks = (animation.channels ?? []).map((channel) => {
    const target = channel.target ?? {};
    return `${nodes[target.node]?.name ?? target.node ?? '?'}:${target.path ?? '?'}`;
  });
  const translationMotion = (animation.channels ?? []).flatMap((channel) => {
    if (channel.target?.path !== 'translation') return [];
    const sampler = animation.samplers?.[channel.sampler];
    const values = readFloatAccessor(sampler?.output);
    if (values.length < 2) return [];
    const [originX, , originZ] = values[0];
    const maxHorizontal = Math.max(...values.map(([x, , z]) => Math.hypot(x - originX, z - originZ)));
    return [{ node: nodes[channel.target.node]?.name ?? channel.target.node ?? '?', maxHorizontal }];
  }).sort((a, b) => b.maxHorizontal - a.maxHorizontal);
  return { name: animation.name ?? '(unnamed)', duration, trackCount: tracks.length, motionHash: motionHash.digest('hex').slice(0, 16), timeSignatures, maxHorizontalMotion: translationMotion[0] ?? null, positionTracks: tracks.filter((track) => track.endsWith(':translation')) };
});
const compact = process.argv.includes('--compact');
process.stdout.write(`${JSON.stringify(compact ? {
  file,
  clips: clips.map(({ name, duration, maxHorizontalMotion }) => ({ name, duration, maxHorizontalMotion })),
} : { file, clips }, null, 2)}\n`);
