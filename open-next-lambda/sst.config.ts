import { Tags } from "aws-cdk-lib/core";
import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "otel-lambda-next",
      region: "eu-west-2",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new NextjsSite(stack, "site");

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });

    Tags.of(app).add("baselime:tracing", "true");
  },
} satisfies SSTConfig;
