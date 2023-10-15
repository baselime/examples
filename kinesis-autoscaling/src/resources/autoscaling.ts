import {Construct} from "constructs";
import StepFunctions from "./stepFunctions";
import Alarm from "./alarm";

type KinesisAutoscalingProps = {
    streamName: string;
    streamArn: string;
}

export default class KinesisAutoscaling extends Construct {
    constructor(scope: Construct, id: string, props: KinesisAutoscalingProps) {
        super(scope, id);
        const stepFunctions = new StepFunctions(scope, "stepFunctions");
        new Alarm(scope, "alarm", {
            ...props,
            topic: stepFunctions.snsTopic,
        });
    }
}