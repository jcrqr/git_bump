# :package: Git Bump

> A tool that automatically bumps your project's version and generates a changelog from your commits. Based on [SemVer](https://semver.org) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Goals

- Automatically bump a project's version and changelog from commits
- CI-friendly (i.e. flexible output that can be reused)
- Developer friendly (i.e. expose a module that can be used in other projects)
- Compatibility with [SemVer](https://semver.org) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- No additional configuration files for default usage

## Non-goals

- Customization. It's not out of the roadmap but it's not a priority

## Installation

- [Installing CLI](cli#installation)
- [Installing Library](lib#installation)

## Usage

```bash
$ git bump
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

## Documentation

- Check [lib](lib) for documentation on the library
- Check [cli](cli) for documentation on the command-line interface

## Supported Project Files

The following project files are currently supported. If Git Bump can't detect
the project file, it'll skip updating it and fail if there are no tags to get
the `latest` version from.

- `version.ts` - for Deno projects
- `package.json` - for NPM projects
- `pom.xml` - for Maven projects

## Contributing

Please, see [CONTRIBUTING.md](CONTRIBUTING.md) to learn how you can contribute to this repository. Every contribution is welcome!

## Acknowledgements

This project is heavily inspired on [Commitizen](https://github.com/commitizen-tools/commitizen). If you're looking for a more mature and customizable option, I highly recommend checking it out.

## License

This project is released under the [MIT License](LICENSE).