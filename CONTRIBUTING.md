# Contributing

Contributions that improve evaluation correctness, accessibility, documentation, or test coverage are welcome.

1. Fork the repository and create a focused branch.
2. Install dependencies with `pnpm install`.
3. Make the smallest coherent change and add tests for behavior changes.
4. Run `pnpm lint`, `pnpm test`, and `pnpm build`.
5. Open a pull request explaining the user-visible behavior and tradeoffs.

Avoid coupling the evaluator to the interface. New operators and rollout behavior should remain pure functions with deterministic tests.
