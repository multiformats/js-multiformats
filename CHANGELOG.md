## [12.1.3](https://github.com/multiformats/js-multiformats/compare/v12.1.2...v12.1.3) (2023-10-25)


### Trivial Changes

* **deps:** bump actions/setup-node from 3.8.1 to 3.8.2 ([f190ad7](https://github.com/multiformats/js-multiformats/commit/f190ad7da5a0a17b44a88645dfa58c532d51dd56))


### Dependencies

* **dev:** bump crypto-hash from 2.0.1 to 3.0.0 ([f5b9958](https://github.com/multiformats/js-multiformats/commit/f5b995889b0b30b2e655e618b561bdfdf7df5299))

## [12.1.2](https://github.com/multiformats/js-multiformats/compare/v12.1.1...v12.1.2) (2023-10-03)


### Bug Fixes

* switch interface method decl style ([a33d24f](https://github.com/multiformats/js-multiformats/commit/a33d24f3ca56e4b40c80a3237e419cda261aa3e6))


### Dependencies

* **dev:** bump aegir from 40.0.13 to 41.0.0 ([41f008b](https://github.com/multiformats/js-multiformats/commit/41f008b09378085adef4aede1dd504a4eba5fa80))

## [12.1.1](https://github.com/multiformats/js-multiformats/compare/v12.1.0...v12.1.1) (2023-09-05)


### Bug Fixes

* update link interface path in exports map ([#270](https://github.com/multiformats/js-multiformats/issues/270)) ([d38e4a8](https://github.com/multiformats/js-multiformats/commit/d38e4a8ba1d2d33c60481265356708df80ed925e))


### Trivial Changes

* **deps:** bump actions/checkout from 3 to 4 ([f94559e](https://github.com/multiformats/js-multiformats/commit/f94559e4a0fa7c4ad320261507040df5bc03f63a))

## [12.1.0](https://github.com/multiformats/js-multiformats/compare/v12.0.2...v12.1.0) (2023-08-28)


### Features

* add sha1 support ([4da0085](https://github.com/multiformats/js-multiformats/commit/4da008580dd3dc3fa2c5f14c5a3bf64fd99221e6))

## [12.0.2](https://github.com/multiformats/js-multiformats/compare/v12.0.1...v12.0.2) (2023-08-28)


### Bug Fixes

* linting ([3d74818](https://github.com/multiformats/js-multiformats/commit/3d74818e975099c7c83112434f7ed23a68b9af0a))
* remove old ts option ([638dbed](https://github.com/multiformats/js-multiformats/commit/638dbed357cfe65e4d3402899dde5a7620ab5ce7))


### Trivial Changes

* add or force update .github/workflows/js-test-and-release.yml ([21b7591](https://github.com/multiformats/js-multiformats/commit/21b75911e0aee1ba7a6be9687db83328cfd961b5))
* delete templates [skip ci] ([#263](https://github.com/multiformats/js-multiformats/issues/263)) ([d2b614d](https://github.com/multiformats/js-multiformats/commit/d2b614d34631537a97176657b478691ca0ab5522))
* **deps:** bump actions/setup-node from 3.5.0 to 3.8.0 ([7dcf225](https://github.com/multiformats/js-multiformats/commit/7dcf225914fd6cebfa9f5cf0f5897cc0a0f356ab))
* **deps:** bump actions/setup-node from 3.8.0 to 3.8.1 ([d7ec85c](https://github.com/multiformats/js-multiformats/commit/d7ec85c29500ff0a9bb02d2ea4c808047938ce97))
* **deps:** bump gozala/typescript-error-reporter-action ([4a36fb7](https://github.com/multiformats/js-multiformats/commit/4a36fb7ee49edb4300267b90301ef0e4300cbc46))
* Update .github/dependabot.yml [skip ci] ([58bebda](https://github.com/multiformats/js-multiformats/commit/58bebda0a892429bf125ea6bc2e4f0a2208b27a6))


### Dependencies

* **dev:** bump aegir from 37.12.1 to 40.0.11 ([d17424d](https://github.com/multiformats/js-multiformats/commit/d17424d257fd9995ad775d2309a67ae2dc4f3c54))

## [12.0.1](https://github.com/multiformats/js-multiformats/compare/v12.0.0...v12.0.1) (2023-06-15)


### Trivial Changes

* **deps:** bump codecov/codecov-action from 3.1.1 to 3.1.4 ([#256](https://github.com/multiformats/js-multiformats/issues/256)) ([910eeeb](https://github.com/multiformats/js-multiformats/commit/910eeeb36c9fe4bd087ee83e6cec03e03c2e1899))


### Dependencies

* **dev:** bump @types/node from 18.16.18 to 20.3.1 ([7a6d036](https://github.com/multiformats/js-multiformats/commit/7a6d036adc1c18d8311a978d339e323ebd724da8))

## [12.0.0](https://github.com/multiformats/js-multiformats/compare/v11.0.2...v12.0.0) (2023-06-14)


### ⚠ BREAKING CHANGES

* use aegir for ESM-only build/testing/release

### Features

* use aegir for ESM-only build/testing/release ([f82e61b](https://github.com/multiformats/js-multiformats/commit/f82e61bf1c6bfb67a709089e79ec57767fb1bcb7))

## [11.0.2](https://github.com/multiformats/js-multiformats/compare/v11.0.1...v11.0.2) (2023-03-09)


### Bug Fixes

* add interface files to the exports map ([#246](https://github.com/multiformats/js-multiformats/issues/246)) ([a58a398](https://github.com/multiformats/js-multiformats/commit/a58a39896d7264ba0bcbaf737cce7f3a65c644ba)), closes [/github.com/ipld/js-dag-cbor/blob/master/src/index.js#L9](https://github.com/multiformats//github.com/ipld/js-dag-cbor/blob/master/src/index.js/issues/L9)

## [11.0.1](https://github.com/multiformats/js-multiformats/compare/v11.0.0...v11.0.1) (2023-01-18)


### Bug Fixes

* throw on CID.parse v0 string with multibase prefix ([258a0be](https://github.com/multiformats/js-multiformats/commit/258a0be344ddd5d08e08e55b3e088212df0c409a))

## [11.0.0](https://github.com/multiformats/js-multiformats/compare/v10.0.3...v11.0.0) (2023-01-02)


### ⚠ BREAKING CHANGES

* Make link.toJSON return a DAG-JSON link

### Features

* Make link.toJSON return a DAG-JSON link ([9e087d6](https://github.com/multiformats/js-multiformats/commit/9e087d64ee3c90d8b019dd48989936b17b1cb2f3))


### Bug Fixes

* build browser bundle ([2ee6012](https://github.com/multiformats/js-multiformats/commit/2ee6012dbb702cff2425668c16fe101fdf79517d)), closes [#234](https://github.com/multiformats/js-multiformats/issues/234)
* list links of a block that _is a_ CID ([#226](https://github.com/multiformats/js-multiformats/issues/226)) ([c17673d](https://github.com/multiformats/js-multiformats/commit/c17673d9e15bd5a4df074c9f73267a257e0dcfad))


### Documentation

* fix typos in jsdoc comments ([a246054](https://github.com/multiformats/js-multiformats/commit/a246054653cf588e92d76f8161b0a6cd6035533b))

## [10.0.3](https://github.com/multiformats/js-multiformats/compare/v10.0.2...v10.0.3) (2022-12-16)


### Documentation

* publish typedocs in gh-pages branch ([#233](https://github.com/multiformats/js-multiformats/issues/233)) ([3a6d3ed](https://github.com/multiformats/js-multiformats/commit/3a6d3ed1f653d62e30d72d7bd00dc5815a17ffe3))

## [10.0.2](https://github.com/multiformats/js-multiformats/compare/v10.0.1...v10.0.2) (2022-10-19)


### Bug Fixes

* use slash as flag that an object is a CID ([#217](https://github.com/multiformats/js-multiformats/issues/217)) ([1cec619](https://github.com/multiformats/js-multiformats/commit/1cec619e2818d893292323539f397324ace82280)), closes [#212](https://github.com/multiformats/js-multiformats/issues/212) [#213](https://github.com/multiformats/js-multiformats/issues/213)


### Trivial Changes

* **no-release:** rename varint test file so it is run ([#209](https://github.com/multiformats/js-multiformats/issues/209)) ([e32fe47](https://github.com/multiformats/js-multiformats/commit/e32fe4703ee0c48100af89f9c9c7181f65935176))
* remove unnecessary dev deps ([#218](https://github.com/multiformats/js-multiformats/issues/218)) ([a43ffff](https://github.com/multiformats/js-multiformats/commit/a43ffff672495ba86486be47084697df4e1ecacc))

## [10.0.1](https://github.com/multiformats/js-multiformats/compare/v10.0.0...v10.0.1) (2022-10-17)


### Bug Fixes

* convert byteOffset and byteLength to getters ([#215](https://github.com/multiformats/js-multiformats/issues/215)) ([4e09490](https://github.com/multiformats/js-multiformats/commit/4e09490beeba0e0a47432a7bb51112ab5f556e3f)), closes [#208](https://github.com/multiformats/js-multiformats/issues/208) [#210](https://github.com/multiformats/js-multiformats/issues/210)

## [10.0.0](https://github.com/multiformats/js-multiformats/compare/v9.9.0...v10.0.0) (2022-10-12)


### ⚠ BREAKING CHANGES

* remove use of Object.defineProperties in CID class
* use aegir for ESM-only build/testing/release

### Features

* add complete set of aegir-based scripts ([1190bc6](https://github.com/multiformats/js-multiformats/commit/1190bc6fcc2d11a317979538692940d6b8085874))
* define Link interface for CID ([88e29ea](https://github.com/multiformats/js-multiformats/commit/88e29ea7a8c1a1a284c654311cfb1d67cbfd8e6c))
* remove deprecated CID properties & methods ([ffc4e6f](https://github.com/multiformats/js-multiformats/commit/ffc4e6fac0b9f755a141f5e7fea61950d195b4fa))
* use aegir for ESM-only build/testing/release ([163d463](https://github.com/multiformats/js-multiformats/commit/163d4632708b874b60c5a8de0f77811034557f74))


### Bug Fixes

* --no-cov for all but chrome main ([b92f25f](https://github.com/multiformats/js-multiformats/commit/b92f25fe6f3ca9ed9c9468a209bf1101a3005a3d))
* add "browser" field, remove named local imports ([d60ea06](https://github.com/multiformats/js-multiformats/commit/d60ea06f0c1d3145200138548e71677d0007f9ef))
* additional lint items from Link interface work ([91f677b](https://github.com/multiformats/js-multiformats/commit/91f677be1bc6304b066d4c6aaeea2b1af94876b7))
* address JS & TS linting complaints ([c12db2a](https://github.com/multiformats/js-multiformats/commit/c12db2a53a11f701fbfbd04f5f977580c37af54b))
* changes for new lint rules ([e6c9957](https://github.com/multiformats/js-multiformats/commit/e6c9957383d6023291fafaa1f6718bd903539e43))
* distribute types in dist/types/ ([c6defdb](https://github.com/multiformats/js-multiformats/commit/c6defdb039520e4e7dd0e279b212b72683ceac85))
* ensure "master" as release branch ([16f8d9e](https://github.com/multiformats/js-multiformats/commit/16f8d9e1215caaa00cc7d708058f01dc6d10b824))
* make CID#asCID a regular property ([a74f1c7](https://github.com/multiformats/js-multiformats/commit/a74f1c75b73c6d019614ecbf8f06ab97a232a48b))
* only release on master ([d15f26f](https://github.com/multiformats/js-multiformats/commit/d15f26fbcf51bd9d382e27ca9099af71c217bb25))
* properly export types, build more complete pack ([8172ea8](https://github.com/multiformats/js-multiformats/commit/8172ea8977296ece7a1b9d165caa99c284b604fd))
* remove "main" ([ad3306c](https://github.com/multiformats/js-multiformats/commit/ad3306c459e0e4f22184963c151bf3cc737ec9b0))
* remove use of Object.defineProperties in CID class ([6149fae](https://github.com/multiformats/js-multiformats/commit/6149fae84b74b7a6b0ca8f9e21e731ac9fabcf3a)), closes [#200](https://github.com/multiformats/js-multiformats/issues/200)
* run coverage only where it's supposed to ([872d121](https://github.com/multiformats/js-multiformats/commit/872d12126132a38677f623b87699b6fbff968cfd))
* test on all branches and pull requests ([f2ae077](https://github.com/multiformats/js-multiformats/commit/f2ae07760739c2f16e2eb5c83a2fad15a877243f))
* ts-use import path ([53651c1](https://github.com/multiformats/js-multiformats/commit/53651c1fae60b0bf9424c5f8f688d42959835480))
* use extensions for relative ts imports ([451998a](https://github.com/multiformats/js-multiformats/commit/451998a43516d7d5c468a18fe074ea1b53ac883e)), closes [/github.com/multiformats/js-multiformats/pull/199#issuecomment-1252793515](https://github.com/multiformats//github.com/multiformats/js-multiformats/pull/199/issues/issuecomment-1252793515)
* use parent `tsc` in ts-use ([85a9296](https://github.com/multiformats/js-multiformats/commit/85a9296f54118ff676bf1deb107d65c4c892186d))


### Tests

* check for non-enumerability of asCID property ([b4ba07d](https://github.com/multiformats/js-multiformats/commit/b4ba07db92e4610a55101f7dd17505f21a341a85))


### Trivial Changes

* add test for structural copying ([#206](https://github.com/multiformats/js-multiformats/issues/206)) ([e8def36](https://github.com/multiformats/js-multiformats/commit/e8def3663cd328023fbf7e4e88c9e47e71846d06))
* **no-release:** bump @types/mocha from 9.1.1 to 10.0.0 ([#205](https://github.com/multiformats/js-multiformats/issues/205)) ([a9a9347](https://github.com/multiformats/js-multiformats/commit/a9a9347789ee720d1de9508598d8879abf443baf))
* **no-release:** bump actions/setup-node from 3.4.1 to 3.5.0 ([#204](https://github.com/multiformats/js-multiformats/issues/204)) ([604ca1f](https://github.com/multiformats/js-multiformats/commit/604ca1fe498864a32851294317d76f0aaa13d280))

## [9.9.0](https://github.com/multiformats/js-multiformats/compare/v9.8.1...v9.9.0) (2022-09-20)


### Features

* add optional offset param to varint.decode ([#201](https://github.com/multiformats/js-multiformats/issues/201)) ([1e1b583](https://github.com/multiformats/js-multiformats/commit/1e1b583893bc0c984dcbeaf321c17f6637629b4e))

## [9.7.1](https://github.com/multiformats/js-multiformats/compare/v9.7.0...v9.7.1) (2022-07-26)


### Bug Fixes

* typo ([#192](https://github.com/multiformats/js-multiformats/issues/192)) ([b602f63](https://github.com/multiformats/js-multiformats/commit/b602f6315d35ee5c83d6f0b9995988f065f47ec8))


### Trivial Changes

* **no-release:** bump actions/setup-node from 3.3.0 to 3.4.0 ([#189](https://github.com/multiformats/js-multiformats/issues/189)) ([362b167](https://github.com/multiformats/js-multiformats/commit/362b167c939066b1e3217db4442a7652fba38e85))
* **no-release:** bump actions/setup-node from 3.4.0 to 3.4.1 ([#190](https://github.com/multiformats/js-multiformats/issues/190)) ([67f22c4](https://github.com/multiformats/js-multiformats/commit/67f22c4696777529d3871ee1e2fdbd436ad55fc0))

## [9.7.0](https://github.com/multiformats/js-multiformats/compare/v9.6.5...v9.7.0) (2022-06-23)


### Features

* add base256emoji ([#187](https://github.com/multiformats/js-multiformats/issues/187)) ([c6c5c46](https://github.com/multiformats/js-multiformats/commit/c6c5c46b12686c48db741836c5957dbc72f4bbd4))


### Trivial Changes

* **no-release:** bump @types/node from 17.0.45 to 18.0.0 ([#188](https://github.com/multiformats/js-multiformats/issues/188)) ([99e94ed](https://github.com/multiformats/js-multiformats/commit/99e94ed8025aabae64e58c2f2d2fff6b24dddfcb))
* **no-release:** bump actions/setup-node from 3.1.0 to 3.2.0 ([#182](https://github.com/multiformats/js-multiformats/issues/182)) ([86ec43d](https://github.com/multiformats/js-multiformats/commit/86ec43d89d60c6c4be0e001c06d1e28570a3d36a))
* **no-release:** bump actions/setup-node from 3.2.0 to 3.3.0 ([#186](https://github.com/multiformats/js-multiformats/issues/186)) ([712c1c4](https://github.com/multiformats/js-multiformats/commit/712c1c4fe5066d0a6fdc89b53a7943bb67edf0b8))
* **no-release:** fix typo implemnetation -> implementation ([#184](https://github.com/multiformats/js-multiformats/issues/184)) ([3d4ae50](https://github.com/multiformats/js-multiformats/commit/3d4ae504928b372886d1021e48a39c06ecbf8fde))

### [9.6.5](https://github.com/multiformats/js-multiformats/compare/v9.6.4...v9.6.5) (2022-05-06)


### Trivial Changes

* **no-release:** bump actions/checkout from 2.4.0 to 3 ([#172](https://github.com/multiformats/js-multiformats/issues/172)) ([a1b38c2](https://github.com/multiformats/js-multiformats/commit/a1b38c235809287e284c7bde80634e669e6d1ac6))
* **no-release:** bump actions/setup-node from 2.5.1 to 3.0.0 ([#169](https://github.com/multiformats/js-multiformats/issues/169)) ([8deb4d5](https://github.com/multiformats/js-multiformats/commit/8deb4d5dae2e01d8fd60f2dd6e944747c4ee2ef1))
* **no-release:** bump actions/setup-node from 3.0.0 to 3.1.0 ([#174](https://github.com/multiformats/js-multiformats/issues/174)) ([9bcd7fe](https://github.com/multiformats/js-multiformats/commit/9bcd7fef62888d7cefe8e4f5e929d4e3c9dadda9))
* **no-release:** bump mocha from 9.2.2 to 10.0.0 ([#179](https://github.com/multiformats/js-multiformats/issues/179)) ([b2951dc](https://github.com/multiformats/js-multiformats/commit/b2951dcbee5812522f2336bbf7c28eab9babdfa9))
* **no-release:** bump polendina from 2.0.15 to 3.0.0 ([#180](https://github.com/multiformats/js-multiformats/issues/180)) ([659516b](https://github.com/multiformats/js-multiformats/commit/659516bb231bcc8332d93ded03ebcfa8e675f2dc))
* **no-release:** bump standard from 16.0.4 to 17.0.0 ([#178](https://github.com/multiformats/js-multiformats/issues/178)) ([2683344](https://github.com/multiformats/js-multiformats/commit/268334426ca97f38a8c2eab0c834943c6e1a04d0))
* update tsdoc for CID `code` param to clarify "what kind of code?" ([#181](https://github.com/multiformats/js-multiformats/issues/181)) ([adec0c4](https://github.com/multiformats/js-multiformats/commit/adec0c4714ef39879c3b059dc9a4882e19406420))

### [9.6.4](https://github.com/multiformats/js-multiformats/compare/v9.6.3...v9.6.4) (2022-02-14)


### Trivial Changes

* clean typos and formatting ([0d976fd](https://github.com/multiformats/js-multiformats/commit/0d976fd33923e8b9cbe1535d3bc269affe151d66))

### [9.6.3](https://github.com/multiformats/js-multiformats/compare/v9.6.2...v9.6.3) (2022-02-04)


### Bug Fixes

* run test:ci in CI, fix package.json keywords ([#139](https://github.com/multiformats/js-multiformats/issues/139)) ([8ec8eb0](https://github.com/multiformats/js-multiformats/commit/8ec8eb0ca29ed51d244495a0d6c7d7a08a31ac39))

### [9.6.2](https://github.com/multiformats/js-multiformats/compare/v9.6.1...v9.6.2) (2022-01-20)


### Bug Fixes

* add encode to identity ([2724f8a](https://github.com/multiformats/js-multiformats/commit/2724f8aa8e0e7c24db7594eb29f683b1c01f3e42)), closes [#160](https://github.com/multiformats/js-multiformats/issues/160)
* coverage by using encode ([132d829](https://github.com/multiformats/js-multiformats/commit/132d829eb84776afd3820788df024a7a9f6d8834))

### [9.6.1](https://github.com/multiformats/js-multiformats/compare/v9.6.0...v9.6.1) (2022-01-20)


### Bug Fixes

* export only `identity` hasher const ([330082a](https://github.com/multiformats/js-multiformats/commit/330082aeaf2f493e351c413411ce9a4db25ebe5f))

## [9.6.0](https://github.com/multiformats/js-multiformats/compare/v9.5.9...v9.6.0) (2022-01-19)


### Features

* add sync multihash hasher ([#160](https://github.com/multiformats/js-multiformats/issues/160)) ([c3a650c](https://github.com/multiformats/js-multiformats/commit/c3a650c8b48989ea52045d85eb06eebee8bb59d1))

### [9.5.9](https://github.com/multiformats/js-multiformats/compare/v9.5.8...v9.5.9) (2022-01-18)


### Trivial Changes

* Reanable tsc action and reconfigure project slightly ([#157](https://github.com/multiformats/js-multiformats/issues/157)) ([c936a6d](https://github.com/multiformats/js-multiformats/commit/c936a6d3f125b6032358ffcc0e9c71e2bf986bf3))

### [9.5.8](https://github.com/multiformats/js-multiformats/compare/v9.5.7...v9.5.8) (2022-01-07)


### Trivial Changes

* **test:** use chai throws() & chai-as-promised isRejected() ([6e4ba86](https://github.com/multiformats/js-multiformats/commit/6e4ba86a59ef1f5a93b1869f1650073da184ebe4))

### [9.5.7](https://github.com/multiformats/js-multiformats/compare/v9.5.6...v9.5.7) (2022-01-07)


### Bug Fixes

* **types:** combine composite tsconfigs ([18c5734](https://github.com/multiformats/js-multiformats/commit/18c5734060c972cbcb45d6acea1642b2d09fde13))


### Trivial Changes

* **types:** re-enable typechecks for tests by split tsconfig ([4c017dc](https://github.com/multiformats/js-multiformats/commit/4c017dc80280bb42b0e2da07eb5f5da58c2efd76))
* **types:** remove explicit typecheck action ([b0467e5](https://github.com/multiformats/js-multiformats/commit/b0467e52870a91f3fc3122afb969505a31dc3210))

### [9.5.6](https://github.com/multiformats/js-multiformats/compare/v9.5.5...v9.5.6) (2022-01-04)


### Bug Fixes

* **types:** fix publishing of types ([58b5604](https://github.com/multiformats/js-multiformats/commit/58b5604fff734ca997dbedf0d8309247f4e518e4)), closes [#150](https://github.com/multiformats/js-multiformats/issues/150)

### [9.5.5](https://github.com/multiformats/js-multiformats/compare/v9.5.4...v9.5.5) (2022-01-04)


### Bug Fixes

* enable ts on tests ([62774c2](https://github.com/multiformats/js-multiformats/commit/62774c2bca1b2c4eb7c125bd092f6f9dcadb19e5))
* type inference for base32 ([b912ecc](https://github.com/multiformats/js-multiformats/commit/b912ecc136908eaa8dd4f9e5fae48b7b52132651))


### Trivial Changes

* **no-release:** bump @types/node from 16.11.14 to 17.0.0 ([#145](https://github.com/multiformats/js-multiformats/issues/145)) ([66aaf0f](https://github.com/multiformats/js-multiformats/commit/66aaf0fa8cfb6d0a41e12e3f3463147a0bbda0ea))
* **no-release:** bump actions/setup-node from 2.5.0 to 2.5.1 ([#147](https://github.com/multiformats/js-multiformats/issues/147)) ([32cf7bd](https://github.com/multiformats/js-multiformats/commit/32cf7bd9709173683e194c7c0e7b8f4acf49e9a5))

### [9.5.4](https://github.com/multiformats/js-multiformats/compare/v9.5.3...v9.5.4) (2021-12-09)


### Bug Fixes

* remove publish script ([da1d722](https://github.com/multiformats/js-multiformats/commit/da1d7228aca1eebf749f0a922a3f7e90b805009d))

### [9.5.3](https://github.com/multiformats/js-multiformats/compare/v9.5.2...v9.5.3) (2021-12-09)


### Bug Fixes

* add windows CI support (replace hundreds with c8 direct) ([5da242c](https://github.com/multiformats/js-multiformats/commit/5da242c65d39845ab869e027219c06510d700b6e))
* ipjs windows fix, add windows back in to CI ([196e404](https://github.com/multiformats/js-multiformats/commit/196e4041a9aaefd2309e87b372e2efe8febd11fc))
* prepare auto-release from dist dir & w/ build ([90693dd](https://github.com/multiformats/js-multiformats/commit/90693dd4e3b95099e834c15dcfd8090bb0a8367a))


### Trivial Changes

* drop test support for 12.x ([a7a2110](https://github.com/multiformats/js-multiformats/commit/a7a2110559e7cf66c3741ade42cea80d8a12a82a))
* remove windows from CI pending ipjs fix ([2ab914b](https://github.com/multiformats/js-multiformats/commit/2ab914b1943fb8fc4e0aeead0fb7ce5dc979514e))
* update auto-release work w/ semantic-release ([db86f48](https://github.com/multiformats/js-multiformats/commit/db86f487dcba790522908583c6f4a9c7ce504dea))
* update devDeps ([55b9856](https://github.com/multiformats/js-multiformats/commit/55b98569017a647fd070bb699d453df9bb482715))
* upgrade polendina, test esm & cjs in browser ([852f1a5](https://github.com/multiformats/js-multiformats/commit/852f1a5dfecf0489679dfb24f9d2dc48ec21e95a))
