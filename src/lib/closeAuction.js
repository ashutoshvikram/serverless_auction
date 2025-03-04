import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: "set #status=:status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };
  await dynamodb.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;
  if (amount === 0) {
    await sqs
      .sendMessage({
        QueueUrl: process.env.MAILQUEUE_URL,
        MessageBody: JSON.stringify({
          subject: "No bids on your auction item ",
          recipient: seller,
          body: `Sorry!!Your item ${item} has not got any bid.Better luck next time... `,
        }),
      })
      .promise();
  }

  const notifySeller = sqs
    .sendMessage({
      QueueUrl: process.env.MAILQUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "Your item has been sold",
        recipient: bidder,
        body: `Woohooo!!Your item ${title} has been sold for Rs.${amount}/- `,
      }),
    })
    .promise();

  const notifyBidder = sqs
    .sendMessage({
      QueueUrl: process.env.MAILQUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "You won an auction",
        recipient: seller,
        body: `Congrats!!You got yourself ${title} for ${amount}`,
      }),
    })
    .promise();

  return Promise.all([notifyBidder, notifySeller]);
}
