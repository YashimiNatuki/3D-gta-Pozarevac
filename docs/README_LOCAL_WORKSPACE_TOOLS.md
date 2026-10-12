# Local tools — usage and safety

## Choose the right tool

- LOCAL_AUDIT_COMMAND_WSL.txt: a complete Bash here-document. Open the file, copy every line and paste it into WSL Ubuntu / Bash. Do not paste it into Windows PowerShell or CMD.
- assemble_workspace.sh: a standalone helper. After extracting this package under Downloads, run the script by its actual path, for example:
  bash "/mnt/c/Users/jamal/Downloads/3D-VelikaKradjaTockova-Final-Project-Plan/03-LOCAL-TOOLS/assemble_workspace.sh"

The example extraction folder may differ; change only the script path to match where the ZIP was extracted.

## What the workspace helper does

- Creates apps/, references/, 00_AUDIT/, 05_LOCAL_EVIDENCE/ and an isolated candidate-worktree destination under the requested project folder.
- Clones canonical Git repositories where public access/local credentials permit.
- Creates a detached worktree for the NPC/gameplay candidate rather than merging the feature branch into main.
- Copies the Unity/Cesium source from the known local path only if it exists, the destination is absent and disk space is sufficient; caches/build output and common credential-like filenames are excluded.
- Copies this plan and its support documentation non-destructively into 00_AUDIT/PROJECT_DOCUMENTATION/ when the script is run from this extracted package.
- Logs local repository status and relevant documentation paths.

## What it does not do

It does not merge PRs, commit or push code, deploy apps, install dependencies, execute a Unity build, change the original project, rewrite scenes, alter Cesium coordinates or copy local credentials intentionally. Private repositories may be skipped if local GitHub authentication is not configured. It cannot inspect Manus's hosted filesystem from WSL; that must be collected via the Manus workspace or its own export/download function.

## After it finishes

Review 00_AUDIT/LOCAL_AUDIT_*.txt and skipped-clone messages. Treat all local findings as candidates until their origin, ownership, branch and relevance are confirmed. Review collected documents locally before sharing them; the script attempts to avoid sensitive paths and stores only safe command signatures from matching shell-history entries, but no heuristic can guarantee that arbitrary documents contain no secrets.

## Safety gate

Do not use git reset --hard, git clean -fd, force-push, bulk merge, Unity package upgrade, scene overwrite or coordinate-origin change as part of this inventory phase. First preserve the working tree and scene, read the report, and choose one controlled integration branch.
