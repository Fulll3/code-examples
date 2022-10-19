import { Duration, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import { Frontend } from './frontend';
export class LottaWebAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const frontEnd = new Frontend(this, "LottaTestFrontend")
  }

}