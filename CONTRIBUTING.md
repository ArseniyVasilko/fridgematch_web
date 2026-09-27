# FridgeMatch — Git Workflow

Follow these steps for every feature, in order.

## 1. Create the issue
Once you think of a feature to add, create an issue on the project's Kanban board. Include an appropriate label (e.g. `feature`, `fix`, `docs`, `chore`). Put it in **Ready** if you're starting soon, or **Backlog** if not yet.

## 2. Create a branch
When you're ready to start, open the issue and click "Create a branch."

## 3. Work in small commits
Work in your branch until the feature is complete and working. Split your work into multiple smaller commits — it makes tracking progress and bugs much easier later.

## 4. Rebase before pushing
Right before you push, check whether `main` has new commits since you branched. If so, rebase your branch onto the latest `main` and re-test that everything still works.

## 5. Open a pull request
Push your branch and open a pull request. Every PR needs approval from at least one other teammate before it can be merged into `main`.

## 6. Wrap up
After the PR is merged, move its issue card to **Done**. Branches are kept around rather than deleted for now — the merged commits are already permanent in `main` either way, so nothing is lost by leaving them.
