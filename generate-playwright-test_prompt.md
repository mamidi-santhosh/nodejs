---
mode: agent
description: Convert a manual test case file into a Playwright spec + Page Object methods
---

Convert the test cases in ${input:testCaseFile} into Playwright tests.

Steps:
1. Read ${input:testCaseFile} from the `test-cases/` folder.
2. Follow SKILL.md in full — use the Playwright MCP tool to walk each step
   live on the running app and confirm real selectors/state. Do not guess.
3. Check `pages/` for existing Page Object methods before writing new ones.
4. Create or update the spec file in `tests/` (same base name as the input file).
5. Create or update only the Page Object files needed for this feature.
6. Run SKILL.md's Step 5 self-review checklist before showing me the code.
7. Report back per SKILL.md's Step 6 — confirmed selectors, any mismatches
   between the spreadsheet and the real app, and anything left as
   test.fixme() with a reason.

Do not run the test suite. Do not touch spec files for other features.
