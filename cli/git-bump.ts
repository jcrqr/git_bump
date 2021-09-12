import { GitBump, yargs } from "./deps.ts";
import { version } from "../version.ts";

export interface GitBumpArgs {
  dryRun: boolean;
  currentVersion: boolean;
  nextVersion: boolean;
  incrementationType: boolean;
  verbose: boolean;
}

async function gitBump(args: GitBumpArgs) {
  const gb = await GitBump.init({
    cwd: Deno.cwd(),
    dryRun: args.dryRun,
    verbose: args.verbose,
  });

  if (args.currentVersion) {
    console.log(gb.currentVersion.toString());
    Deno.exit(0);
  }

  if (args.nextVersion) {
    console.log(gb.nextVersion.toString());
    Deno.exit(0);
  }

  if (args.incrementationType) {
    console.log(gb.incrementTypeName);
    Deno.exit(0);
  }

  console.log(
    `bump: ${gb.currentVersion} -> ${gb.nextVersion} (${gb.incrementTypeName})`,
  );

  await gb.bump();

  console.log("done");
}

yargs()
  .scriptName("git-bump")
  .command("$0", "bumps the current project's version", {}, gitBump)
  .alias("h", "help")
  .option("v", {
    alias: "verbose",
    type: "boolean",
    describe: "Be more verbose",
  })
  .option("c", {
    alias: "current-version",
    type: "boolean",
    describe: "Shows project's current version",
  })
  .option("n", {
    alias: "next-version",
    type: "boolean",
    describe: "Shows project's next version",
  })
  .option("i", {
    alias: "incrementation-type",
    type: "boolean",
    describe: "Shows project's next version incrementation type",
  })
  .option("d", {
    alias: "dry-run",
    type: "boolean",
    describe: "Runs the command without creating and pushing the tag",
  })
  .version(version)
  .parse(Deno.args);
