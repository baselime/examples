import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";
import { Tags } from "aws-cdk-lib"

export default {
  config(_input) {
    return {
      name: "python-lambda",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "python3.10",
      tracing: "pass_through",
    })
    app.stack(API);
    Tags.of(app).add("baselime:tracing", `true`);
  }
} satisfies SSTConfig;

