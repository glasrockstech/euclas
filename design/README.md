# Current design entry

This directory is the self-contained design baseline for fresh implementation. It contains no implementation history or inherited runtime evidence.

## Authority and reading order

1. [Current decisions](decisions.md): confirmed founder choices and explicitly open choices.
2. [Product](product.md) and [experience](experience.md): users, outcomes, full scope and the first Desktop journey.
3. [Requirements](requirements.md), indexed by [requirements.json](requirements.json): each stable GR identifier has one normative owner here; preserved proposed strengths are not falsely promoted to founder confirmation.
4. [Architecture](architecture.md), [domain](domain.md), [security](security.md) and [API](api.md): implementation boundaries and enforcing responsibilities.
5. [Minimum execution profile](contract-profile.md) and [contracts](contracts/README.md): exact current minimum identity/work/execution/document/native exchanges. Full-release expansions must be specified before their consumers.
6. [Acceptance](acceptance.md) and [scenario catalog](acceptance/scenarios.json): expected behavior; all product scenarios start unexecuted.

The confirmed decisions govern product intent. Canonical schemas own field shapes; contract-profile.md owns the associated minimum cross-record/transaction constraints. Requirements and acceptance govern observable behavior. A shape-valid payload is never proof of a signature, permission, durable byte or successful action. Surface genuine conflicts rather than silently weaken a requirement.

The [Chinese overview](overview.zh-TW.md) is presentation, not a second normative catalog. The [brand guide](brand/README.md) owns approved visual identity/tokens. Development order and current permission belong to [the plan](../development/plan.md) and [progress](../development/progress.md).

Exact implementations, providers, native support tuples and release evidence remain unqualified. Do not turn this design package into a claim that login, mobile, harness, document or update code already works.
