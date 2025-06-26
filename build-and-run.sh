#!/bin/bash

set -e

cd /home/ec2-user/bet-profile

echo "Resetting to origin/master..."
git reset --hard origin/master

echo "Building frontend..."
cd frontend
npm run build
cd ..

cd backend

node index.js
