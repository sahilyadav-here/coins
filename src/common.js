let { createHash } = require('crypto')
let stableStringify = require('json-stable-stringify')

function hashFunc (algo) {
  return (data) => createHash(algo).update(data).digest()
}

let sha256 = hashFunc('sha256')
let ripemd160 = hashFunc('ripemd160')

function addressHash (data) {
  let hash = ripemd160(sha256(data)).toString('base64')
  return hash.replace(/=/g, '') // remove the equals signs
}

let burnHandler = {
  // no-op, the coins just pay out to nowhere (economically,
  // this is the same as paying out to all coin holders)
  onOutput () {}
}

// to make basic transactions easier to compose, we let users
// specify them in a simpler format and then expand them here
// to the full format
function normalizeTx (tx) {
  // user can specify single values for to/from,
  // wrap them in arrays
  if (!Array.isArray(tx.from)) tx.from = [ tx.from ]
  if (!Array.isArray(tx.to)) tx.to = [ tx.to ]

  // if no type, infer that type is 'accounts'
  // (convenience for built-in coins handlers)
  for (let input of tx.from) {
    if (input.type != null) continue
    input.type = 'accounts'

    // infer accountType (either pubkey or multisig)
    if (input.accountType != null) continue
    input.accountType = input.pubkey ? 'pubkey' : 'multisig'
  }

  // if output has address and no type, infer that type is 'accounts'
  for (let output of tx.to) {
    if (output.type != null) continue
    if (output.address == null) continue
    output.type = 'accounts'
  }

  // if there is only 1 input and it has no amount, set amount
  // to sum of outputs
  if (tx.from.length === 1 && tx.from[0].amount == null) {
    let amountOut = tx.to.reduce((sum, { amount }) => sum + amount, 0)
    tx.from[0].amount = amountOut
  }
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  sha256,
  ripemd160,
  addressHash,
  burnHandler,
  normalizeTx,
  clone
}
