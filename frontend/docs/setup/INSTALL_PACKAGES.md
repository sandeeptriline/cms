# Install Missing Packages

## Current Issue

The `@radix-ui/react-checkbox` package needs to be installed.

## Installation

Run this command in your terminal:

```bash
cd frontend
npm install
```

This will install all packages including `@radix-ui/react-checkbox`.

**Note**: We use npm `overrides` in `package.json` to properly resolve the `lucide-react` peer dependency with React 19. This is the correct way to handle peer dependency conflicts without using `--legacy-peer-deps`.

Or fix npm permissions first:

```bash
sudo chown -R $USER:$USER ~/.npm
cd frontend
npm install @radix-ui/react-checkbox@^1.0.4
```

---

## All Radix UI Packages

The following Radix UI packages are used in the project:

```bash
cd frontend
npm install \
  @radix-ui/react-checkbox@^1.0.4 \
  @radix-ui/react-dialog@^1.0.5 \
  @radix-ui/react-dropdown-menu@^2.0.6 \
  @radix-ui/react-label@^2.0.2 \
  @radix-ui/react-select@^2.0.0 \
  @radix-ui/react-slot@^1.0.2 \
  @radix-ui/react-tabs@^1.0.4 \
  @radix-ui/react-toast@^1.1.5
```

Or install all at once:

```bash
cd frontend
npm install --legacy-peer-deps
```

This will install all packages listed in `package.json`, including the checkbox package.

---

**Last Updated**: 2026-02-11
