# package-version-checker-action

> GitHub Action to detect version changes in package.json files

## Usage

Add this to your GitHub workflow:

```yaml
name: Check Version
on:
  push:
    paths:
      - '**/package.json'

jobs:
  check-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Check package.json version
        uses: your-username/package-version-checker-action@v1
        id: version_check
        with:
          path: './'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Handle version change
        if: steps.version_check.outputs.has_changed == 'true'
        run: |
          echo "Version changed from ${{ steps.version_check.outputs.old_version }} to ${{ steps.version_check.outputs.new_version }}"
```

## Inputs

| Name | Description | Required | Default |
| --- | --- | --- | --- |
| `path` | Path to package.json file | `false` | `./` |

## Outputs

| Name | Description | Example |
| --- | --- | --- |
| `has_changed` | True if version has changed | `true` |
| `old_version` | Previous version | `1.0.0` |
| `new_version` | Current version | `1.0.1` |

## Development
## License

[Apache-2.0](LICENSE)
