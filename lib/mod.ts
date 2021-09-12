import { SemVer, semverValid } from "./deps.ts";
import { Commit, Git } from "./git.ts";

export const KNOWN_VERSION_FILES = ["version.ts", "package.json", "pom.xml"];

export enum IncrementType {
  MAJOR,
  MINOR,
  PATCH,
  NONE,
}

export enum ChangeType {
  FIX = "fix",
  FEATURE = "feat",
  DOCS = "docs",
  STYLE = "style",
  REFACTOR = "refactor",
  PERF = "perf",
  TEST = "test",
  BUILD = "build",
  CI = "ci",
  BUMP = "bump",
  DEPS = "deps",
}

export interface GitBumpOptions extends GitBumpInitOptions {
  versions: Array<SemVer>;
  currentVersion: SemVer;
  nextVersion: SemVer;
  incrementType: IncrementType;
  versionFile?: string;
}

export interface GitBumpInitOptions {
  cwd?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export const BUMP_MAP: Record<ChangeType, IncrementType> = {
  [ChangeType.FIX]: IncrementType.PATCH,
  [ChangeType.FEATURE]: IncrementType.MINOR,
  [ChangeType.DOCS]: IncrementType.NONE,
  [ChangeType.STYLE]: IncrementType.NONE,
  [ChangeType.REFACTOR]: IncrementType.PATCH,
  [ChangeType.PERF]: IncrementType.NONE,
  [ChangeType.TEST]: IncrementType.NONE,
  [ChangeType.BUILD]: IncrementType.NONE,
  [ChangeType.CI]: IncrementType.NONE,
  [ChangeType.BUMP]: IncrementType.NONE,
  [ChangeType.DEPS]: IncrementType.PATCH,
};

const CHANGE_TYPE_REGEXP = (() => {
  const combinedChangeTypes = Object.values(ChangeType).reduce<Array<string>>(
    (exprs, changeType) => ([...exprs, changeType]),
    [],
  );

  return new RegExp(`(?<changeType>${combinedChangeTypes.join("|")})(.+)?:`);
})();

export class GitBump {
  #cwd: string;
  #git: Git;
  #dryRun: boolean;
  #verbose: boolean;
  #versions: Array<SemVer>;
  #currVersion: SemVer;
  #nextVersion: SemVer;
  #incrementType: IncrementType;
  #versionFile?: string;

  constructor(options: GitBumpOptions) {
    this.#cwd = options.cwd || Deno.cwd();
    this.#git = new Git(this.#cwd);
    this.#dryRun = !!options.dryRun;
    this.#verbose = !!options.verbose;
    this.#versions = options.versions;
    this.#currVersion = options.currentVersion;
    this.#nextVersion = options.nextVersion;
    this.#incrementType = options.incrementType;
    this.#versionFile = options.versionFile;
  }

  get versions() {
    return this.#versions;
  }

  get currentVersion() {
    return this.#currVersion;
  }

  get nextVersion() {
    return this.#nextVersion;
  }

  get incrementType() {
    return this.#incrementType;
  }

  get incrementTypeName() {
    switch (this.incrementType) {
      case IncrementType.MAJOR:
        return "MAJOR";

      case IncrementType.MINOR:
        return "MINOR";

      case IncrementType.PATCH:
        return "PATCH";
    }

    return "NONE";
  }

  get versionFile() {
    return this.#versionFile;
  }

  async bump() {
    if (this.versionFile) {
      if (this.shouldLog) {
        console.log(`updating version file: ${this.versionFile}`);
      }

      if (!this.#dryRun) {
        await updateVersionFile(
          this.versionFile,
          this.currentVersion,
          this.nextVersion,
        );
      }

      if (this.shouldLog) {
        console.log(`committing changes`);
      }

      if (!this.#dryRun) {
        await this.#git.commit(
          `bump: ${this.currentVersion} -> ${this.nextVersion}`,
        );
      }

      if (!this.#dryRun) {
        await this.#git.tag(this.nextVersion.toString());
      }

      if (this.shouldLog) {
        console.log(`pushing changes to origin`);
      }
    } else {
      if (this.shouldLog) {
        console.log("skipping version file: none detected");
      }
    }

