# AGENTS.md — sgf-ts

Compact guidance for OpenCode sessions in this repository.

## Project Overview

TypeScript library for parsing and manipulating [SGF](https://en.wikipedia.org/wiki/Smart_Game_Format) (Smart Game Format) files for Go games.

## Developer Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all Jest tests |
| `npm run build` | Compile TypeScript (`tsc --build`) |
| `npm run tsc` | Type-check only |

## Architecture

- **Entry point**: `src/sgf.ts` — exports core types (`SGFNode`, `SGFProperty`, `SGFColor`, `Tag` enum)
- **Parser**: `src/parser.ts` — `parseSGF()` and `SGFParser` class
- **Goban logic**: `src/goban.ts` — `SGFGoban` for board state management, captures, groups
- **Tests**: `tests/*.test.ts` — Jest with ts-jest

## Key Conventions

- Strict TypeScript enabled (`strict: true` in tsconfig.json)
- Target: ES6, moduleResolution: node
- Main exports from `src/sgf.ts` — always import from there
- SGF coordinates use a1..s19 format; conversion helpers: `coordinateToRowColumn()`, `rowColumnToCoordinate()`

## Testing Notes

- Jest config in `jest.config.js`
- Test files match `/tests/.*\.(test|spec)?\.(ts|tsx)$`
- No special setup required; `npm install` then `npm test`

## License

Apache 2.0 — see README.md
