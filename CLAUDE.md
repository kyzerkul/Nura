# Nura — Agent Entry Point

## Before doing ANYTHING, read these files in order:

1. `context/project_overview.md` — What Nura is, who it's for, what's in/out of scope
2. `context/architecture.md` — Full tech stack, system boundaries, security invariants
3. `context/code_standards.md` — TypeScript, React Native, NativeWind conventions
4. `context/ai_workflow_rules.md` — How you behave as an agent on this project
5. `context/ui_context.md` — Design tokens and component conventions
6. `context/progress_tracker.md` — Current phase, what's done, what's next

## Agent rules (non-negotiable)

- Read ALL six files above before writing any code.
- After completing a feature unit, update `context/progress_tracker.md` immediately.
- Never exceed the scope of the current spec file.
- Never expose API keys or secrets in client-side code.
- When a decision is ambiguous, stop and ask — do not invent.
- Always verify TypeScript compiles without errors before marking a task done.

## Workflow for each feature

1. Read the spec file in `context/feature_specs/`
2. Mark the unit as `in_progress` in `progress_tracker.md`
3. Implement exactly as specified — nothing more
4. Verify against the checklist in the spec
5. Mark as `completed` in `progress_tracker.md`
6. Report what was done and what comes next

## Project structure reminder

```
d:\Nura\
├── CLAUDE.md                  ← You are here
├── context/
│   ├── project_overview.md
│   ├── architecture.md
│   ├── code_standards.md
│   ├── ai_workflow_rules.md
│   ├── ui_context.md
│   ├── progress_tracker.md
│   └── feature_specs/         ← One .md file per feature unit
└── [expo app files]
```
