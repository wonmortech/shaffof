/* Shaffof demo Merkle core.
   Hashing follows RFC 9162 section 2.1: leaf = SHA-256(0x00 || entry), node = SHA-256(0x01 || left || right),
   and a tree of n leaves splits at the largest power of two smaller than n.
   Runs entirely in the browser with WebCrypto; nothing is sent anywhere. */
(function () {
  'use strict';
  var enc = new TextEncoder();

  function concat(parts) {
    var len = 0, i, out, off = 0;
    for (i = 0; i < parts.length; i++) len += parts[i].length;
    out = new Uint8Array(len);
    for (i = 0; i < parts.length; i++) { out.set(parts[i], off); off += parts[i].length; }
    return out;
  }
  function sha256(bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(function (b) { return new Uint8Array(b); });
  }
  function hex(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16);
    return s;
  }
  function serialize(e) { return e.id + '|' + e.date + '|' + e.cat + '|' + e.amount; }
  function leafHash(entry) { return sha256(concat([new Uint8Array([0]), enc.encode(serialize(entry))])); }
  function nodeHash(l, r) { return sha256(concat([new Uint8Array([1]), l, r])); }
  function split(n) { var k = 1; while (k * 2 < n) k *= 2; return k; }

  /* Builds the whole tree. Returns {hash, lo, hi, left, right, depth} nodes. */
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
  function build(entries) {
    return Promise.all(entries.map(leafHash)).then(function (leaves) {
      return buildNode(leaves, 0, leaves.length).then(function (root) { return { leaves: leaves, root: root }; });
    });
  }
  /* RFC 9162 inclusion path for leaf m: list of {hash, side} from the bottom up.
     side 'L' means the sibling sits on the left. */
  function path(node, m) {
    if (node.leaf) return [];
    if (m < node.left.hi) return path(node.left, m).concat([{ hash: node.right.hash, side: 'R', node: node.right }]);
    return path(node.right, m).concat([{ hash: node.left.hash, side: 'L', node: node.left }]);
  }
  /* Verifier side: knows only the entry, the path and the published root. */
  function verify(entry, proof, rootHex) {
    return leafHash(entry).then(function (h) {
      var steps = [{ hash: hex(h) }];
      var chain = Promise.resolve(h);
      proof.forEach(function (p) {
        chain = chain.then(function (cur) {
          return (p.side === 'L' ? nodeHash(p.hash, cur) : nodeHash(cur, p.hash)).then(function (next) {
            steps.push({ sibling: hex(p.hash), side: p.side, hash: hex(next) });
            return next;
          });
        });
      });
      return chain.then(function (r) { return { ok: hex(r) === rootHex, root: hex(r), steps: steps }; });
    });
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

  window.ShaffofMerkle = {
    ok: !!(window.crypto && crypto.subtle),
    sample: function () { return SAMPLE.map(function (e) { return Object.assign({}, e); }); },
    build: build, path: path, verify: verify, hex: hex, serialize: serialize
  };
})();
