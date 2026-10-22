# Benchmarks

5.x (ESLint 10 + Prettier 3) against the Bun-only 6.0 package (`bun lint` + `bun fmt`), measured with `bun run bench:bun` (`scripts/bench-lint-format.js`).

Setup: macOS arm64, 12 CPUs, Bun 1.4.4-canary.1+963452075. Both tools lint the same files with the same profile options. Each command runs once to warm up and then N times; the tables show the median wall time (min–max) and the median peak resident memory. `bun run golden:bun` checks that both report the same rules in the same files for these profiles, so the speedup does not come from skipped rules.

## test-project (72 files, 10 runs)

| Profile              | ESLint 10 (5.x)             | bun lint (6.0)           | Faster |
| -------------------- | --------------------------- | ------------------------ | ------ |
| fast                 | 1079 ms (1004–1295), 463 MB | 79 ms (72–86), 81 MB     | 13.7x  |
| testing (type-aware) | 4375 ms (4231–4898), 709 MB | 120 ms (119–348), 192 MB | 36.4x  |
| full (type-aware)    | 4861 ms (4773–5352), 648 MB | 159 ms (155–161), 207 MB | 30.7x  |

| Formatter | Prettier 3 (5.x)         | bun fmt (6.0)        | Faster |
| --------- | ------------------------ | -------------------- | ------ |
| --check   | 291 ms (288–300), 143 MB | 23 ms (22–25), 26 MB | 12.9x  |

## test-project ×10 (792 files, 5 runs)

`--scale 10` copies the fixture files into 10 extra folders to approximate a mid-size app.

| Profile              | ESLint 10 (5.x)                 | bun lint (6.0)           | Faster |
| -------------------- | ------------------------------- | ------------------------ | ------ |
| fast                 | 3563 ms (3500–3685), 989 MB     | 298 ms (276–389), 120 MB | 12.0x  |
| testing (type-aware) | 13895 ms (12783–16756), 1539 MB | 373 ms (354–387), 264 MB | 37.2x  |
| full (type-aware)    | 14435 ms (13536–18183), 1631 MB | 450 ms (438–464), 297 MB | 32.1x  |

| Formatter | Prettier 3 (5.x)            | bun fmt (6.0)        | Faster |
| --------- | --------------------------- | -------------------- | ------ |
| --check   | 1658 ms (1590–1781), 302 MB | 36 ms (34–47), 32 MB | 46.0x  |

## Reproduce

```bash
bun run bench:bun -- --runs 10 --profile fast --profile testing --profile full
```

```bash
bun run bench:bun -- --runs 5 --scale 10 --profile fast --profile testing --profile full
```

`--write` replaces this file with the report of one run.
