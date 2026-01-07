# Agent Collaboration Rules

## Documentation Management

### When to Update Documentation
- After completing a feature or significant change
- When discovering important patterns or gotchas
- When user preferences are identified
- After resolving bugs (document the fix)
- When "doc it" is explicitly requested

### Documentation Files
- **agentnotes.md**: Critical info for future sessions
- **project_checklist.md**: Current tasks and progress
- **notebook.md**: Interesting findings and learnings
- **docs/**: Technical specifications and design docs

## Code Organization

### File Size Limits
- Keep files under 500 lines when possible
- Extract components or utilities when approaching limit
- Split large components into smaller, focused ones

### Function Size
- Keep functions under 40 lines
- Single responsibility principle
- Extract helper functions when needed

### Single Responsibility
- Each file should have one clear purpose
- Each function should do one thing
- Separate concerns (logic vs presentation)

## Implementation Approach

### Before Starting
1. Understand the full context
2. Review related code
3. Check existing patterns
4. Plan the implementation
5. Confirm approach with user if unclear

### During Implementation
- Implement in logical chunks
- Test each step before moving on
- Update documentation as you go
- Commit checkpoint commits frequently

### After Implementation
- Self-review the code
- Update documentation
- Test the feature
- Note any technical debt created

## Error Handling

### When Bugs Occur
1. Fix the immediate issue
2. Analyze why testing didn't catch it
3. Search for similar issues
4. Update testing processes
5. Document the fix in notebook.md

### Avoid Over-Engineering
- Fix the bug, don't refactor unrelated code
- Don't optimize prematurely
- Stick to the scope of the request

## Testing Philosophy

### Testing Strategy
- Create tests for every feature
- Test edge cases
- Test error conditions
- Keep tests maintainable

### Test Organization
- Unit tests for utilities and functions
- Integration tests for component interactions
- E2E tests for critical user flows
- Store tests in dedicated `tests/` folder

## Communication

### When to Ask Questions
- If requirements are unclear
- If multiple approaches are possible
- If there are conflicting requirements
- If user preferences matter

### Updates
- Provide progress updates on complex tasks
- Highlight important decisions or trade-offs
- Note any technical debt created
- Suggest improvements when appropriate

## Git Practices

### Commit Strategy
- Frequent checkpoint commits
- Descriptive commit messages
- Use conventional commit format: `type(scope): description`
- Create branches for major changes

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Code Quality

### Self-Review Checklist
- [ ] Code matches requirements
- [ ] No obvious bugs
- [ ] Error handling in place
- [ ] Edge cases considered
- [ ] Documentation updated
- [ ] Tests added (when applicable)
- [ ] No console.logs or debug code
- [ ] TypeScript types are correct

### Code Review Focus
- Functionality correctness
- Code clarity and maintainability
- Performance considerations
- Security implications
- Accessibility compliance

## Refactoring Guidelines

### When to Refactor
- Code is hard to understand
- Code has duplication
- Code is causing bugs
- Performance issues identified
- **Don't refactor just for the sake of it**

### Refactoring Approach
- Discuss significant refactors before starting
- Refactor in small, incremental steps
- Ensure tests pass after each step
- Don't change functionality during refactor

## External Resources

### Research First
- Check documentation before implementing
- Use external sources for API details
- Verify current best practices
- Consult Perplexity MCP for questions

### Tools Available
- Check `.cursor/tools/` for available tools
- Use appropriate tools for the task
- Document new tools discovered

