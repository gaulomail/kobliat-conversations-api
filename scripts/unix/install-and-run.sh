#!/bin/bash
# install-and-run.sh
# One-command setup and start script

set -e

# Setup/Install
./scripts/unix/setup-local.sh

# Start
./scripts/unix/start-all.sh
