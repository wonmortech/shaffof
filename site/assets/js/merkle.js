// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

/* Shaffof demo Merkle core.
   Hashing follows RFC 9162 section 2.1: leaf = SHA-256(0x00 || entry), node = SHA-256(0x01 || left || right),
   the empty tree is SHA-256 of nothing, and a tree of n leaves splits at the largest power of two smaller
   than n (no duplicated last leaf). An entry is encoded as the JSON array [id, date, cat, dir, amount], so
   every field the ledger shows, the direction included, is bound to the root and no two entries share an
   encoding. Runs entirely in the browser with WebCrypto; nothing is sent anywhere.
   Works as a classic script (sets globalThis.ShaffofMerkle) and as a CommonJS module for the Node tests. */
(function (root) {
  'use strict';
  var enc = new TextEncoder();
  var subtle = root.crypto && root.crypto.subtle;
  var HEX64 = /^[0-9a-f]{64}$/;

  function concat(parts) {
    var len = 0, i, out, off = 0;
    for (i = 0; i < parts.length; i++) len += parts[i].length;
    out = new Uint8Array(len);
    for (i = 0; i < parts.length; i++) { out.set(parts[i], off); off += parts[i].length; }
    return out;
  }
  function sha256(bytes) {
    return subtle.digest('SHA-256', bytes).then(function (b) { return new Uint8Array(b); });
  }
  function hex(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16);
    return s;
  }
  function isHash(h) { return h instanceof Uint8Array && h.length === 32; }

  /* Canonical, injective entry encoding. Rejects anything the demo ledger cannot hold. */
  function serialize(e) {
    if (!e || typeof e !== 'object') throw new TypeError('entry must be an object');
    ['id', 'date', 'cat', 'dir'].forEach(function (k) {
      if (typeof e[k] !== 'string') throw new TypeError('entry.' + k + ' must be a string');
    });
    if (!Number.isSafeInteger(e.amount) || e.amount < 0) throw new RangeError('entry.amount must be a non-negative safe integer');
    return JSON.stringify([e.id, e.date, e.cat, e.dir, e.amount]);
  }
  function encode(entry) { return enc.encode(serialize(entry)); }
  function leafHashBytes(data) { return sha256(concat([new Uint8Array([0]), data])); }
  function nodeHash(l, r) { return sha256(concat([new Uint8Array([1]), l, r])); }
  function split(n) { var k = 1; while (k * 2 < n) k *= 2; return k; }

  /* Builds the whole tree. Returns {hash, lo, hi, left, right} nodes; leaves carry leaf: true. */
  function buildNode(leaves, lo, hi) {
    var n = hi - lo;
    if (n === 1) return Promise.resolve({ hash: leaves[lo], lo: lo, hi: hi, leaf: true });
    var k = split(n);
    return Promise.all([buildNode(leaves, lo, lo + k), buildNode(leaves, lo + k, hi)]).then(function (lr) {
      return nodeHash(lr[0].hash, lr[1].hash).then(function (h) {
        return { hash: h, lo: lo, hi: hi, left: lr[0], right: lr[1] };
      });
    });
  }
  /* Tree over raw leaf data (one Uint8Array per leaf). */
  function buildBytes(datas) {
    return Promise.all(datas.map(leafHashBytes)).then(function (leaves) {
      if (!leaves.length) {
        return sha256(new Uint8Array(0)).then(function (h) { return { leaves: leaves, root: { hash: h, lo: 0, hi: 0, empty: true } }; });
      }
      return buildNode(leaves, 0, leaves.length).then(function (r) { return { leaves: leaves, root: r }; });
    });
  }
  function build(entries) {
    var datas;
    try { datas = entries.map(encode); } catch (err) { return Promise.reject(err); }
    return buildBytes(datas);
  }
  /* RFC 9162 inclusion path for leaf m: list of {hash, side} from the bottom up.
     side 'L' means the sibling sits on the left. */
  function pathFrom(node, m) {
    if (node.leaf) return [];
    if (m < node.left.hi) return pathFrom(node.left, m).concat([{ hash: node.right.hash, side: 'R', node: node.right }]);
    return pathFrom(node.right, m).concat([{ hash: node.left.hash, side: 'L', node: node.left }]);
  }
  function path(node, m) {
    if (!node || node.empty || !Number.isInteger(m) || m < node.lo || m >= node.hi) throw new RangeError('leaf index out of range');
    return pathFrom(node, m);
  }
  /* Verifier side: knows only the leaf data, the path and the published root.
     A malformed proof or root is rejected rather than half-checked. */
  function verifyBytes(data, proof, rootHex) {
    if (!Array.isArray(proof)) return Promise.reject(new TypeError('proof must be an array'));
    for (var i = 0; i < proof.length; i++) {
      var p = proof[i];
      if (!p || !isHash(p.hash) || (p.side !== 'L' && p.side !== 'R')) return Promise.reject(new TypeError('malformed proof step ' + i));
    }
    var want = typeof rootHex === 'string' ? rootHex.toLowerCase() : '';
    if (!HEX64.test(want)) return Promise.reject(new TypeError('root must be 64 hex characters'));
    return leafHashBytes(data).then(function (h) {
      var steps = [{ hash: hex(h) }];
      var chain = Promise.resolve(h);
      proof.forEach(function (s) {
        chain = chain.then(function (cur) {
          return (s.side === 'L' ? nodeHash(s.hash, cur) : nodeHash(cur, s.hash)).then(function (next) {
            steps.push({ sibling: hex(s.hash), side: s.side, hash: hex(next) });
            return next;
          });
        });
      });
      return chain.then(function (r) { return { ok: hex(r) === want, root: hex(r), steps: steps }; });
    });
  }
  function verify(entry, proof, rootHex) {
    var data;
    try { data = encode(entry); } catch (err) { return Promise.reject(err); }
    return verifyBytes(data, proof, rootHex);
  }

  /* Obviously fictional sample ledger of a fictional fund. Amounts in so'm. */
  var SAMPLE = [
    { id: 'K-0001', date: '2026-10-02', cat: 'donation', dir: 'in', amount: 250000 },
    { id: 'K-0002', date: '2026-10-05', cat: 'donation', dir: 'in', amount: 1200000 },
    { id: 'C-0001', date: '2026-10-08', cat: 'food', dir: 'out', amount: 640000 },
    { id: 'K-0003', date: '2026-10-12', cat: 'donation', dir: 'in', amount: 75000 },
    { id: 'C-0002', date: '2026-10-15', cat: 'medicine', dir: 'out', amount: 410000 },
    { id: 'K-0004', date: '2026-10-19', cat: 'donation', dir: 'in', amount: 500000 },
    { id: 'C-0003', date: '2026-10-24', cat: 'school', dir: 'out', amount: 330000 },
    { id: 'C-0004', date: '2026-10-31', cat: 'fee', dir: 'out', amount: 4500 }
  ];

  var api = {
    ok: !!subtle,
    sample: function () { return SAMPLE.map(function (e) { return Object.assign({}, e); }); },
    build: build, buildBytes: buildBytes, path: path, verify: verify, verifyBytes: verifyBytes,
    hex: hex, serialize: serialize, encode: encode
  };
  root.ShaffofMerkle = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
