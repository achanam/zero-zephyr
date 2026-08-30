# Zero Zephyr

![Zero Zephyr](https://cdn.achanam.com/@dev/github/zero-zephyr)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?logo=github&logoColor=white)](#open-source-and-contributions)

Zero Zephyr is a small zero knowledge tool for sharing text or files through a link that expires and deletes itself after being read.

## How it works

Everything happens in your browser before anything touches the server.

1. You type a message or drop a file, then set a password (or use the built in generator).
2. Your browser derives an encryption key from that password using PBKDF2 SHA 256 with 600,000 iterations, then encrypts the content with AES GCM 256, all through the native Web Crypto API.
3. Only the encrypted blob, the salt, and the IV are uploaded. The server never sees your password or your plaintext, it just stores random looking bytes it cannot read.
4. You get a link and share it however you want. The receiver opens the link, types the password, and decryption happens locally in their browser too.
5. Once the link hits its view limit or expiry time (max 3 days, up to 9 views), it is gone. There is no dashboard, no account, no history.

So the server is basically blind storage. Even if the database got dumped, all anyone gets is ciphertext with no key attached to it.

## Why I built this

Honestly this project exists so I could learn how real world cryptography is implemented, not just read about it. Building the encrypt and decrypt flow, handling salts and IVs correctly, thinking about rate limiting and race conditions on the burn after read logic, all of that taught me more than any tutorial did. If you are looking at this code to learn too, feel free to poke around.

## Why not Argon2id

People sometimes ask why the key derivation is PBKDF2 and not Argon2id, since Argon2id is the stronger recommendation these days. A few reasons:

- This is not a password manager and it does not store long term secrets. It is a temporary drop box, content lives for at most 72 hours and disappears after a handful of views. The threat model is completely different from something protecting a vault for years.
- The Web Crypto API that runs natively in every browser supports PBKDF2 out of the box. Argon2id would need a WASM or JS library shipped to the client, which adds weight and attack surface for a project whose whole point is staying simple and auditable.
- There is a built in password generator that produces genuinely random passwords with solid entropy using crypto.getRandomValues, not Math.random. When the password itself is already hard to brute force, the extra memory hardness Argon2id offers matters a lot less, since the bottleneck stops being computation and starts being the sheer size of the keyspace.
- 600,000 iterations is well above the OWASP 2023 floor for PBKDF2 SHA 256, which is plenty for content that self destructs within days anyway.

If someone wants to send a patch adding Argon2id as an option, contributions are welcome, this is just the reasoning behind the current choice.

## Open source and contributions

This project is open source and anyone can use it, fork it, or build on top of it. Pull requests are welcome, whether that is a bug fix, a new feature, or just cleaning up something that looks messy. If you use this code, no need to ask permission first. It is licensed under [MIT](LICENSE).

## Disclaimer

This is shared as is, mainly as a learning project and something others might find useful too. Whatever you use it for, and whatever happens as a result, is entirely on you. I take no responsibility for how this tool is used or for any consequences that come from using it.
