const LOG_FORMAT = "%H%n%s%n%an%n%ae%n%b";
const COMMIT_DELIMITER = "----------commit-delimiter----------";

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
}

export class Git {
  #cwd: string;

  constructor(cwd: string = Deno.cwd()) {
    this.#cwd = cwd;
  }

  async commit(message: string) {
    const p = Deno.run({
      cwd: this.#cwd,
      cmd: ["git", "commit", "-a", "-m", message],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await p.status();

    if (code !== 0) {
      const error = new TextDecoder().decode(await p.stderrOutput());

      throw new Error(`Failed to commit changes: ${error}`);
    }

    return true;
  }

  async commits(start?: string, end = "HEAD") {
    const p = Deno.run({
      cwd: this.#cwd,
      cmd: [
        "git",
        "-c",
        "log.showSignature=false",
        "log",
        `--pretty=${LOG_FORMAT}${COMMIT_DELIMITER}`,
        start ? `${start}..${end}` : end,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await p.status();

    if (code !== 0) {
      const error = new TextDecoder().decode(await p.stderrOutput());

      throw new Error(`Failed to get git commits: ${error}`);
    }

    const output = new TextDecoder().decode(await p.output());

    const rawCommits = output.split(COMMIT_DELIMITER).map((str) =>
      str.split("\n").filter((line) => !!line)
    ).filter((rawCommit) => rawCommit.length);

    const commits = rawCommits.reduce<Array<Commit>>((commits, rawCommit) => {
      const [sha, message, name, email] = rawCommit;
      const [header] = message.split("\n");

      const commit: Commit = {
        sha,
        message: header,
        author: { name, email },
      };

      return [...commits, commit];
    }, []);

    return commits;
  }

  async tag(name: string) {
    const p = Deno.run({
      cwd: this.#cwd,
      cmd: ["git", "tag", name],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await p.status();

    if (code !== 0) {
      const error = new TextDecoder().decode(await p.stderrOutput());

      throw new Error(`Failed to create new tag: ${error}`);
    }

    return true;
  }

  async tags() {
    const p = Deno.run({
      cwd: this.#cwd,
      cmd: ["git", "tag"],
      stdout: "piped",
      stderr: "piped",
      env: {
        PAGER: "",
      },
    });

    const { code } = await p.status();

    if (code !== 0) {
      const error = new TextDecoder().decode(await p.stderrOutput());

      throw new Error(`Failed to get git tags: ${error}`);
    }

    const output = new TextDecoder().decode(await p.output());

    return output
      .split("\n")
      .filter((tag) => !!tag);
  }

  async push(ref?: string) {
    const p = Deno.run({
      cwd: this.#cwd,
      cmd: ["git", "push", ...(ref ? ["origin", ref] : [])],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await p.status();

    if (code !== 0) {
      const error = new TextDecoder().decode(await p.stderrOutput());

      throw new Error(`Failed to push ${ref}: ${error}`);
    }

    return true;
  }
}
