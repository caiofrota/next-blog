# Creating Codex Skills for This Repo

Use a skill when the same task is repeated often enough that the instructions should live outside the conversation.

Good skill candidates for this repo:

- WordPress migration
- media maintenance
- SEO/content QA
- admin UI conventions
- WordPress-to-engine content mapping

## When to create a skill

Create a skill when the task:

- follows the same steps every time
- has repo-specific commands or paths
- needs a fixed checklist
- benefits from a compact workflow instead of repeated explanation

Do not create a skill for:

- one-off bugs
- generic web development advice
- tasks that change too often

## What a skill should contain

- the purpose of the workflow
- the exact files or folders it touches
- the commands to run
- the checks that must pass before finishing
- any repo-specific constraints

## Suggested skill shape

1. Short description.
2. `SKILL.md` with the workflow.
3. Optional helper scripts if the workflow is repetitive.
4. Minimal references to the files the skill depends on.

## For this repository

If you create a skill for this project, keep it focused on one workflow at a time:

- import WordPress content
- audit post SEO fields
- manage media uploads and deletions
- review admin UI consistency

## Maintenance rule

If a skill starts to duplicate half the repository documentation, it is too broad. Move the stable parts into docs and keep the skill narrow.
