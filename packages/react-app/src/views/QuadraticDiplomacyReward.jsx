import React, { useState, useMemo } from "react";
import { Button, Divider, Space, Typography, Table, Tag, Row, Col, notification } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Address, EtherInput } from "../components";
const { Text, Title } = Typography;
const { ethers } = require("ethers");

const REWARD_STATUS = {
  PENDING: "reward_status.pending",
  COMPLETED: "reward_status.completed",
  FAILED: "reward_status.failed",
};
const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    defaultSortOrder: "descend",
    sorter: (a, b) => (b.name > a.name ? 1 : -1),
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address",
    render: address => <Address address={address} fontSize={16} size="short" />,
  },
  {
    title: "Votes Sqrt",
    dataIndex: "votesSqrt",
    key: "votesSqrt",
    defaultSortOrder: "descend",
    sorter: (a, b) => a.votesSqrt - b.votesSqrt,
    render: (votesSqrt, record) => (
      <p>
        {votesSqrt.toFixed(2)} <Text type="secondary">({(record.votesShare * 100).toFixed(2)}%)</Text>
      </p>
    ),
  },
  {
    title: "Reward Amount",
    dataIndex: "rewardAmount",
    key: "rewardAmount",
    defaultSortOrder: "descend",
    sorter: (a, b) => a.rewardAmount - b.rewardAmount,
    render: rewardAmount => <p>{rewardAmount.toFixed(6)} ETH</p>,
  },
  {
    title: "Has Voted",
    dataIndex: "hasVoted",
    key: "hasVoted",
    filters: [
      { text: "Yes", value: true },
      { text: "No", value: false },
    ],
    onFilter: (value, record) => record.hasVoted === value,
    render: hasVoted =>
      hasVoted ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="red" />,
  },
];

export default function QuadraticDiplomacyReward({ userSigner, votesEntries, contributorEntries, price, isAdmin }) {
  const [totalRewardAmount, setTotalRewardAmount] = useState(0);
  const [rewardStatus, setRewardStatus] = useState(REWARD_STATUS.PENDING);

  const [voteResults, totalSqrtVotes, totalSquare] = useMemo(() => {
    const votes = {};
    let sqrts = 0;
    let total = 0;
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

    Object.entries(votes).forEach(([wallet, { name, sqrtVote }]) => {
      total += Math.pow(sqrtVote, 2);
    });

    return [votes, sqrts, total];
  }, [votesEntries]);

  const dataSource = useMemo(
    () =>
      Object.entries(voteResults).map(([address, contributor]) => ({
        key: address,
        name: contributor?.name,
        address: address,
        votesSqrt: contributor?.sqrtVote,
        votesShare: Math.pow(contributor?.sqrtVote, 2) / totalSquare,
        rewardAmount: (Math.pow(contributor?.sqrtVote, 2) / totalSquare) * totalRewardAmount,
        hasVoted: contributor?.hasVoted,
      })),
    [votesEntries, totalSquare, totalRewardAmount],
  );

  const missingVotingMembers = contributorEntries?.filter(entry => !voteResults[entry.wallet]?.hasVoted);

  const handlePayment = async () => {
    try {
      // TODO: change this implementation
      await userSigner.sendTransaction({
        to: address,
        value: ethers.utils.parseEther(amount.toString()),
      });
      setRewardStatus(REWARD_STATUS.COMPLETED);
      notification.success({
        message: "Payment sent!",
      });
    } catch (error) {
      setRewardStatus(REWARD_STATUS.FAILED);
      notification.error({
        message: "Payment Transaction Error",
        description: error.toString(),
      });
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
        <Title level={4}>Access denied</Title>
        <p>Only admins can send rewards.</p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #cccccc", padding: 16, width: 1000, margin: "auto", marginTop: 64 }}>
      <Title level={3}>Reward Contributors</Title>
      <Title level={5}>
        Total sqrt votes:&nbsp;&nbsp;
        <Tag color="green">{totalSqrtVotes.toFixed(2)}</Tag>
      </Title>
      <Divider />
      <Row justify="center">
        <Col sm={10}>
          <EtherInput
            autofocus
            placeholder="Reward amount"
            value={totalRewardAmount}
            onChange={setTotalRewardAmount}
            price={price}
          />
        </Col>
      </Row>
      <Divider />
      <Space direction="vertical" style={{ width: "100%" }}>
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
        <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 10 }} />
      </Space>
      <Divider />
      <Divider>
        <Button
          onClick={handlePayment}
          disabled={rewardStatus !== REWARD_STATUS.PENDING || !totalRewardAmount}
          size="large"
        >
          Pay 💸
        </Button>
      </Divider>
    </div>
  );
}
