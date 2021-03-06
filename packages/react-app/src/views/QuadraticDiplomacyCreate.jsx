import React, { useState } from "react";
import { Form, Input, Divider, Button, Typography, Row, Col, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { DeleteOutlined } from "@ant-design/icons";
import { AddressInput } from "../components";
const { Title } = Typography;

export default function QuadraticDiplomacyCreate({ mainnetProvider, tx, writeContracts }) {
  const [voters, setVoters] = useState([""]);
  const [voteAllocation, setVoteAllocation] = useState(0);
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    // ToDo. Check if addresses are valid.
    setIsSendingTx(true);
    const filteredVoters = voters.filter(voter => voter);
    await tx(writeContracts.QuadraticDiplomacyContract.addMembersWithVotes(filteredVoters, voteAllocation), update => {
      if (update && (update.status === "confirmed" || update.status === 1)) {
        setVoters([""]);
        setVoteAllocation(0);
        form.resetFields();
        setIsSendingTx(false);
      } else if (update.error) {
        setIsSendingTx(false);
      }
    });
  };

  return (
    <div style={{ border: "1px solid", padding: "40px", width: "800px", margin: "64px auto 0px auto", textAlign: "left" }}>
      <Title level={3} style={{ fontFamily: "Space Mono" }}>Add members</Title>
      <Divider />
      <Form form={form} name="basic" onFinish={handleSubmit} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} layout="horizontal">
        <Form.Item label="Vote Allocation" name="voteCredit" style={{ textAlign: "left" }} tooltip="Number of votes each voter will have">
          <Input
            type="number"
            placeholder="100"
            style={{ width: "30%" }}
            onChange={event => setVoteAllocation(event.target.value)}
          />
        </Form.Item>
        <Divider />
        {voters.map((_, index) => (
          <VoterInput
            key={index}
            index={index}
            setVoters={setVoters}
            voters={voters}
            mainnetProvider={mainnetProvider}
          />
        ))}
        <Form.Item style={{ justifyContent: "center", marginTop: 24 }}>
          {/*ToDo. Restart ant form state (the browser is keeping filled-removed elements)*/}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setVoters(prevVoters => [...prevVoters, ""])}
          >
            Add Voter
          </Button>
        </Form.Item>
        <Divider />
        <Form.Item wrapperCol={{ offset: 16, span: 8 }}>
          {/*ToDo Disable if empty members */}
          {!isSendingTx ? (
            <Button type="primary" htmlType="submit" block disabled={!voteAllocation}>
              Submit
            </Button>
          ) : (
            <Spin size="small" />
          )}
        </Form.Item>
      </Form>
    </div>
  );
}

const VoterInput = ({ index, voters, setVoters, mainnetProvider }) => {
  return (
    <>
      <Form.Item label={`Voter ${index + 1}`} name={`address[${index}]`} style={{ marginBottom: "16px" }}>
        <Row gutter={8} align="middle">
          <Col span={16}>
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="Enter address"
              value={voters[index]}
              onChange={address => {
                setVoters(prevVoters => {
                  const nextVoters = [...prevVoters];
                  nextVoters[index] = address;
                  return nextVoters;
                });
              }}
            />
          </Col>
          <Col span={8}>
            <DeleteOutlined
              style={{ cursor: "pointer", color: "#ff6666" }}
              onClick={event => {
                setVoters(prevVoters => {
                  const nextVoters = [...prevVoters];
                  return nextVoters.filter((_, i) => i !== index);
                });
              }}
            />
          </Col>
        </Row>
      </Form.Item>
    </>
  );
};
