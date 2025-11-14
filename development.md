# Development Workflow with Claude

## 1. TDD Workflow with Claude

### Before Starting Implementation

1. **Read `task.md` in plan mode**
   - Let Claude analyze the requirements
   - Understand the full scope before coding
   - Ask Claude to explore existing code patterns

2. **Research Phase**
   - Use Claude to search codebase for similar implementations
   - Identify files that need modification
   - Understand test structure (unit/functional/real)

3. **Plan the Implementation**
   - Define test cases first
   - Identify which prompts or code need changes
   - Determine test locations and naming

## 2. Red-Green-Refactor Cycle

### RED Phase: Write Failing Tests

1. **Create test file** in appropriate folder:
   - `test/unit/` - Pure function tests, fully mocked
   - `test/functional/` - Workflow tests with mocked AI
   - `test/real/` - Integration tests with real AI APIs

2. **Run only the new test** to verify it fails:
   ```bash
   # For real tests
   npm run test:real -- test/real/your-feature.test.ts

   # For unit tests
   npm run test:unit -- test/unit/your-feature.test.ts

   # For functional tests
   npm run test:functional -- test/functional/your-feature.test.ts
   ```

3. **Verify RED phase**: Tests should fail with expected errors

### GREEN Phase: Implement Feature

1. **Make minimal changes** to pass tests:
   - Update `src/config/prompts.ts` for AI behavior
   - Modify utilities in `src/utils/` for logic changes
   - Update types in `src/types/` if needed

2. **Run only necessary tests** during development:
   ```bash
   # Run only your test file
   npm run test:real -- test/real/your-feature.test.ts
   ```

3. **Iterate quickly**:
   - Fix → Run test → Fix → Run test
   - Do NOT run full test suite yet
   - Focus only on making your tests pass

4. **Monitor test output** for:
   - Passing tests ✓
   - Expected behavior validation
   - No unintended side effects

### REFACTOR Phase: Validate Complete

1. **Run full test suite** after implementation:
   ```bash
   npm run test:all
   ```

2. **Verify no regressions**:
   - All existing tests still pass
   - Your new tests pass
   - No broken functionality

3. **Clean up if needed**:
   - Remove debug code
   - Improve code clarity
   - Update comments

## 3. Key Principles

### Test Management
- **Never modify existing tests** unless explicitly required by task
- Existing tests are regression protection
- Only add new tests for new features

### Efficient Testing
- **During development**: Run only relevant tests
- **After completion**: Run full test suite once
- Avoid unnecessary full test runs (saves time and API costs)

### Test Structure
- **Unit tests** (`test/unit/`): Fast, isolated, no external dependencies
- **Functional tests** (`test/functional/`): Workflow validation, mocked AI
- **Real tests** (`test/real/`): AI prompt validation, actual API calls

### AI Prompt Testing
- Use **real tests** for prompt validation
- Test with actual AI providers (Google Gemini, Anthropic Claude)
- Verify AI output matches expected format and content
- Include edge cases and brand corrections

### Code Changes
- Make targeted, minimal changes
- Update only files directly related to feature
- Preserve existing functionality
- Follow existing code patterns

### Commit Strategy
- Commit after GREEN phase success
- Include test file in commit
- Use conventional commit messages
- Document what changed and why
