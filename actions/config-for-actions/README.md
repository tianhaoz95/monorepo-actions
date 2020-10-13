# Config for Actions

**The code in the action's repository is a mirror, please check [the main repository](https://github.com/tianhaoz95/monorepo-actions/tree/main/actions/config-for-actions).**

Reusable configuration for all GitHub Actions workflows.

It's common for a repository to have multiple GitHub Action workflows and they all need to be configured with similar environments.

For example, you might have a Flutter environment configured per workflow:

```yml
- uses: subosito/flutter-action@v1
  with:
    flutter-version: "1.12.13+hotfix.5"
    channel: "stable"
```

When it's time to upgrade to the next Flutter version, it's a lot of effort to update all of them.

**Config for Actions** allows you to define them in a single location and reuse them across all workflows:

```yml
- uses: Monorepo-Actions/config-for-actions@main
  id: get_action_configs
    with:
      config_files: ./action-config.json
- uses: subosito/flutter-action@v1
  with:
    flutter-version: ${{ steps.get_action_configs.outputs.flutter_version }}
    channel: ${{ steps.get_action_configs.outputs.flutter_channel }}
```

with `action-config.json` being something like:

```json
{
    "flutter_version": "1.12.13+hotfix.5",
    "flutter_channel": "stable"
}
```