#!/bin/bash
DIRECTORY=/opt/songuess_backend;

cd $DIRECTORY;

docker build -t songuess_backend $DIRECTORY

docker rm -f songuess_backend

docker run -d --name songuess_backend -p 5000:5000 songuess_backend:latest