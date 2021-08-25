import React, { useState, useMemo } from "react";
import { Button, Card, Divider, Space, Typography, Badge, notification } from "antd";
import { Address, EtherInput, SpiderChart } from "../components";
const { Text, Title } = Typography;
const { ethers } = require("ethers");

const REWARD_STATUS = {
  PENDING: "reward_status.pending",
  COMPLETED: "reward_status.completed",
  FAILED: "reward_status.failed",
};

export default function QuadraticDiplomacyReward({ userSigner, votesEntries, contributorEntries, price, isAdmin }) {
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardStatus, setRewardStatus] = useState({});
  const [totalSquare, setTotalSquare] = useState(0);
  const [chartData, setChartData] = useState([[], []]);

  const [voteResults, totalSqrtVotes] = useMemo(() => {
    const votes = {};
    let sqrts = 0;
    votesEntries.forEach(entry => {
      const sqrtVote = Math.sqrt(entry.amount.toNumber());
      if (!votes[entry.wallet]) {
        votes[entry.wallet] = {
          name: entry.name,
          // Sum of the square root of the votes for each member.
          sqrtVote: 0,
          hasVoted: false,
        };
      }
      votes[entry.wallet].sqrtVote += sqrtVote;

      if (!votes[entry.wallet].hasVoted) {
        votes[entry.wallet].hasVoted = entry.votingAddress === entry.wallet;
      }

      // Total sum of the sum of the square roots of the votes for all members.
      sqrts += sqrtVote;
    });

    let total = 0;
    Object.entries(votes).forEach(([wallet, { name, sqrtVote }]) => {
      total += Math.pow(sqrtVote, 2);
    });

    setChartData(
      Object.entries(votes).reduce(
        (tupleArray, [_, tuple]) => [
          [...tupleArray[0], tuple.name],
          [...tupleArray[1], parseFloat(tuple.sqrtVote)],
        ],
        [[], []],
      ),
    );

    setTotalSquare(total);
    return [votes, sqrts];
  }, [votesEntries]);

  const missingVotingMembers = contributorEntries.filter(entry => !voteResults[entry.wallet]?.hasVoted);

  if (!isAdmin) {
    return (
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
        <Title level={4}>Access denied</Title>
        <p>Only admins can send rewards.</p>
      </div>
    );
  }

  const handlePayment = async (address, amount) => {
    if (rewardStatus[address] === REWARD_STATUS.COMPLETED || !amount) {
      return;
    }

    setRewardStatus(prev => ({
      ...prev,
      [address]: REWARD_STATUS.PENDING,
    }));

    try {
      await userSigner.sendTransaction({
        to: address,
        value: ethers.utils.parseEther(amount.toString()),
      });

      setRewardStatus(prev => ({
        ...prev,
        [address]: REWARD_STATUS.COMPLETED,
      }));

      notification.success({
        message: "Payment sent!",
      });
    } catch (error) {
      notification.error({
        message: "Payment Transaction Error",
        description: error.toString(),
      });
      setRewardStatus(prev => ({
        ...prev,
        [address]: REWARD_STATUS.FAILED,
      }));
    }
  };

  return (
    <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      <Title level={3}>Reward Contributors</Title>
      <Title level={5}>
        Total sqrt votes:&nbsp;&nbsp;
        <Badge
          showZero
          overflowCount={100000}
          count={totalSqrtVotes.toFixed(2)}
          style={{ backgroundColor: "#52c41a" }}
        />
      </Title>
      <Divider />
      <EtherInput autofocus placeholder="Reward amount" value={rewardAmount} onChange={setRewardAmount} price={price} />
      <Divider />
      {missingVotingMembers?.length > 0 && (
        <>
          <Title level={5}>Pending votes from</Title>
          {missingVotingMembers.map(entry => (
            <p key={entry.wallet}>
              <Address address={entry.wallet} fontSize={16} size="short" /> (<Text type="danger">{entry.name}</Text>)
            </p>
          ))}
        </>
      )}
      <Space direction="vertical" style={{ width: "100%" }}>
        {Object.entries(voteResults).map(([address, contributor]) => {
          const contributorShare = Math.pow(contributor.sqrtVote, 2) / totalSquare;
          const contributorReward = contributorShare * rewardAmount;

          return (
            <Card
              title={contributor.name}
              extra={
                <Button
                  onClick={() => handlePayment(address, contributorReward)}
                  disabled={
                    (rewardStatus[address] && rewardStatus[address] !== REWARD_STATUS.FAILED) || !contributorReward
                  }
                >
                  Pay 💸
                </Button>
              }
              key={address}
            >
              <p>
                <strong>Wallet: </strong> <Address address={address} fontSize={16} size="short" />
              </p>
              <p>
                <strong>Votes sqrt: </strong>
                {contributor.sqrtVote.toFixed(2)} <Text type="secondary">({(contributorShare * 100).toFixed(2)}%)</Text>
              </p>
              <p>
                <strong>Reward amount: </strong>
                {contributorReward.toFixed(6)} ETH
              </p>
              {!contributor.hasVoted && <Text mark>This member hasn't voted yet</Text>}
            </Card>
          );
        })}
      </Space>
      <Divider />
      <SpiderChart data={chartData[1]} names={chartData[0]} title="SqrVotes" chartType="area" />
    </div>
  );
}