    if (this.shouldLog) {
      console.log(`creating new tag: ${this.nextVersion}`);
    }

    if (!this.#dryRun) {
      await this.#git.push();
    }

    if (this.shouldLog) {
      console.log(`pushing tag ${this.nextVersion} to origin`);
    }

    if (!this.#dryRun) {
      await this.#git.push(this.nextVersion.toString());
    }
  }

  static async init(options: GitBumpInitOptions) {
    const cwd = options.cwd || Deno.cwd();
    const git = new Git(cwd);
    const versionFile = await detectVersionFile(cwd);

    const versions = (await git.tags())
      .filter((tag) => semverValid(tag))
      .map((tag) => new SemVer(tag));

    const currentVersion = versions.length
      ? versions[versions.length - 1]
      : versionFile
      ? await getVersionFromFile(versionFile)
      : undefined;

    if (!currentVersion) {
      throw new Error("failed to detect current version")
    }

    const isCurrVersionTagged = versions.includes(currentVersion);

    const commits = await git.commits(
      isCurrVersionTagged ? currentVersion.toString() : undefined,
    );

    const incrementType = getIncrementTypeFromCommits(commits);

    const nextVersion = new SemVer(currentVersion.toString());

    switch (incrementType) {
      case IncrementType.MAJOR:
        nextVersion.inc("major");
        break;

      case IncrementType.MINOR:
        nextVersion.inc("minor");
        break;

      case IncrementType.PATCH:
        nextVersion.inc("patch");
        break;
    }

    return new GitBump({
      ...options,
      versions,
      currentVersion,
      nextVersion,
      incrementType,
      versionFile,
    });
  }

  private get shouldLog() {
    return this.#verbose || this.#dryRun;
  }
}

async function detectVersionFile(cwd: string) {
  const dir = await Deno.lstat(cwd);

  if (!dir.isDirectory) {
    throw new Error(`Path is not a directory: ${cwd}`);
  }

  const entries = Deno.readDir(cwd);

  for await (const entry of entries) {
    if (KNOWN_VERSION_FILES.includes(entry.name)) {
      return entry.name;
    }
  }
}

async function getVersionFromFile(filePath: string) {
  const file = await Deno.readFile(filePath);
  const data = new TextDecoder("utf-8").decode(file);
  const match = data.match(/version(.+)?(?<version>[0-9]+.[0-9]+.[0-9]+)/);

  if (!match) {
    throw new Error(`Failed to get version from: ${filePath}`);
  }

  const version = match.groups?.version;

  if (!version) {
    throw new Error(`Failed to find a version in: ${filePath}`);
  }

  return new SemVer(version);
}

function getIncrementTypeFromCommits(commits: Array<Commit>) {
  return commits.reduce<IncrementType>((increment, { sha, message }) => {
    const match = message.match(CHANGE_TYPE_REGEXP);

    if (!match) {
      console.log(`Ignoring commit: ${message} (${sha})`);
      return increment;
    }

    const changeType: ChangeType = (match.groups?.changeType as ChangeType);

    if (!changeType) {
      console.log(`Ignoring commit: ${message} (${sha})`);
      return increment;
    }

    const commitIncrement = BUMP_MAP[changeType];

    if (increment < commitIncrement) {
      return increment;
    }

    return commitIncrement;
  }, IncrementType.NONE);
}

async function updateVersionFile(
  filePath: string,
  currentVersion: SemVer,
  nextVersion: SemVer,
) {
  const file = await Deno.readFile(filePath);
  const data = new TextDecoder("utf-8").decode(file);

  const updatedData = data.replace(
    currentVersion.toString(),
    nextVersion.toString(),
  );

  await Deno.writeFile(filePath, new TextEncoder().encode(updatedData));
}
