export interface SNSEvent {
    Records: SNSEventRecord[];
}

interface SNSEventRecord {
    EventVersion: string;
    EventSubscriptionArn: string;
    EventSource: string;
    Sns: SNSMessage;
}

interface SNSMessage {
    SignatureVersion: string;
    Timestamp: string;
    Signature: string;
    SigningCertUrl: string;
    MessageId: string;
    Message: string;
    MessageAttributes: SNSMessageAttributes;
    Type: string;
    UnsubscribeUrl: string;
    TopicArn: string;
    Subject: string;
    Token?: string;
}


interface SNSMessageAttributes {
    [name: string]: SNSMessageAttribute;
}

interface SNSMessageAttribute {
    Type: string;
    Value: string;
}
