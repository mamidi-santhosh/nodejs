# SKILL: Write Playwright tests from manual test cases (MCP-verified)

Goal: convert rows from `test-cases/*.json` into Playwright tests that read
like a senior QA engineer wrote them by hand — not AI-guessed selectors,
not weak assertions, not copy-pasted boilerplate.

Playwright MCP is enabled in this workspace. Use it to look at the REAL
running app before writing any selector or assertion. Never invent a
`data-testid` or guess text that you haven't actually seen on the page.

## Workflow — follow in order, every time

### Step 0 — Confirm the app is reachable
Ask for (or reuse from `.env`) the base URL if not already known. Use the
MCP browser tool to open it and confirm you land on a real page before
doing anything else. If login is required, do it via MCP first so the
rest of the session is authenticated.

### Step 1 — Read the test case
Open the relevant file in `test-cases/`. Take ONE `Test Case Id` at a time.
Do not batch multiple TCs into one MCP session without re-checking state
between them — the app state after TC002 may not match what TC003 assumes.

### Step 2 — Walk the steps live via MCP, don't assume
For each `Step #`:
1. Use MCP to perform the actual action described in `Test Step` (click,
   fill, navigate) on the live app.
2. Take an accessibility snapshot / DOM inspection via MCP after the action.
3. From that snapshot, pick the real locator — in this priority order:
   `getByTestId` (if a real `data-testid` exists) → `getByRole` with
   accessible name → `getByLabel` → `getByText` (exact, not substring)
   as last resort. Never use nth-child, generated class names, or XPath.
4. Compare what you actually see on screen against the `Expected Result`
   column. Use the REAL text/state you observed — don't paraphrase or
   guess what it "should" say.
5. If what you observe doesn't match the Excel's Expected Result, STOP
   and flag it to Santhosh instead of writing a test that asserts the
   wrong thing just to make it pass.

### Step 3 — Write the Page Object method
- One method per user action or per read, named after what it does
  (`clickFeedbackTile()`, not `step2()`).
- Use the confirmed selector from Step 2. No `TODO` placeholders should
  remain if MCP verification was actually done.
- Add web-first, auto-retrying actions/assertions (`await expect(locator)
  .toBeVisible()`) — never `page.waitForTimeout()` as a workaround for
  flaky timing. If something is genuinely async (API call, upload),
  wait on the real signal: `page.waitForResponse(...)`,
  `page.waitForLoadState('networkidle')` only as last resort, or an
  explicit UI state change.

### Step 4 — Write the test
- Title format: `TC00X - <Test Case Name from Excel>` (exact wording).
- One `test()` per Test Case Id, steps executed in order inside it.
- Comment above the test: `// Source: <tab> > <Test Case Id>`.
- Final assertion must map to the Expected Result of the LAST step, in
  the real language you observed, not the spreadsheet's exact wording if
  the app phrases it differently (call out the mismatch in a comment).
- Independent tests: no test should rely on a previous test's leftover
  state. Re-login or re-navigate in `beforeEach` rather than chaining.
- If the TC touches backend behavior (e.g. export, save, Spring Boot
  call), assert on both UI feedback AND the underlying response where
  feasible: `const res = await page.waitForResponse(url =>
  url.includes('/api/...') && res.status() === 200)`.

### Step 5 — Self-review before showing me the code
Check every item; fix anything that fails before presenting:
- [ ] No selector guessed — everything confirmed via MCP snapshot
- [ ] No hardcoded credentials, URLs, or test data — env vars / fixtures
- [ ] No `waitForTimeout()` used as a band-aid
- [ ] Test title matches Excel wording exactly
- [ ] Test is independent — can run alone or in any order
- [ ] Assertion is meaningful (checks actual outcome, not just "no error")
- [ ] Edge cases implied by Description column are covered, not just the
      happy path in Test Step
- [ ] Comments trace back to spreadsheet tab + Test Case Id

### Step 6 — Report back
List:
1. Which selectors were confirmed live via MCP (with the locator used)
2. Any Excel step whose expected result didn't match what MCP observed
3. Any step you could not verify (app unreachable, permission issue) —
   mark that test `test.fixme()` with a comment instead of guessing

## What "human-generated quality" means here
A human QA engineer wouldn't write a test until they'd clicked through
the flow themselves. MCP is how you do that same thing before writing
code — the accuracy comes from verifying against the real app every
time, not from writing more convincing-looking placeholder code.
