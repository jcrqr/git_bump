# Git Bump CLI

> Command-line interface to automatically bump your project's version and changelog.

## Installation

Currently, it's only possible to install Git Bump using `deno install`:

```bash
$ deno install --allow-all https://raw.githubusercontent.com/crqra/git-bump/0.1.0/cli/git-bump.ts
```

Alternatively, you can download a pre-built binary from the [latest release](https://github.com/crqra/git-bump/releases/latest).

## Usage

```bash
git-bump

bumps the current project's version

Options:
  -v, --verbose          Be more verbose                               [boolean]
  -c, --current-version  Shows project's current version               [boolean]
  -n, --next-version     Shows project's next version                  [boolean]
  -d, --dry-run          Runs the command without creating and pushing the tag
                                                                       [boolean]
      --version          Show version number                           [boolean]
  -h, --help             Show help                                     [boolean]
```

## Examples

### Bump the version and changelog

```bash
$ git bump
```

### Checking the current version

```bash
$ git bump --current-version
# 0.1.0
```

### Checking the next version

```bash
$ git bump --next-version
# 0.1.1
```

### Checking the incrementation type

```bash
$ git bump --incrementation-type
# PATCH
```

### Bumping in "dry run" mode

```bash
$ git bump --dry-run
# bump: 0.1.0 -> 0.1.1 (PATCH)
# updating version file: version.ts
# committing changes
# pushing changes to origin
# creating new tag: 0.1.1
# pushing tag 0.1.1 to origin
# done
```

## Contributing

Please, see [CONTRIBUTING.md](CONTRIBUTING.md) to learn how you can contribute to this repository. Every contribution is welcome!

## License

This project is released under the [MIT License](LICENSE).