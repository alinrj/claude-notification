#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
APP_NAME="ClaudeNotifier"
BUNDLE_DIR="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$BUNDLE_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# When VENDOR_DIR is set, output there instead of installing to ~/.claude/
VENDOR_DIR="${VENDOR_DIR:-}"

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

SWIFT_SOURCES=(
    "$SCRIPT_DIR/Sources/Config.swift"
    "$SCRIPT_DIR/Sources/CLIParser.swift"
    "$SCRIPT_DIR/Sources/NotificationManager.swift"
    "$SCRIPT_DIR/Sources/main.swift"
)

SWIFT_FLAGS=(
    -O
    -framework UserNotifications
    -framework Foundation
)

echo "Compiling for arm64..."
swiftc "${SWIFT_FLAGS[@]}" \
    -target "arm64-apple-macosx13.0" \
    -o "$BUILD_DIR/claude-notifier-arm64" \
    "${SWIFT_SOURCES[@]}"

echo "Compiling for x86_64..."
swiftc "${SWIFT_FLAGS[@]}" \
    -target "x86_64-apple-macosx13.0" \
    -o "$BUILD_DIR/claude-notifier-x86_64" \
    "${SWIFT_SOURCES[@]}"

echo "Creating universal binary..."
lipo -create \
    "$BUILD_DIR/claude-notifier-arm64" \
    "$BUILD_DIR/claude-notifier-x86_64" \
    -output "$MACOS_DIR/claude-notifier"

# Clean intermediate binaries
rm -f "$BUILD_DIR/claude-notifier-arm64" "$BUILD_DIR/claude-notifier-x86_64"

# Copy resources
cp "$SCRIPT_DIR/Resources/Info.plist" "$CONTENTS_DIR/Info.plist"

if [ -f "$SCRIPT_DIR/Resources/AppIcon.icns" ]; then
    cp "$SCRIPT_DIR/Resources/AppIcon.icns" "$RESOURCES_DIR/AppIcon.icns"
fi

# Ad-hoc code sign (required for UNUserNotificationCenter)
codesign --force --sign - "$BUNDLE_DIR"

if [ -n "$VENDOR_DIR" ]; then
    # Output to vendor directory (for npm packaging)
    DEST="$SCRIPT_DIR/../$VENDOR_DIR"
    mkdir -p "$DEST"
    rm -rf "$DEST/$APP_NAME.app"
    cp -R "$BUNDLE_DIR" "$DEST/$APP_NAME.app"
    echo ""
    echo "Built: $BUNDLE_DIR"
    echo "Vendored: $DEST/$APP_NAME.app"
else
    # Install to ~/.claude/ (default for local dev)
    INSTALL_DIR="$HOME/.claude"
    mkdir -p "$INSTALL_DIR"
    rm -rf "$INSTALL_DIR/$APP_NAME.app"
    cp -R "$BUNDLE_DIR" "$INSTALL_DIR/$APP_NAME.app"
    echo ""
    echo "Built: $BUNDLE_DIR"
    echo "Installed: $INSTALL_DIR/$APP_NAME.app"
    echo "Run:   $INSTALL_DIR/$APP_NAME.app/Contents/MacOS/claude-notifier --title 'Test' --message 'Hello' --timeout 5"
fi
