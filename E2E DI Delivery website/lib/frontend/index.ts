import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { CachePolicy, Distribution, LambdaEdgeEventType, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy, experimental } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnPermission, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { S3 } from "aws-sdk";
import { Construct } from "constructs";
import * as path from "path";

export class Frontend extends Construct {
    /**
     * Bucket containing all frontend files.
     */
    public readonly hostingBucket: Bucket;

    public readonly loggingBucket: Bucket;
    /**
 * CloudFront distribution to access the web frontend.
 */
    public readonly hostingDistribution: Distribution;

    public constructor(scope: Construct, id: string, props?: any) {
        super(scope, id);
        this.hostingBucket = this.createHostingBucket();
        this.loggingBucket = this.createLoggingBucket();
        const identity = new OriginAccessIdentity(this, "HostingIdentity", {});
        this.hostingBucket.grantReadWrite(identity);


        const authEdgeLambda = this.createAuthLambda();

        this.hostingDistribution = this.createHostingDistribution(identity, authEdgeLambda);

        new BucketDeployment(this, "LottaTestDeployment", {
            sources: [Source.asset(path.join(__dirname, `/../frontend/cloudfront/html`))],
            destinationBucket: this.hostingBucket
        })
    }



    private createAuthLambda = () => {

        const auth = new experimental.EdgeFunction(this, 'LottaAuthLambdeEdge', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'auth.handler',
            code: Code.fromAsset(path.join(__dirname, 'cloudfront/lambdas/auth'))
        });
        auth.addToRolePolicy(this.createAuthLambdaPolicy())

        return auth
    }

    private createHostingDistribution = (identity: OriginAccessIdentity, authEdgeLambda: experimental.EdgeFunction) => {
        return new Distribution(this, "LottaTestDistribution", {
            comment: `Belongs to ${Stack.of(this).stackName}`,
            defaultBehavior: {
                origin: new S3Origin(this.hostingBucket, {
                    originAccessIdentity: identity,
                }),
                edgeLambdas: [
                    {
                        functionVersion: authEdgeLambda.currentVersion,
                        eventType: LambdaEdgeEventType.VIEWER_REQUEST
                    }
                ],
                cachePolicy: CachePolicy.CACHING_DISABLED,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            enableLogging: true,
            logBucket: this.loggingBucket,
            defaultRootObject: "index.html",
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                },
            ],
            enableIpv6: true,
            priceClass: PriceClass.PRICE_CLASS_100,
        });
    }

    private createHostingBucket(): Bucket {
        return new Bucket(this, "LottaTestHosting", {
            encryption: BucketEncryption.S3_MANAGED,
            removalPolicy: RemovalPolicy.DESTROY
        });
    }

    private createLoggingBucket(): Bucket {
        return new Bucket(this, "LottaTestLogging", {
            encryption: BucketEncryption.S3_MANAGED,
            removalPolicy: RemovalPolicy.DESTROY
        });
    }

    private createAuthLambdaPolicy() {
        const policy = {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetResourcePolicy",
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret",
                "secretsmanager:ListSecretVersionIds",
            ],
            "Resource": ["arn:aws:secretsmanager:*:927316385537:secret:*"]
        };
        return PolicyStatement.fromJson(policy);
    }




}