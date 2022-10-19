#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LottaWebAppStack } from '../lib/lotta-web-app-stack';

const app = new cdk.App();
new LottaWebAppStack(app, 'LottaWebAppDev', {
    env:{
        region: 'us-east-1'
    }
});
