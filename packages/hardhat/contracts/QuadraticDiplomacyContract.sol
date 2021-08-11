//SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// import "./mocks/mockDAO.sol";

contract QuadraticDiplomacyContract is Ownable, AccessControl {
    event Vote(address votingAddress, address wallet, uint256 amount);
    event AddEntry(address admin, string name, address wallet);

    uint256 constant VOTE_ALLOCATION = 10;
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");

    mapping(address => uint256) public votes;

    modifier canVote() {
        require(
            hasRole(VOTER_ROLE, msg.sender),
            "You don't have the permission to vote."
        );
        require(votes[msg.sender] > 0, "No more vote points left");
        _;
    }

    modifier matchingWalletAmountRatio(
        address[] memory members,
        uint256[] memory _votes
    ) {
        require(
            members.length == _votes.length,
            "Mismatching address to votes ratio"
        );
        _;
    }

    constructor(address admin) public {
        // todo: setup admin as well?
        _setupRole(DEFAULT_ADMIN_ROLE, admin); // admin role access (different from Owner)
        _setupRole(VOTER_ROLE, admin); // voter role access
        transferOwnership(admin); // transfer contract ownership to specified admin
    }

    function vote(address[] memory members, uint256[] memory _votes)
        public
        canVote
        matchingWalletAmountRatio(members, _votes)
    {
        for (uint256 i = 0; i < members.length; i++) {
            uint256 currentVote = _votes[i];
            address currentMember = members[i];
            require(votes[msg.sender] >= currentVote, "Not enough votes left");

            votes[msg.sender] -= currentVote;

            emit Vote(msg.sender, currentMember, currentVote);
        }
    }

    function addVoter(address member) public onlyOwner {
        grantRole(VOTER_ROLE, member);
        giveVotes(member, VOTE_ALLOCATION);
    }

    function giveVotes(address wallet, uint256 amount) public onlyOwner {
        votes[wallet] += amount;
    }

    function addEntry(string memory name, address wallet) public onlyOwner {
        emit AddEntry(msg.sender, name, wallet);
    }
}
