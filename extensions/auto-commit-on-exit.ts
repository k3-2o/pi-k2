/**
 * Auto-Commit on Exit Extension
 *
 * Automatically snapshots the working tree into git when pi exits.
 * Hooks session_shutdown, blocks session-transition reasons (new,
 * resume, fork, reload), and allows all other reasons through.
 * Stages all changes with git add -A and commits with a file-list
 * message. In non-git directories, silently does nothing.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Maximum number of filenames to include in the commit message. */
const MAX_FILES_IN_MESSAGE = 10;

/**
 * Parse git status --porcelain output into a list of filenames.
 * Porcelain format: "XY filename" — two status chars + space + path.
 * The first char may be a space (e.g. " M foo.txt"), so do NOT trim.
 * Handles renames ("R  old -> new") by taking the new name.
 */
function parseChangedFiles(porcelain: string): string[] {
	return porcelain
		.split("\n")
		.filter((line) => line.length > 0)
		.map((line) => {
			// Strip the 3-char prefix (XY + space) to get the filename.
			const pathPart = line.slice(3);
			// For renames: "old -> new" — take the new name
			const arrowIndex = pathPart.indexOf(" -> ");
			return arrowIndex !== -1 ? pathPart.slice(arrowIndex + 4) : pathPart;
		});
}

/**
 * Build the commit message from a list of changed filenames.
 * Format: "[pi] auto-commit: N files (file1, file2, file3)"
 * Truncates to MAX_FILES_IN_MESSAGE if there are more.
 */
function buildCommitMessage(files: string[]): string {
	const count = files.length;
	if (count === 0) return "[pi] auto-commit";

	let fileList: string;
	if (count <= MAX_FILES_IN_MESSAGE) {
		fileList = files.join(", ");
	} else {
		const shown = files.slice(0, MAX_FILES_IN_MESSAGE).join(", ");
		fileList = `${shown}, and ${count - MAX_FILES_IN_MESSAGE} more`;
	}

	return `[pi] auto-commit: ${count} files (${fileList})`;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_shutdown", async (event, ctx) => {
		// Block session-transition reasons; allow quit and anything else.
		// Uses a denylist rather than an allowlist because /quit and
		// Ctrl+D in TUI mode may emit reasons other than "quit".
		if (
			event.reason === "new" ||
			event.reason === "resume" ||
			event.reason === "fork" ||
			event.reason === "reload"
		)
			return;

		// Check for a git repo and uncommitted changes
		const { stdout: status, code: statusCode } = await pi.exec("git", [
			"status",
			"--porcelain",
		]);

		// Not a git repo (exit code 128) or git not found
		if (statusCode !== 0) return;

		// No changes to commit
		if (status.trim().length === 0) return;

		// Stage all changes (including new untracked files)
		const { code: addCode } = await pi.exec("git", ["add", "-A"]);
		if (addCode !== 0) return; // Silent failure

		// Build commit message from changed file list
		const files = parseChangedFiles(status);
		const message = buildCommitMessage(files);

		// Commit
		const { code: commitCode } = await pi.exec("git", ["commit", "-m", message]);

		// Notify in interactive mode
		if (commitCode === 0 && ctx.hasUI) {
			ctx.ui.notify(`Auto-committed: ${files.length} file(s)`, "info");
		}
	});
}
