function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

async function sha256(bytes: Uint8Array) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

function compareBytes(left: Uint8Array, right: Uint8Array) {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return left.length - right.length;
}

export async function deterministicScore(left: ArrayBuffer, right: ArrayBuffer) {
  const imageHashes = await Promise.all([
    sha256(new Uint8Array(left)),
    sha256(new Uint8Array(right)),
  ]);
  imageHashes.sort(compareBytes);

  const pair = new Uint8Array(imageHashes[0].length + imageHashes[1].length);
  pair.set(imageHashes[0]);
  pair.set(imageHashes[1], imageHashes[0].length);
  const pairHash = await sha256(pair);
  const seed = new DataView(pairHash.buffer, pairHash.byteOffset, pairHash.byteLength).getUint32(0);
  return Math.floor(mulberry32(seed)() * 101);
}
