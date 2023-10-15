import { Construct } from "constructs";
import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import * as sns from "@aws-cdk/aws-sns";
import * as ssm from '@aws-cdk/aws-ssm';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as iam from "@aws-cdk/aws-iam";
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources";
import * as path from "path";

export default class StepFunctions extends Construct {
    public readonly snsTopic: sns.Topic;
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const kinesisScalingSnsTopic = new sns.Topic(this, "kinesisAutoScalingSnsTopic", {
            displayName: `${id}-kinesisAutoScaling`,
            topicName: `${id}-kinesisScalingSnsTopic`,
        });
        this.snsTopic = kinesisScalingSnsTopic;

        new ssm.StringParameter(this, "kinesis-autoscaling-topic-arn", {
            parameterName: `/baselime/kinesis-auto-scaling/sns-topic-arn/${id}`,
            stringValue: kinesisScalingSnsTopic.topicArn,
            description: "Contains parameters required for scaling kinesis stream",
            type: ssm.ParameterType.STRING,
            tier: ssm.ParameterTier.STANDARD,
            allowedPattern: ".*",
        });

        const lambdaPath = path.join(__dirname, "../lambdas");

        const scalingFunction = new lambda.Function(this, "kinesis-scaler", {
            code: lambda.Code.fromAsset(lambdaPath),
            functionName: `${id}-kinesis-scaler`,
            handler: "kinesisScaling.main",
            memorySize: 128,
            timeout: Duration.seconds(120),
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                MAX_SHARDS: "32",
            },
        });
        scalingFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "kinesis:UpdateShardCount",
                    "kinesis:ListShards",
                    "kinesis:DescribeStreamSummary",
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                    "arn:aws:kinesis:*:*:stream/*",
                ],
            })
        )
        scalingFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "cloudwatch:DescribeAlarms",
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                    "arn:aws:cloudwatch:*:*:alarm:*",
                ],
            })
        )


        const scaleInvoke = new tasks.LambdaInvoke(this, "Scaling invocation", {
            lambdaFunction: scalingFunction,
            comment: "Invoke the scaling function",
            resultPath: "$.LambdaOutput",
        });

        const scaleWait = cdk.Duration.minutes(2);
        const waitX = new sfn.Wait(this, `Wait ${scaleWait.toMinutes()} minutes`, {
            time: sfn.WaitTime.duration(scaleWait),
        }).next(scaleInvoke);

        const choice = new sfn.Choice(this, 'Should sleep?', {
            inputPath: '$.LambdaOutput.Payload.result',
        })
            .when(sfn.Condition.booleanEquals('$.shouldSleep', true), waitX)
            .otherwise(new sfn.Pass(this, 'Scaling complete'));

        scaleInvoke.next(choice);

        const stateMachine = new sfn.StateMachine(this, "kinesis-scaler-state-machine", {
            definition: scaleInvoke,
            stateMachineName: "kinesis-scaler-state-machine",
        });

        new lambda.Function(this, "kinesis-scaler-entry", {
            code: lambda.Code.fromAsset(lambdaPath),
            functionName: `${id}-kinesis-scaler`,
            handler: "kinesisScalingStart.main",

            timeout: Duration.seconds(120),
            memorySize: 128,
            runtime: lambda.Runtime.NODEJS_14_X,
            events: [new lambdaEventSources.SnsEventSource(this.snsTopic)],
            environment: {
                STATE_MACHINE_ARN: stateMachine.stateMachineArn,
            },
        });
        scalingFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "states:StartExecution",
                ],
                effect: iam.Effect.ALLOW,
                resources: [
                    stateMachine.stateMachineArn,
                ],
            })
        );
    }
}
