# Contributing

We welcome contributions in several forms, e.g.

*   Sponsoring
*   Documenting
*   Testing
*   Coding
*   etc.

Please read [14 Ways to Contribute to Open Source without Being a Programming Genius or a Rock Star](http://blog.smartbear.com/programming/14-ways-to-contribute-to-open-source-without-being-a-programming-genius-or-a-rock-star/).

Please check [Issues](https://code.siemens.com/siemens/code/issues) and look for
unassigned ones or create a new one.

Working together in an open and welcoming environment is the foundation of our
success, so please respect our [Code of Conduct](CODE_OF_CONDUCT.md).

## Guidelines

### Workflow

We use the
[Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow)
and review all changes we merge to master.

### Commit Message

Commit messages shall follow the conventions defined by [conventional-changelog](https://wiki.siemens.com/display/en/Conventional+Changelog).

> **HINT**: A good way to create commit messages is by using the tool `git gui`.
>
> **NOTE**: Changes supposed to be upstreamed shall structure the
>           commit message according to the upstream project's guidelines.

#### What to use as scope

In most cases the changed component is a good choice as scope
e.g. if the change is done in the windows manual, the scope should be *windows*.

For documentation changes the section that was changed makes a good scope name
e.g. use *FAQ* if you changed that section.

### License Headers

The only license header we need for a software written by Siemens is:

```txt
# Copyright Siemens AG, YEAR
```

The YEAR shall reflect the creation date.

We appreciate if you share your code within the **Siemens family** and help us to
build the **corporate memory** of code. If you do so please add the following
license header for your project:

```txt
# Copyright Siemens AG, YEAR
# Licensed under the Siemens Inner Source License 1.1 or at your option any later version
```
