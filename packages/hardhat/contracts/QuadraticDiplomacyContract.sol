pragma solidity >=0.6.7 <0.9.0;
pragma experimental ABIEncoderV2;
//SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/access/AccessControl.sol";

contract QuadraticDiplomacyContract is AccessControl {

    event Vote(address votingAddress, string name, address wallet, uint256 amount);
    event AddMember(address admin, string name, address wallet);

    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");

    mapping (address => uint256) public votes;

    constructor(address startingAdmin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, startingAdmin);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require( hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NOT ADMIN");
        _;
    }

    modifier canVote() {
        require(
            hasRole(VOTER_ROLE, msg.sender),
            "You don't have the permission to vote."
        );
        _;
    }

    function vote(string memory name, address wallet, uint256 amount) private {
        require(votes[msg.sender] >= amount, "Not enough votes left");
        votes[msg.sender] -= amount;
        emit Vote(msg.sender, name, wallet, amount);
    }

    function voteMultiple(string[] memory names, address[] memory wallets, uint256[] memory amounts) public canVote {
        require(wallets.length == amounts.length, "Wrong size");
        require(wallets.length == names.length, "Wrong size");

        for (uint256 i = 0; i < wallets.length; i++) {
            vote(names[i], wallets[i], amounts[i]);
        }
    }

    function admin(address wallet, bool value) public onlyAdmin {
        if (value) {
            grantRole(DEFAULT_ADMIN_ROLE, wallet);
        } else {
            revokeRole(DEFAULT_ADMIN_ROLE, wallet);
        }
    }

    function giveVotes(address wallet, uint256 amount) public onlyAdmin {
        votes[wallet] += amount;
    }

    function addMember(string memory name, address wallet) public onlyAdmin {
        grantRole(VOTER_ROLE, wallet);
        emit AddMember(msg.sender, name, wallet);
    }

    function addMembersWithVotes(string[] memory names, address[] memory wallets, uint256 voteAllocation) public onlyAdmin {
        require(wallets.length == names.length, "Wrong size");

        for (uint256 i = 0; i < wallets.length; i++) {
            addMember(names[i], wallets[i]);
            giveVotes(wallets[i], voteAllocation);
        }
    }

    function payMultiple(address payable[] memory wallets, uint256[] memory amounts) public payable onlyAdmin {
        require(wallets.length == amounts.length, "Wrong size");

        // transfer the required amount of ether to each one of the wallets
        for (uint256 i = 0; i < wallets.length; i++)
            wallets[i].transfer(amounts[i]);
    }

}
